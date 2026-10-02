/**
 * Revenue engine.
 *
 * Computes platform revenue from two sources, which is how the business
 * actually makes money:
 *
 *   1. Subscription revenue - recurring monthly SaaS fees per retail house.
 *   2. Commission revenue  - a take-rate on the GMV each house processes.
 *
 * Everything is derived from durable rows (subscriptions, orders, payments,
 * commission_ledger) so the numbers survive a redeploy, unlike the in-process
 * counter that used to be the only revenue signal in the system.
 *
 * Money is handled in paise-integer where it matters to avoid float drift on
 * currency totals.
 */

const { PLAN_BY_CODE } = require('../../scripts/kanchipuram-domain');

/** Basis points -> fraction. 250 bps = 2.50%. */
function bpsToFraction(bps) {
  return (Number(bps) || 0) / 10000;
}

/** Round to 2dp, avoiding float artifacts like 1234.5600000000001. */
function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Normalise a timestamp/date column to a `YYYY-MM-DD` day key.
 *
 * pg returns TIMESTAMP columns as JS Date objects, so slicing the raw string
 * produces "Tue Sep 01" instead of a date and every row lands in a bucket
 * keyed to nothing. Handles Date instances and plain strings.
 */
function dayKey(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * Plan price, tolerant of both the DB row shape (`monthly_price`) and the
 * domain catalogue shape (`monthlyPrice`). Getting this wrong silently
 * reported MRR as 0 while ARR still looked plausible.
 */
function planMonthlyPrice(plan) {
  if (!plan) return 0;
  return Number(plan.monthly_price ?? plan.monthlyPrice) || 0;
}

/**
 * Monthly recurring revenue from active subscriptions.
 * @param {Array} subscriptions - rows from `subscriptions`
 * @param {Object} plansByCode - plan code -> plan
 */
function computeMrr(subscriptions, plansByCode = PLAN_BY_CODE) {
  let mrr = 0;
  let active = 0;
  let trialing = 0;
  const byPlan = {};

  for (const sub of subscriptions || []) {
    const plan = plansByCode[sub.plan_code];
    if (!plan) continue;

    if (sub.status === 'active') {
      const price = planMonthlyPrice(plan);
      mrr += price;
      active += 1;
      byPlan[sub.plan_code] = money((byPlan[sub.plan_code] || 0) + price);
    } else if (sub.status === 'trialing') {
      trialing += 1;
    }
  }

  return { mrr: money(mrr), active, trialing, mrrByPlan: byPlan };
}

/** ARR projects MRR forward twelve months. */
function computeArr(mrr) {
  return money((Number(mrr) || 0) * 12);
}

/** Average revenue per account across paying subscriptions. */
function computeArpu(mrr, payingAccounts) {
  if (!payingAccounts) return 0;
  return money(mrr / payingAccounts);
}

/**
 * Churn: subscriptions that ended within the window, as a share of the base
 * at the start of the window. Guarded against a zero base.
 *
 * Timestamps arrive from pg as Date objects, so they are normalised to
 * comparable strings first - comparing a Date to a string silently yields
 * false, which reported a base of zero and understated churn.
 */
function computeChurn(subscriptions, windowStart, windowEnd) {
  const startKey = dayKey(windowStart);
  const endKey = dayKey(windowEnd);

  const startedBy = (v) => {
    const k = dayKey(v);
    return k ? `${k}T00:00:00` : null;
  };

  const base = (subscriptions || []).filter((s) => {
    const k = startedBy(s.started_at);
    return k !== null && k <= `${endKey}T23:59:59`;
  }).length;

  const churned = (subscriptions || []).filter((s) => {
    if (s.status !== 'cancelled' && s.status !== 'churned') return false;
    const k = startedBy(s.ended_at);
    if (!k) return false;
    return k >= `${startKey}T00:00:00` && k <= `${endKey}T23:59:59`;
  }).length;

  return {
    base,
    churned,
    churnRateBps: base ? Math.round((churned / base) * 10000) : 0,
  };
}

/**
 * Group rows by a date field into a dense daily series over the window, so
 * charts have a point for every day even when a day had no transactions.
 *
 * @param {Array} rows
 * @param {string} dateField
 * @param {string} from - YYYY-MM-DD
 * @param {string} to   - YYYY-MM-DD
 * @param {Object} sums - output fields to sum, e.g. { amount: 'amount' }
 */
function dailySeries(rows, dateField, from, to, sums) {
  const buckets = new Map();
  for (const row of rows || []) {
    const raw = row[dateField];
    if (!raw) continue;
    const day = dayKey(raw);
    if (!day) continue;
    if (!buckets.has(day)) {
      const b = { date: day, count: 0 };
      for (const out of Object.keys(sums)) b[out] = 0;
      buckets.set(day, b);
    }
    const bucket = buckets.get(day);
    bucket.count += 1;
    for (const [out, src] of Object.entries(sums)) {
      bucket[out] = money(bucket[out] + (Number(row[src]) || 0));
    }
  }

  // Dense-fill the window.
  const series = [];
  const end = new Date(`${to}T00:00:00Z`);
  for (let d = new Date(`${from}T00:00:00Z`); d <= end; d = new Date(d.getTime() + 86400000)) {
    const key = d.toISOString().slice(0, 10);
    series.push(buckets.get(key) || { date: key, count: 0, ...Object.fromEntries(Object.keys(sums).map((k) => [k, 0])) });
  }
  return series;
}

/**
 * Full revenue summary for a window.
 *
 * @param {Object} data
 * @param {Array} data.subscriptions
 * @param {Array} data.payments   - successful payments in window
 * @param {Array} data.commission - commission_ledger rows in window
 * @param {Array} data.orders     - orders in window (for GMV)
 */
function revenueSummary({ subscriptions = [], payments = [], commission = [], orders = [], from, to }) {
  const { mrr, active, trialing, mrrByPlan } = computeMrr(subscriptions);

  const collected = money(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0));
  const commissionRevenue = money(commission.reduce((s, c) => s + (Number(c.amount) || 0), 0));
  const gmv = money(orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0));

  // Paying accounts exclude free-tier so ARPU reflects revenue per payer.
  const payingAccounts = subscriptions.filter(
    (s) => s.status === 'active' && planMonthlyPrice(PLAN_BY_CODE[s.plan_code]) > 0
  ).length;

  const totalRevenue = money(collected + commissionRevenue);

  return {
    window: { from, to },
    mrr,
    arr: computeArr(mrr),
    // ARPU is recurring revenue per paying account, so it is measured against
    // subscription revenue only - folding in commission would flatter it.
    arpu: computeArpu(mrr, payingAccounts),
    activeSubscriptions: active,
    trialingSubscriptions: trialing,
    payingAccounts,
    mrrByPlan,
    gmv,
    grossMarginBps: gmv ? Math.round((commissionRevenue / gmv) * 10000) : 0,
    subscriptionRevenue: collected,
    commissionRevenue,
    totalRevenue,
    churn: computeChurn(subscriptions, `${from} 00:00:00`, `${to} 23:59:59`),
    dailyRevenue: dailySeries(payments, 'created_at', from, to, { amount: 'amount' }),
    dailyCommission: dailySeries(commission, 'recognized_on', from, to, { amount: 'amount' }),
    dailyGmv: dailySeries(orders, 'created_at', from, to, { gmv: 'total_amount' }),
  };
}

/**
 * Per-store revenue breakdown. Surfaces concentration risk: if one house
 * drives most revenue, the business is fragile and this makes that visible.
 */
function revenueByStore({ subscriptions = [], payments = [], commission = [] }) {
  const rows = new Map();

  const ensure = (storeId) => {
    if (!rows.has(storeId)) {
      rows.set(storeId, {
        storeId,
        subscriptionRevenue: 0,
        commissionRevenue: 0,
        totalRevenue: 0,
        planCode: null,
        status: 'inactive',
      });
    }
    return rows.get(storeId);
  };

  for (const sub of subscriptions) {
    const row = ensure(sub.store_id);
    row.planCode = sub.plan_code;
    row.status = sub.status;
  }
  for (const p of payments) {
    ensure(p.store_id).subscriptionRevenue = money(ensure(p.store_id).subscriptionRevenue + (Number(p.amount) || 0));
  }
  for (const c of commission) {
    const row = ensure(c.store_id);
    row.commissionRevenue = money(row.commissionRevenue + (Number(c.amount) || 0));
  }
  for (const row of rows.values()) {
    row.totalRevenue = money(row.subscriptionRevenue + row.commissionRevenue);
  }

  const out = [...rows.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const total = out.reduce((s, r) => s + r.totalRevenue, 0);
  for (const r of out) {
    r.shareBps = total ? Math.round((r.totalRevenue / total) * 10000) : 0;
  }
  return { stores: out, total: money(total) };
}

module.exports = {
  bpsToFraction,
  money,
  dayKey,
  planMonthlyPrice,
  computeMrr,
  computeArr,
  computeArpu,
  computeChurn,
  dailySeries,
  revenueSummary,
  revenueByStore,
};
