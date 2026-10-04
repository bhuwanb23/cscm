/**
 * Business metrics tests.
 *
 * The recurring theme: a rate with no meaningful denominator must be null,
 * not zero, and must be measured per trading day rather than per calendar
 * day. Getting either wrong is how a closed market gets misread as a
 * collapsing business.
 */

const {
  ratio,
  bps,
  toPct,
  computeMetrics,
  buildDailySeries,
} = require('../../services/metricsService');
const { money } = require('../../services/revenueService');

// Window: 2026-11-02 (Mon) .. 2026-11-09 (Sun).
// Deepavali shuts the market 8-9 Nov, so there are 6 trading days, not 8.
const FROM = '2026-11-02';
const TO = '2026-11-09';

const orders = [
  { order_id: 'O1', store_id: 'STORE001', customer_id: 'shopkeeper_001', total_amount: 10000, status: 'delivered', created_at: '2026-11-02' },
  { order_id: 'O2', store_id: 'STORE001', customer_id: 'wholesaler_001', total_amount: 20000, status: 'delivered', created_at: '2026-11-03' },
  { order_id: 'O3', store_id: 'STORE002', customer_id: 'shopkeeper_002', total_amount: 50000, status: 'pending', created_at: '2026-11-04' },
];

const orderItems = [
  { order_id: 'O1', product_id: 'SKU001', quantity: 10, unit_price: 1000, unit_cost: 500 },
  { order_id: 'O2', product_id: 'SKU001', quantity: 20, unit_price: 1000, unit_cost: 500 },
  { order_id: 'O3', product_id: 'SKU002', quantity: 40, unit_price: 1000, unit_cost: 400 },
];

const shipments = [
  // Delivered early.
  {
    order_id: 'O1', status: 'delivered',
    created_at: '2026-11-02T09:00:00Z',
    estimated_delivery: '2026-11-05T00:00:00Z',
    actual_delivery: '2026-11-04T00:00:00Z',
  },
  // Delivered a day late.
  {
    order_id: 'O2', status: 'delivered',
    created_at: '2026-11-03T09:00:00Z',
    estimated_delivery: '2026-11-05T00:00:00Z',
    actual_delivery: '2026-11-06T00:00:00Z',
  },
  {
    order_id: 'O3', status: 'pending',
    created_at: '2026-11-04T09:00:00Z',
    estimated_delivery: null,
    actual_delivery: null,
  },
];

const inventory = [
  { product_id: 'SKU001', store_id: 'STORE001', quantity: 0, min_stock_level: 10, unit_cost: 500 },
  { product_id: 'SKU002', store_id: 'STORE001', quantity: 5, min_stock_level: 10, unit_cost: 400 },
  { product_id: 'SKU003', store_id: 'STORE002', quantity: 100, min_stock_level: 10, unit_cost: 300 },
];

function run(overrides = {}) {
  return computeMetrics({ orders, orderItems, shipments, inventory, from: FROM, to: TO, ...overrides });
}

describe('metricsService.ratio / bps', () => {
  it('returns null rather than Infinity or NaN for a zero denominator', () => {
    expect(ratio(5, 0)).toBeNull();
    expect(ratio(5, NaN)).toBeNull();
    expect(bps(5, 0)).toBeNull();
  });

  it('computes basis points', () => {
    expect(bps(1, 4)).toBe(2500);
    expect(toPct(2500)).toBe(25);
  });

  it('keeps null as null through the percent conversion', () => {
    expect(toPct(null)).toBeNull();
  });
});

describe('metricsService market context', () => {
  it('counts trading days, excluding Deepavali', () => {
    const m = run();
    expect(m.market.tradingDays).toBe(6);
    expect(m.market.totalDays).toBe(8);
    expect(m.market.closedDays).toBe(2);
    expect(m.market.label).toBe('6 trading days');
  });

  it('lists the closures so a dip can be explained', () => {
    const m = run();
    const dates = m.market.closures.map((c) => c.date);
    expect(dates).toContain('2026-11-08');
    expect(dates).toContain('2026-11-09');
    expect(m.market.closures.find((c) => c.date === '2026-11-08').label).toBe('Deepavali');
  });
});

describe('metricsService volume', () => {
  it('computes GMV, orders and AOV', () => {
    const v = run().volume;
    expect(v.gmv).toBe(80000);
    expect(v.orders).toBe(3);
    expect(v.aov).toBe(money(80000 / 3));
  });

  it('measures per-trading-day rates, not per calendar day', () => {
    const v = run().volume;
    // 80000 over 6 trading days = 13333.33. Over 8 calendar days it would be
    // 10000, which understates the real run rate during a festival fortnight.
    expect(v.gmvPerTradingDay).toBe(money(80000 / 6));
    expect(v.ordersPerTradingDay).toBe(0.5);
  });

  it('sums units from line items, not the order header', () => {
    expect(run().volume.unitsSold).toBe(70);
    expect(run().volume.unitsPerOrder).toBe(money(70 / 3));
  });

  it('counts distinct active stores', () => {
    expect(run().volume.activeStores).toBe(2);
  });

  it('returns 0 not NaN for an empty window', () => {
    const m = computeMetrics({ orders: [], from: FROM, to: FROM });
    expect(m.volume.gmv).toBe(0);
    expect(m.volume.aov).toBe(0);
  });
});

describe('metricsService fulfilment', () => {
  it('breaks orders down by status', () => {
    expect(run().fulfilment.statusMix).toEqual({ delivered: 2, pending: 1 });
  });

  it('computes the wholesale share of orders', () => {
    const f = run().fulfilment;
    expect(f.wholesaleOrders).toBe(1);
    expect(f.wholesaleShareBps).toBe(3333);
    expect(f.wholesaleSharePct).toBe(33.33);
  });
});

describe('metricsService inventory', () => {
  it('reports stockout and below-reorder rates as null-safe percentages', () => {
    const inv = run().inventory;
    expect(inv.lines).toBe(3);
    expect(inv.stockedOut).toBe(1);
    expect(inv.stockoutRateBps).toBe(3333);
    // SKU002 (5 < 10) is below reorder; SKU001 is zero and already counted.
    expect(inv.belowReorder).toBe(2);
  });

  it('returns null for turns when there is no stock value', () => {
    const m = computeMetrics({ orders, orderItems, inventory: [], shipments, from: FROM, to: TO });
    expect(m.inventory.stockValue).toBe(0);
    expect(m.inventory.turns).toBeNull();
  });

  it('returns null rates for an empty inventory, never a false zero', () => {
    const m = computeMetrics({ orders, orderItems, inventory: [], shipments, from: FROM, to: TO });
    expect(m.inventory.stockoutRateBps).toBeNull();
    expect(m.inventory.stockoutRatePct).toBeNull();
  });
});

describe('metricsService delivery', () => {
  it('counts a shipment delivered after its ETA as late', () => {
    const d = run().delivery;
    expect(d.delivered).toBe(2);
    expect(d.late).toBe(1);
    expect(d.onTimeRateBps).toBe(5000);
    expect(d.onTimeRatePct).toBe(50);
  });

  it('returns null on-time rate when nothing was delivered', () => {
    const m = computeMetrics({ orders, orderItems, inventory, shipments: [], from: FROM, to: TO });
    expect(m.delivery.delivered).toBe(0);
    expect(m.delivery.onTimeRateBps).toBeNull();
    expect(m.delivery.avgTransitHours).toBeNull();
  });

  it('computes average transit hours from creation to actual delivery', () => {
    // O1: 2 Nov 09:00 -> 4 Nov 00:00 = 39h. O2: 3 Nov 09:00 -> 6 Nov = 63h.
    expect(run().delivery.avgTransitHours).toBe(51);
  });

  it('ignores undelivered shipments when measuring punctuality', () => {
    expect(run().delivery.shipments).toBe(3);
  });
});

describe('metricsService concentration', () => {
  it('ranks stores by GMV with their share', () => {
    const c = run().concentration;
    // STORE001 = 10k + 20k = 30k; STORE002 = 50k.
    expect(c.topStore.storeId).toBe('STORE002');
    expect(c.topStore.amount).toBe(50000);
    expect(c.topStore.sharePct).toBe(62.5);
    expect(c.storeRank).toHaveLength(2);
  });

  it('ranks SKUs by units sold', () => {
    // SKU001 = 30 units; SKU002 = 40 units.
    expect(run().concentration.topSku).toEqual({ productId: 'SKU002', units: 40 });
  });

  it('returns null top store for an empty window', () => {
    const m = computeMetrics({ orders: [], from: FROM, to: FROM });
    expect(m.concentration.topStore).toBeNull();
  });
});

describe('metricsService daily series', () => {
  it('flags closed-market days in the series', () => {
    const m = run();
    const gmvByDate = Object.fromEntries(m.series.dailyGmv.map((d) => [d.date, d]));

    expect(gmvByDate['2026-11-08'].isTradingDay).toBe(false); // Deepavali
    expect(gmvByDate['2026-11-02'].isTradingDay).toBe(true);
    expect(gmvByDate['2026-11-02'].gmv).toBe(10000);
  });

  it('keeps a zero on a closed day distinguishable from a trading zero', () => {
    const m = run();
    const day = m.series.dailyGmv.find((d) => d.date === '2026-11-08');
    expect(day.gmv).toBe(0);
    expect(day.isTradingDay).toBe(false);
    expect(day.marketReason).toMatch(/market closed/i);
  });
});

describe('metricsService.buildDailySeries', () => {
  it('counts rows instead of summing a non-numeric column', () => {
    // A `true` source means "count rows" - order_id is a string, so summing it
    // would produce NaN rather than an order count.
    const series = buildDailySeries(orders, 'created_at', FROM, TO, { orders: true });
    const first = series.find((d) => d.date === '2026-11-02');
    expect(first.orders).toBe(1);
    expect(Number.isNaN(first.orders)).toBe(false);
  });

  it('never yields NaN when handed a non-numeric column to sum', () => {
    const series = buildDailySeries(orders, 'created_at', FROM, TO, { bad: 'order_id' });
    expect(series.every((d) => Number.isFinite(d.bad))).toBe(true);
  });

  it('dense-fills every calendar day in the window', () => {
    const series = buildDailySeries([], 'created_at', FROM, TO, { gmv: 'total_amount' });
    expect(series).toHaveLength(8);
  });
});

describe('metricsService inventory turns basis', () => {
  const base = {
    orders: [{ order_id: 'O1', store_id: 'S1', total_amount: 1000, status: 'delivered', created_at: '2026-11-03' }],
    shipments: [],
    inventory: [{ product_id: 'P1', store_id: 'S1', quantity: 100, min_stock_level: 5, unit_cost: 5 }],
    from: '2026-11-02',
    to: '2026-11-03',
  };

  it('marks turns as inexact when order_items has no cost basis', () => {
    // order_items has no unit_cost column in the real schema, so the
    // numerator falls back to retail unit_price and turns are an upper bound.
    const m = computeMetrics({ ...base, orderItems: [{ order_id: 'O1', product_id: 'P1', quantity: 10, unit_price: 100 }] });
    expect(m.inventory.turnsAreExact).toBe(false);
    expect(Number.isFinite(m.inventory.turns)).toBe(true);
  });

  it('marks turns as exact when a real cost basis is present', () => {
    const m = computeMetrics({
      ...base,
      orderItems: [{ order_id: 'O1', product_id: 'P1', quantity: 10, unit_price: 100, unit_cost: 40 }],
    });
    expect(m.inventory.turnsAreExact).toBe(true);
  });

  it('still returns null turns when there is no stock value to divide by', () => {
    const m = computeMetrics({ ...base, inventory: [], orderItems: [{ order_id: 'O1', product_id: 'P1', quantity: 10, unit_price: 100 }] });
    expect(m.inventory.turns).toBeNull();
  });
});
