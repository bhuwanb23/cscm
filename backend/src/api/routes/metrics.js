/**
 * Business metrics API.
 *
 * Read-only endpoints that turn orders, line items, shipments and inventory
 * into the operational figures the dashboard and the pitch need.
 *
 * Two rules this file enforces:
 *   1. Every route requires an authenticated user, and store-level figures are
 *      scoped so a shopkeeper can only ever see their own house.
 *   2. Rate metrics are computed per trading day, and the market calendar ships
 *      alongside them so a closed-market dip is never read as lost business.
 */

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../storage/database');
const { authenticate } = require('../middleware/auth');
const { storeIdForUser } = require('../middleware/storeAccess');
const { computeMetrics } = require('../../services/metricsService');
const marketCalendar = require('../../domain/marketCalendar');

router.use(authenticate);

/** Admin sees everything; a store-scoped user sees only their own house. */
function scopeFor(req) {
  if (req.user && req.user.role === 'admin') return null;
  const own = storeIdForUser(req.user);
  return own || '__none__';
}

function parseWindow(req) {
  const to = String(req.query.to || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  const from =
    String(req.query.from || '').slice(0, 10) ||
    new Date(new Date(`${to}T00:00:00Z`).getTime() - 29 * 86400000).toISOString().slice(0, 10);
  // Guard against an unbounded scan.
  const spanDays = (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000;
  return { from, to, spanDays: Number.isFinite(spanDays) ? Math.min(Math.max(spanDays, 0), 366) : 30 };
}

function withClient(fn) {
  return async (req, res) => {
    const db = getDatabase();
    if (!db || !db.pool) {
      return res.status(503).json({
        success: false,
        error: 'Business metrics require the PostgreSQL driver',
      });
    }
    const client = await db.pool.connect();
    try {
      const data = await fn(client, req, res);
      if (data !== undefined && !res.headersSent) res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      client.release();
    }
  };
}

/** GET /api/v1/metrics/summary — operational KPIs for the window. */
router.get(
  '/summary',
  withClient(async (client, req) => {
    const { from, to } = parseWindow(req);
    const scope = scopeFor(req);

    const orders = await client.query(
      `SELECT order_id, store_id, customer_id, total_amount, status, created_at
         FROM orders
        WHERE created_at >= $1 AND created_at < $2::date + INTERVAL '1 day'
          AND ($3::text IS NULL OR store_id = $3)
        ORDER BY created_at DESC`,
      [from, to, scope]
    );

    const orderIds = orders.rows.map((o) => o.order_id);

    // Line items are fetched in one round trip rather than per order.
    // order_items has no unit_cost column, so cost basis is unavailable at
    // line level and the service falls back to unit_price.
    const items = orderIds.length
      ? await client.query(
          `SELECT order_id, product_id, quantity, unit_price, total_price
             FROM order_items
            WHERE order_id = ANY($1)`,
          [orderIds]
        )
      : { rows: [] };

    const shipments = orderIds.length
      ? await client.query(
          `SELECT order_id, status, carrier, created_at, estimated_delivery, actual_delivery
             FROM shipments
            WHERE order_id = ANY($1)`,
          [orderIds]
        )
      : { rows: [] };

    const inventory = await client.query(
      `SELECT product_id, store_id, quantity, reserved_quantity, min_stock_level, unit_cost
         FROM inventory
        WHERE ($1::text IS NULL OR store_id = $1)`,
      [scope]
    );

    return computeMetrics({
      orders: orders.rows,
      orderItems: items.rows,
      shipments: shipments.rows,
      inventory: inventory.rows,
      from,
      to,
    });
  })
);

/**
 * GET /api/v1/metrics/calendar?from=&to=
 * Day-by-day market status, so the dashboard can label closed days instead of
 * plotting them as zero-revenue days.
 */
router.get('/calendar', (req, res) => {
  try {
    const { from, to } = parseWindow(req);
    return res.json({
      success: true,
      data: {
        window: { from, to },
        days: marketCalendar.range(from, to),
        summary: marketCalendar.describeWindow(from, to),
        // Lets the UI warn that this year's festival dates are approximate
        // rather than silently showing derived dates as if they were exact.
        coverage: marketCalendar.coverage(from, to),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/metrics/calendar/today
 * Whether the market is open right now, plus the next open day. Drives the
 * "market closed" banner.
 */
router.get('/calendar/today', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const current = marketCalendar.resolve(today);

    // Look ahead for the next trading day rather than assuming tomorrow.
    let next = null;
    for (let i = 1; i <= 14 && !next; i += 1) {
      const d = new Date(new Date(`${today}T00:00:00Z`).getTime() + i * 86400000)
        .toISOString()
        .slice(0, 10);
      const cal = marketCalendar.resolve(d);
      if (cal.isTradingDay) next = cal;
    }

    return res.json({ success: true, data: { today: current, nextTradingDay: next } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/metrics/freshness
 * How current the data actually is.
 *
 * A demo whose most recent order is a month old looks broken even when every
 * number on it is correct. This answers "when did anything last happen" so the
 * console can say so plainly instead of leaving the reader to infer staleness
 * from a flat chart.
 */
router.get(
  '/freshness',
  withClient(async (client, req) => {
    const scope = scopeFor(req);
    const scoped = scope ? ' AND ($1::text IS NULL OR store_id = $1)' : '';
    const params = scope ? [scope] : [];

    const { rows } = await client.query(
      `SELECT
         (SELECT MAX(created_at) FROM orders${scoped ? ' WHERE ($1::text IS NULL OR store_id = $1)' : ''})   AS last_order_at,
         (SELECT MAX(created_at) FROM shipments${scoped ? ' WHERE ($1::text IS NULL OR store_id = $1)' : ''}) AS last_shipment_at,
         (SELECT MAX(created_at) FROM users)  AS last_user_at,
         (SELECT COUNT(*)::int FROM orders${scoped ? ' WHERE ($1::text IS NULL OR store_id = $1)' : ''})   AS order_count`,
      params
    );

    const row = rows[0] || {};
    const lastActivity = [row.last_order_at, row.last_shipment_at]
      .filter(Boolean)
      .map((v) => new Date(v).getTime())
      .filter(Number.isFinite);
    const latest = lastActivity.length ? Math.max(...lastActivity) : null;

    const ageHours = latest ? Math.round((Date.now() - latest) / 3600000) : null;

    return {
      lastOrderAt: row.last_order_at || null,
      lastShipmentAt: row.last_shipment_at || null,
      lastUserAt: row.last_user_at || null,
      lastActivityAt: latest ? new Date(latest).toISOString() : null,
      ageHours,
      orderCount: Number(row.order_count) || 0,
      // Bucketed so the UI can colour the badge without re-deriving thresholds.
      freshness: ageHours == null ? 'empty' : ageHours <= 48 ? 'live' : ageHours <= 24 * 14 ? 'stale' : 'very_stale',
    };
  })
);

module.exports = router;
