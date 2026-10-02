/**
 * Regression tests for the revenue engine.
 *
 * The dayKey() cases guard a bug that only appeared against real Postgres:
 * the pg driver returns TIMESTAMP columns as JS Date objects, so slicing the
 * raw string produced "Tue Sep 01" and Postgres rejected it as an invalid
 * date. Tests that only ever pass pre-formatted strings miss this entirely.
 */

const {
  dayKey,
  money,
  computeMrr,
  computeChurn,
  revenueSummary,
  revenueByStore,
} = require('../../services/revenueService');

const PLANS = {
  free: { code: 'free', monthlyPrice: 0, takeRateBps: 100 },
  starter: { code: 'starter', monthlyPrice: 2499, takeRateBps: 150 },
  enterprise: { code: 'enterprise', monthlyPrice: 19999, takeRateBps: 250 },
};

describe('revenueService.dayKey', () => {
  it('formats a JS Date (what pg actually returns) as YYYY-MM-DD', () => {
    // 2026-09-01T00:00:00.000Z
    expect(dayKey(new Date('2026-09-01T00:00:00Z'))).toBe('2026-09-01');
  });

  it('is not affected by the process timezone', () => {
    const d = new Date('2026-09-15T18:30:00Z');
    expect(dayKey(d)).toBe('2026-09-15');
  });

  it('passes through already-formatted strings', () => {
    expect(dayKey('2026-09-30')).toBe('2026-09-30');
    expect(dayKey('2026-09-30 14:05:00')).toBe('2026-09-30');
  });

  it('rejects unparseable input rather than emitting garbage', () => {
    // The original bug: String(new Date(...)).slice(0,10) === 'Tue Sep 01'
    expect(dayKey(new Date('2026-09-01T00:00:00Z').toString())).toBeNull();
    expect(dayKey(null)).toBeNull();
    expect(dayKey('')).toBeNull();
  });
});

describe('revenueService.money', () => {
  it('rounds to 2dp without float drift', () => {
    expect(money(1234.5600000000001)).toBe(1234.56);
    expect(money(0.1 + 0.2)).toBe(0.3);
  });
});

describe('revenueService.computeMrr', () => {
  it('sums only active subscriptions', () => {
    const out = computeMrr(
      [
        { store_id: 'S1', plan_code: 'enterprise', status: 'active' },
        { store_id: 'S2', plan_code: 'starter', status: 'active' },
        { store_id: 'S3', plan_code: 'free', status: 'active' },
        { store_id: 'S4', plan_code: 'enterprise', status: 'cancelled' },
        { store_id: 'S5', plan_code: 'enterprise', status: 'trialing' },
      ],
      PLANS
    );
    expect(out.mrr).toBe(19999 + 2499);
    expect(out.active).toBe(3);
    expect(out.trialing).toBe(1);
  });

  it('reads DB-shaped rows that carry monthly_price', () => {
    const dbPlans = { enterprise: { code: 'enterprise', monthly_price: 19999, take_rate_bps: 250 } };
    const out = computeMrr([{ store_id: 'S1', plan_code: 'enterprise', status: 'active' }], dbPlans);
    expect(out.mrr).toBe(19999);
  });

  it('is not silently zero when plan prices are present', () => {
    // Guards the earlier monthlyPrice/monthly_price mismatch that reported
    // MRR as 0 while ARR still looked plausible.
    const out = computeMrr([{ store_id: 'S1', plan_code: 'enterprise', status: 'active' }], PLANS);
    expect(out.mrr).toBeGreaterThan(0);
  });
});

describe('revenueService.revenueSummary', () => {
  it('splits subscription and commission revenue and fills every day', () => {
    const summary = revenueSummary({
      subscriptions: [
        { store_id: 'S1', plan_code: 'enterprise', status: 'active' },
        { store_id: 'S2', plan_code: 'starter', status: 'active' },
      ],
      payments: [
        { store_id: 'S1', amount: 10000, created_at: new Date('2026-09-02T00:00:00Z') },
        { store_id: 'S2', amount: 5000, created_at: new Date('2026-09-04T00:00:00Z') },
      ],
      commission: [{ store_id: 'S1', amount: 250, recognized_on: '2026-09-03' }],
      orders: [{ total_amount: 50000, created_at: new Date('2026-09-03T00:00:00Z') }],
      from: '2026-09-01',
      to: '2026-09-30',
    });

    expect(summary.subscriptionRevenue).toBe(15000);
    expect(summary.commissionRevenue).toBe(250);
    expect(summary.totalRevenue).toBe(15250);
    expect(summary.gmv).toBe(50000);
    expect(summary.arr).toBe(summary.mrr * 12);

    // 30 days, densely filled.
    expect(summary.dailyRevenue).toHaveLength(30);
    expect(summary.dailyRevenue[0].date).toBe('2026-09-01');
    expect(summary.dailyRevenue[29].date).toBe('2026-09-30');

    // The payment on the 2nd must land on the 2nd, not an unparseable bucket.
    const second = summary.dailyRevenue.find((d) => d.date === '2026-09-02');
    expect(second.amount).toBe(10000);
    const first = summary.dailyRevenue.find((d) => d.date === '2026-09-01');
    expect(first.amount).toBe(0);
  });
});

describe('revenueService.computeChurn', () => {
  it('counts the base from Date timestamps, not zero', () => {
    // pg returns Date objects. Comparing a Date to a string is false, which
    // previously reported "0 of 0 accounts" and understated churn entirely.
    const out = computeChurn(
      [
        { store_id: 'S1', status: 'active', started_at: new Date('2026-09-01T09:00:00Z') },
        { store_id: 'S2', status: 'active', started_at: new Date('2026-09-10T09:00:00Z') },
        { store_id: 'S3', status: 'cancelled', started_at: '2026-08-01 09:00:00', ended_at: new Date('2026-09-15T09:00:00Z') },
      ],
      '2026-09-01 00:00:00',
      '2026-09-30 23:59:59'
    );
    expect(out.base).toBe(3);
    expect(out.churned).toBe(1);
    expect(out.churnRateBps).toBe(3333);
  });

  it('does not count churn that happened outside the window', () => {
    const out = computeChurn(
      [{ store_id: 'S1', status: 'cancelled', started_at: '2026-01-01 00:00:00', ended_at: '2026-05-01 00:00:00' }],
      '2026-09-01 00:00:00',
      '2026-09-30 23:59:59'
    );
    expect(out.churned).toBe(0);
    expect(out.churnRateBps).toBe(0);
  });

  it('guards a zero base', () => {
    expect(computeChurn([], '2026-09-01 00:00:00', '2026-09-30 23:59:59').churnRateBps).toBe(0);
  });
});

describe('revenueService.revenueByStore', () => {
  it('attributes revenue per store and reports concentration share', () => {
    const out = revenueByStore({
      subscriptions: [
        { store_id: 'S1', plan_code: 'enterprise', status: 'active' },
        { store_id: 'S2', plan_code: 'starter', status: 'active' },
      ],
      payments: [
        { store_id: 'S1', amount: 7500 },
        { store_id: 'S2', amount: 2500 },
      ],
      commission: [{ store_id: 'S1', amount: 500 }],
    });

    expect(out.total).toBe(10500);
    expect(out.stores[0].storeId).toBe('S1');
    expect(out.stores[0].totalRevenue).toBe(8000);
    expect(out.stores[0].shareBps).toBe(7619);
    // Shares must sum to ~100%.
    const sum = out.stores.reduce((s, r) => s + r.shareBps, 0);
    expect(sum).toBeGreaterThan(9900);
    expect(sum).toBeLessThan(10100);
  });
});
