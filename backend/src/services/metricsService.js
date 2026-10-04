/**
 * Business metrics engine.
 *
 * Derives the operational figures a supply-chain business is actually run on,
 * from the same durable rows the rest of the console reads. Kept pure (rows
 * in, figures out) so every number here is unit-testable without a database.
 *
 * THE ONE RULE THIS MODULE ENFORCES
 * ---------------------------------
 * Rate metrics are divided by TRADING days, not calendar days. A month
 * containing Deepavali has fewer trading days than calendar days, so
 * "orders per day" measured over 30 days understates the real rate and makes
 * a festival fortnight look like a business collapse. Where a rate has no
 * meaningful denominator we return null rather than a zero, because zero
 * means "measured, and it was none" while null means "cannot be measured".
 *
 * Money is rounded to 2dp to avoid float drift on currency totals.
 */

const marketCalendar = require('../domain/marketCalendar');
const { dayKey, money } = require('./revenueService');

/** Safe rate: returns null when the denominator is unusable. */
function ratio(numerator, denominator, scale = 1) {
  const n = Number(numerator);
  const d = Number(denominator);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  return Math.round((n / d) * scale);
}

/** Basis points, or null. Used for percentages that must reconcile. */
function bps(numerator, denominator) {
  return ratio(numerator, denominator, 10000);
}

function toPct(basisPoints) {
  return basisPoints == null ? null : Math.round((basisPoints / 100) * 100) / 100;
}

/** Distinct values of a field across rows. */
function distinct(rows, field) {
  const out = new Set();
  for (const r of rows || []) {
    const v = r[field];
    if (v !== undefined && v !== null && v !== '') out.add(v);
  }
  return out;
}

/**
 * Order fulfilment funnel, measured per trading day.
 *
 * @param {Object} data
 * @param {Array} data.orders      - orders in window
 * @param {Array} data.orderItems  - order_items joined to those orders
 * @param {Array} data.shipments   - shipments joined to those orders
 * @param {Array} data.inventory   - inventory rows as of the window
 * @param {string} data.from - YYYY-MM-DD
 * @param {string} data.to   - YYYY-MM-DD
 */
function computeMetrics({ orders = [], orderItems = [], shipments = [], inventory = [], from, to } = {}) {
  const tradingDays = marketCalendar.tradingDayCount(from, to);
  const window = marketCalendar.describeWindow(from, to);

  const gmv = money(orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0));
  const orderCount = orders.length;

  // --- Order status mix -------------------------------------------------
  const statusMix = {};
  for (const o of orders) {
    const s = o.status || 'unknown';
    statusMix[s] = (statusMix[s] || 0) + 1;
  }

  // --- Units and basket -------------------------------------------------
  // order_items carries the real unit economics; the orders table alone has
  // only a total, so basket size must come from the line items.
  const unitsSold = orderItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const basketItems = orderItems.length;
  const aov = orderCount ? money(gmv / orderCount) : 0;
  const unitsPerOrder = orderCount ? Math.round((unitsSold / orderCount) * 100) / 100 : 0;

  // --- Fill rate --------------------------------------------------------
  // A line is short-filled when the store could not supply the requested
  // quantity. inventory.on_hand vs max_stock_level is the standing signal,
  // so a stockout rate is reported from inventory rows in the window.
  const stockRows = (inventory || []).filter((i) => Number(i.quantity) != null);
  const stockedOut = stockRows.filter((i) => Number(i.quantity) === 0);
  const belowReorder = stockRows.filter(
    (i) => Number(i.quantity) != null && Number(i.min_stock_level) > 0 && Number(i.quantity) < Number(i.min_stock_level)
  );
  const stockoutRateBps = bps(stockedOut.length, stockRows.length);
  const belowReorderRateBps = bps(belowReorder.length, stockRows.length);

  // Inventory turns: how many times stock is sold and replaced in the
  // window. Needs a cost basis; unit_cost is the weaver cooperative price.
  const stockValue = money(stockRows.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_cost || 0), 0));
  const cogs = money(
    orderItems.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_cost || Number(it.unit_price) || 0), 0)
  );
  const inventoryTurns = stockValue > 0 ? Math.round((cogs / stockValue) * 100) / 100 : null;

  // --- Delivery performance --------------------------------------------
  const delivered = (shipments || []).filter((s) => s.status === 'delivered');
  const late = delivered.filter((s) => {
    if (!s.estimated_delivery || !s.actual_delivery) return false;
    const eta = new Date(s.estimated_delivery).getTime();
    const actual = new Date(s.actual_delivery).getTime();
    return Number.isFinite(eta) && Number.isFinite(actual) && actual > eta;
  });
  const onTimeRateBps = bps(delivered.length - late.length, delivered.length);
  const avgTransitHours = (() => {
    const spans = delivered
      .map((s) => {
        const created = s.created_at ? new Date(s.created_at).getTime() : null;
        const actual = s.actual_delivery ? new Date(s.actual_delivery).getTime() : null;
        if (created == null || actual == null) return null;
        const diff = actual - created;
        return Number.isFinite(diff) && diff >= 0 ? diff / 3600000 : null;
      })
      .filter((v) => v != null);
    if (!spans.length) return null;
    return Math.round((spans.reduce((a, b) => a + b, 0) / spans.length) * 10) / 10;
  })();

  const shipmentMix = {};
  for (const s of shipments || []) {
    const k = s.status || 'unknown';
    shipmentMix[k] = (shipmentMix[k] || 0) + 1;
  }

  // --- Concentration ----------------------------------------------------
  // All revenue from one store is fragility, not success.
  const byStore = new Map();
  for (const o of orders) {
    const k = o.store_id || 'unknown';
    byStore.set(k, money((byStore.get(k) || 0) + (Number(o.total_amount) || 0)));
  }
  const storeRank = [...byStore.entries()]
    .map(([storeId, amount]) => ({ storeId, amount, shareBps: bps(amount, gmv) }))
    .sort((a, b) => b.amount - a.amount);
  const topStore = storeRank[0] || null;

  // --- Product concentration -------------------------------------------
  const bySku = new Map();
  for (const it of orderItems) {
    const k = it.product_id || 'unknown';
    bySku.set(k, (bySku.get(k) || 0) + (Number(it.quantity) || 0));
  }
  const skuRank = [...bySku.entries()]
    .map(([productId, units]) => ({ productId, units }))
    .sort((a, b) => b.units - a.units);
  const topSku = skuRank[0] || null;

  // --- Demand mix -------------------------------------------------------
  const wholesale = orders.filter((o) => String(o.customer_id || '').startsWith('wholesaler_')).length;
  const wholesaleShareBps = bps(wholesale, orderCount);

  // --- Daily series, market-aware --------------------------------------
  const dailyGmv = marketCalendar.annotateSeries(
    buildDailySeries(orders, 'created_at', from, to, { gmv: 'total_amount' })
  );
  const dailyOrders = marketCalendar.annotateSeries(
    buildDailySeries(orders, 'created_at', from, to, { orders: true })
  );

  return {
    window: { from, to },
    market: {
      tradingDays,
      totalDays: window.total,
      closedDays: window.closed,
      label: window.label,
      // Lets the UI explain a dip instead of presenting it as lost business.
      closures: marketCalendar.closedDays(from, to).map((d) => ({
        date: d.date,
        status: d.status,
        label: d.label,
        reason: d.reason,
        exact: d.exact,
      })),
    },
    volume: {
      gmv,
      orders: orderCount,
      unitsSold,
      basketItems,
      activeStores: distinct(orders, 'store_id').size,
      // Per-trading-day, never per calendar day.
      gmvPerTradingDay: tradingDays ? money(gmv / tradingDays) : 0,
      ordersPerTradingDay: tradingDays ? Math.round((orderCount / tradingDays) * 100) / 100 : 0,
      aov,
      unitsPerOrder,
    },
    fulfilment: {
      statusMix,
      wholesaleOrders: wholesale,
      wholesaleShareBps,
      wholesaleSharePct: toPct(wholesaleShareBps),
    },
    inventory: {
      lines: stockRows.length,
      stockValue,
      stockedOut: stockedOut.length,
      belowReorder: belowReorder.length,
      stockoutRateBps,
      stockoutRatePct: toPct(stockoutRateBps),
      belowReorderRateBps,
      belowReorderRatePct: toPct(belowReorderRateBps),
      turns: inventoryTurns,
    },
    delivery: {
      shipments: (shipments || []).length,
      delivered: delivered.length,
      late: late.length,
      onTimeRateBps,
      onTimeRatePct: toPct(onTimeRateBps),
      avgTransitHours,
      statusMix: shipmentMix,
    },
    concentration: {
      topStore: topStore ? { ...topStore, sharePct: toPct(topStore.shareBps) } : null,
      storeRank,
      topSku,
      skuRank,
    },
    series: {
      dailyGmv,
      dailyOrders,
    },
  };
}

/**
 * Dense daily series keyed by a date field.
 *
 * `sums` maps an output field to the source column to add. A source of `true`
 * means "count rows instead of summing a column", for series like order
 * counts where the identifying column is a string and cannot be summed.
 */
function buildDailySeries(rows, dateField, from, to, sums) {
  const buckets = new Map();
  for (const row of rows || []) {
    const day = dayKey(row[dateField]);
    if (!day) continue;
    if (!buckets.has(day)) {
      const b = { date: day, count: 0 };
      for (const out of Object.keys(sums)) b[out] = 0;
      buckets.set(day, b);
    }
    const bucket = buckets.get(day);
    bucket.count += 1;
    for (const [out, src] of Object.entries(sums)) {
      // A `true` source means "count rows in this bucket". Some useful series
      // have no numeric column to sum - order_id is a string, and summing it
      // would yield NaN - so the count is the only meaningful reading.
      if (src === true) {
        bucket[out] = bucket.count;
        continue;
      }
      const value = Number(row[src]);
      bucket[out] = money(bucket[out] + (Number.isFinite(value) ? value : 0));
    }
  }

  const series = [];
  const end = new Date(`${to}T00:00:00Z`);
  for (let d = new Date(`${from}T00:00:00Z`); d <= end; d = new Date(d.getTime() + 86400000)) {
    const key = d.toISOString().slice(0, 10);
    series.push(
      buckets.get(key) || {
        date: key,
        count: 0,
        ...Object.fromEntries(Object.keys(sums).map((k) => [k, 0])),
      }
    );
  }
  return series;
}

module.exports = {
  ratio,
  bps,
  toPct,
  computeMetrics,
  buildDailySeries,
};
