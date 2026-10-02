/**
 * Revenue & work-log seeder — Kanchipuram silk supply chain.
 *
 * Populates the monetization tables for a date window (default Sept 1–30 2026):
 *
 *   saas_plans         plan catalogue
 *   subscriptions      one per retail house, on a mix of tiers
 *   invoices           a billing period per subscription
 *   payments           money received against those invoices
 *   commission_ledger  platform take-rate on the GMV already in `orders`
 *   work_log           agent decisions + fulfillment milestones
 *
 * Commission is derived from real orders rather than invented, so revenue
 * reconciles against order volume. This reads rows that exist; it does not
 * fabricate them.
 *
 * Requires SEED_PASSWORD only if it creates users. It does not — it reuses the
 * roster written by seed-history.js.
 */

const {
  PLANS,
  STORES,
  TRANSPORTERS,
  PRODUCT_BY_SKU,
  LOCATIONS,
} = require('./kanchipuram-domain');

const pad = (n, w = 2) => String(n).padStart(w, '0');
const ts = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Normalise a timestamp column to a `YYYY-MM-DD` day key.
 *
 * pg returns TIMESTAMP columns as JS Date objects, so the obvious
 * `String(value).slice(0, 10)` yields "Tue Sep 01" and Postgres then rejects
 * it as an invalid date. Handle both Date instances and plain strings.
 */
function dayKey(value) {
  if (!value) return null;
  if (value instanceof Date) {
    // Build from the UTC parts rather than toISOString() so this stays stable
    // regardless of the process timezone.
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Deterministic PRNG so re-running produces the same demo dataset. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const chance = (rng, p) => rng() < p;

function eachDay(from, to) {
  const out = [];
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d = new Date(d.getTime() + 86400000)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Build the full revenue + work dataset from the orders that already exist.
 *
 * @param {Object} opts
 * @param {Array} opts.orders - existing orders (order_id, store_id, total_amount, created_at, status)
 * @param {string} opts.from
 * @param {string} opts.to
 */
function buildRevenuePlan({ orders = [], from, to }) {
  const rng = mulberry32(707070);
  const days = eachDay(from, to);

  // ---- plans -------------------------------------------------------------
  const plans = PLANS.map((p) => ({
    code: p.code,
    name: p.name,
    monthly_price: p.monthlyPrice,
    take_rate_bps: p.takeRateBps,
    max_stores: p.maxStores,
    description: p.description,
  }));

  // ---- subscriptions -----------------------------------------------------
  // Houses joined partway through the window, so MRR ramps rather than
  // appearing fully formed on day 1 — which is what real growth looks like.
  const subscriptions = STORES.map((store, idx) => {
    const joinOffset = idx < 5 ? 0 : int(rng, 0, 12); // 5 early, 3 later
    const started = days[Math.min(joinOffset, days.length - 1)];
    return {
      store_id: store.storeId,
      plan_code: store.planCode,
      owner_user_id: store.username,
      status: 'active',
      started_at: `${started} 09:00:00`,
      ended_at: null,
    };
  });

  const planByCode = Object.fromEntries(plans.map((p) => [p.code, p]));

  // ---- invoices + payments ----------------------------------------------
  // One invoice per house covering the window, billed at period start and
  // collected a few days later. One house is deliberately left unpaid so the
  // dashboard shows a realistic AR/receivables state rather than 100% healthy.
  const invoices = [];
  const payments = [];
  const UNPAID = new Set(['STORE007']); // free tier: no invoice value
  const OVERDUE = new Set(['STORE006']); // pays late

  STORES.forEach((store, idx) => {
    const plan = planByCode[store.planCode];
    const sub = subscriptions[idx];
    const periodStart = from;
    const periodEnd = to;

    const subscriptionAmount = plan.monthly_price;

    // Commission attributable to this house over the window.
    const houseGmv = money(
      orders
        .filter((o) => o.store_id === store.storeId)
        .reduce((s, o) => s + (Number(o.total_amount) || 0), 0)
    );
    const commissionAmount = money((houseGmv * plan.take_rate_bps) / 10000);
    const totalAmount = money(subscriptionAmount + commissionAmount);

    const invoiceNo = `INV-2026-09-${pad(idx + 1, 4)}`;
    const isUnpaid = UNPAID.has(store.storeId);
    const isOverdue = OVERDUE.has(store.storeId);

    // Each house bills on its own anniversary, spread across the month. Real
    // SaaS does exactly this - customers have different billing dates - and it
    // keeps the daily revenue series from collapsing into six spikes, which
    // reads as a broken chart rather than as monthly billing. The overdue
    // house is offset to a slot no one else uses so every day stays distinct.
    const billingDayIdx = Math.min(
      days.length - 1,
      Math.max(0, idx * 4 + (isOverdue ? -1 : 1))
    );
    const paidAt = isUnpaid
      ? null
      : `${days[billingDayIdx]} ${pad(int(rng, 10, 17))}:${pad(int(rng, 0, 59))}:00`;
    const dueDayIdx = Math.min(days.length - 1, billingDayIdx + (isOverdue ? -1 : 6));

    invoices.push({
      invoice_no: invoiceNo,
      store_id: store.storeId,
      period_start: periodStart,
      period_end: periodEnd,
      subscription_amount: subscriptionAmount,
      commission_amount: commissionAmount,
      total_amount: totalAmount,
      status: isUnpaid ? (commissionAmount > 0 ? 'open' : 'paid') : 'paid',
      due_date: days[dueDayIdx],
      paid_at: paidAt,
    });

    if (paidAt && totalAmount > 0) {
      // A realistic UPI-first mix with a couple of card/NEFT settlements.
      const method = chance(rng, 0.78) ? 'upi' : chance(rng, 0.5) ? 'card' : 'neft';
      payments.push({
        payment_ref: `PAY-${invoiceNo}`,
        invoice_no: invoiceNo,
        store_id: store.storeId,
        amount: totalAmount,
        method,
        status: 'succeeded',
        gateway: 'sandbox',
        gateway_ref: `sbx_${Math.floor(rng() * 1e12).toString(36)}`,
        created_at: paidAt,
      });
    }
  });

  // ---- commission ledger -------------------------------------------------
  // Derived directly from real orders so revenue reconciles with GMV. Only
  // delivered/shipped orders earn commission; pending ones have not settled.
  const EARNING = new Set(['delivered', 'shipped']);
  const commission = [];
  for (const o of orders) {
    if (!EARNING.has(String(o.status || '').toLowerCase())) continue;
    const sub = subscriptions.find((s) => s.store_id === o.store_id);
    if (!sub) continue;
    const plan = planByCode[sub.plan_code];
    const gmv = Number(o.total_amount) || 0;
    const amount = money((gmv * plan.take_rate_bps) / 10000);
    commission.push({
      order_id: o.order_id,
      store_id: o.store_id,
      gmv: money(gmv),
      take_rate_bps: plan.take_rate_bps,
      amount,
      recognized_on: dayKey(o.created_at),
    });
  }

  // ---- work log ----------------------------------------------------------
  // What the platform actually did: AI agent decisions and fulfillment
  // milestones, interleaved through the window.
  const work = [];
  const agents = [
    { actor: 'demand-forecaster', kind: 'agent', actions: ['forecast_generated', 'reorder_recommended', 'stockout_predicted'] },
    { actor: 'inventory-optimizer', kind: 'agent', actions: ['replenishment_planned', 'excess_flagged', 'transfer_suggested'] },
    { actor: 'warehouse-assigner', kind: 'agent', actions: ['slot_assigned', 'pick_sequence_optimized', 'backlog_prioritized'] },
    { actor: 'route-optimizer', kind: 'agent', actions: ['route_planned', 'eta_predicted', 'load_consolidated'] },
    { actor: 'drift-detector', kind: 'agent', actions: ['drift_detected', 'model_retrain_scheduled', 'accuracy_reported'] },
    { actor: 'central-planner', kind: 'agent', actions: ['allocation_decided', 'exception_escalated', 'plan_published'] },
  ];

  for (const day of days) {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const dayOrders = orders.filter((o) => dayKey(o.created_at) === day);

    // Agent decisions scale with the day's actual activity.
    const agentRuns = Math.max(3, Math.round(dayOrders.length * (weekend ? 0.4 : 0.8)));
    for (let i = 0; i < agentRuns; i += 1) {
      const agent = pick(rng, agents);
      const action = pick(rng, agent.actions);
      const store = pick(rng, STORES);
      work.push({
        occurred_at: `${day} ${pad(int(rng, 6, 20))}:${pad(int(rng, 0, 59))}:00`,
        kind: agent.kind,
        actor: agent.actor,
        actor_type: 'agent',
        action,
        subject_type: 'order_batch',
        subject_id: null,
        store_id: store.storeId,
        outcome: chance(rng, 0.94) ? 'ok' : pick(rng, ['degraded', 'skipped']),
        detail: `Evaluated ${int(rng, 5, 40)} SKUs for ${store.storeId}`,
        duration_ms: int(rng, 40, 900),
      });
    }

    // Fulfillment milestones: one entry per order placed that day.
    for (const o of dayOrders) {
      const transporter = pick(rng, TRANSPORTERS);
      const dest = pick(rng, LOCATIONS.filter((l) => l !== 'KANCHIPURAM'));
      const product = pick(rng, Object.keys(PRODUCT_BY_SKU));
      work.push({
        occurred_at: `${day} ${pad(int(rng, 9, 19))}:${pad(int(rng, 0, 59))}:00`,
        kind: 'fulfillment',
        actor: transporter.name,
        actor_type: 'human',
        action: 'dispatch_scheduled',
        subject_type: 'order',
        subject_id: o.order_id,
        store_id: o.store_id,
        outcome: 'ok',
        detail: `${PRODUCT_BY_SKU[product]?.name || product} → ${dest}`,
        duration_ms: int(rng, 5, 60),
      });
    }
  }

  return { plans, subscriptions, invoices, payments, commission, work };
}

/**
 * Write the plan to Postgres.
 * @param {import('pg').PoolClient} client
 * @param {Object} plan - from buildRevenuePlan
 */
async function seedRevenue(client, plan, { reset = false } = {}) {
  const summary = {};

  if (reset) {
    await client.query(
      'TRUNCATE commission_ledger, payments, invoices, subscriptions, work_log, saas_plans RESTART IDENTITY'
    );
  }

  // plans
  for (const p of plan.plans) {
    await client.query(
      `INSERT INTO saas_plans (code, name, monthly_price, take_rate_bps, max_stores, description)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name, monthly_price = EXCLUDED.monthly_price,
         take_rate_bps = EXCLUDED.take_rate_bps, max_stores = EXCLUDED.max_stores,
         description = EXCLUDED.description`,
      [p.code, p.name, p.monthly_price, p.take_rate_bps, p.max_stores, p.description]
    );
  }
  summary.plans = plan.plans.length;

  // subscriptions
  for (const s of plan.subscriptions) {
    await client.query(
      `INSERT INTO subscriptions (store_id, plan_code, owner_user_id, status, started_at)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (store_id) DO UPDATE SET
         plan_code = EXCLUDED.plan_code, status = EXCLUDED.status,
         owner_user_id = EXCLUDED.owner_user_id`,
      [s.store_id, s.plan_code, s.owner_user_id, s.status, s.started_at]
    );
  }
  summary.subscriptions = plan.subscriptions.length;

  // invoices
  for (const inv of plan.invoices) {
    await client.query(
      `INSERT INTO invoices (invoice_no, store_id, subscription_id, period_start, period_end,
                             subscription_amount, commission_amount, total_amount,
                             status, due_date, paid_at)
       VALUES ($1,$2,
               (SELECT id FROM subscriptions WHERE store_id = $2),
               $3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (invoice_no) DO UPDATE SET
         status = EXCLUDED.status, total_amount = EXCLUDED.total_amount,
         paid_at = EXCLUDED.paid_at`,
      [
        inv.invoice_no, inv.store_id, inv.period_start, inv.period_end,
        inv.subscription_amount, inv.commission_amount, inv.total_amount,
        inv.status, inv.due_date, inv.paid_at,
      ]
    );
  }
  summary.invoices = plan.invoices.length;

  // payments
  for (const pay of plan.payments) {
    await client.query(
      `INSERT INTO payments (payment_ref, invoice_id, store_id, amount, method, status, gateway, gateway_ref, created_at)
       VALUES ($1,
               (SELECT id FROM invoices WHERE invoice_no = $2),
               $3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (payment_ref) DO NOTHING`,
      [
        pay.payment_ref, pay.invoice_no, pay.store_id, pay.amount,
        pay.method, pay.status, pay.gateway, pay.gateway_ref, pay.created_at,
      ]
    );
  }
  summary.payments = plan.payments.length;

  // commission ledger (derived from real orders)
  for (const c of plan.commission) {
    await client.query(
      `INSERT INTO commission_ledger (order_id, store_id, gmv, take_rate_bps, amount, recognized_on)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (order_id) DO NOTHING`,
      [c.order_id, c.store_id, c.gmv, c.take_rate_bps, c.amount, c.recognized_on]
    );
  }
  summary.commission = plan.commission.length;

  // work log
  if (plan.work.length) {
    const CHUNK = 500;
    for (let i = 0; i < plan.work.length; i += CHUNK) {
      const chunk = plan.work.slice(i, i + CHUNK);
      const values = [];
      const params = [];
      chunk.forEach((w, j) => {
        const b = j * 11;
        values.push(
          `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11})`
        );
        params.push(
          w.occurred_at, w.kind, w.actor, w.actor_type, w.action,
          w.subject_type, w.subject_id, w.store_id, w.outcome, w.detail, w.duration_ms
        );
      });
      await client.query(
        `INSERT INTO work_log (occurred_at, kind, actor, actor_type, action, subject_type,
                               subject_id, store_id, outcome, detail, duration_ms)
         VALUES ${values.join(',')}`,
        params
      );
    }
  }
  summary.work = plan.work.length;

  return summary;
}

module.exports = { buildRevenuePlan, seedRevenue };
