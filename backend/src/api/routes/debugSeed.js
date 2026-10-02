/**
 * Operational seeding endpoint for the monetization tables.
 *
 * The revenue seeder is a CLI script that needs direct Postgres access. The
 * deployed backend already has the pool, so this exposes the same operation
 * over the existing admin + DEBUG-gated control plane.
 *
 * Security posture matches the rest of debug.js: it inherits
 * `authenticate` + `authorize('admin')` + `requireDebugMode` from the parent
 * router when mounted there, requires an explicit window, and is idempotent
 * (safe to re-run). It is deliberately NOT exposed to the gateway.
 *
 * It reads existing orders to derive commission, so it never invents revenue.
 */

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../storage/database');
const logger = require('../../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');

const requireDebugMode = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG !== 'true') {
    return res.status(404).json({
      success: false,
      error: 'Debug endpoints are not available in production',
    });
  }
  next();
};

router.use(authenticate, authorize('admin'), requireDebugMode);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * POST /seed/revenue
 * body: { from?: 'YYYY-MM-DD', to?: 'YYYY-MM-DD', reset?: boolean }
 */
router.post('/revenue', async (req, res) => {
  try {
    const { buildRevenuePlan, seedRevenue } = require('../../../scripts/seed-revenue');

    const to = (req.body && req.body.to) || '2026-09-30';
    const from = (req.body && req.body.from) || '2026-09-01';
    const reset = !!(req.body && req.body.reset);

    if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'from and to must be YYYY-MM-DD',
      });
    }
    if (from > to) {
      return res.status(400).json({ success: false, error: 'from must be <= to' });
    }
    const spanDays = (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000;
    if (spanDays > 366) {
      return res.status(400).json({ success: false, error: 'window too wide (max 366 days)' });
    }

    const db = getDatabase();
    if (!db || !db.pool) {
      return res.status(503).json({
        success: false,
        error: 'Seeding requires the PostgreSQL driver',
      });
    }

    const client = await db.pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT order_id, store_id, total_amount, status, created_at
           FROM orders WHERE created_at::date BETWEEN $1 AND $2`,
        [from, to]
      );
      if (!rows.length) {
        return res.status(409).json({
          success: false,
          error: `no orders between ${from} and ${to}; run the history seed first`,
        });
      }

      const plan = buildRevenuePlan({ orders: rows, from, to });
      const summary = await seedRevenue(client, plan, { reset });

      const collected = plan.payments.reduce((s, p) => s + p.amount, 0);
      const commission = plan.commission.reduce((s, c) => s + c.amount, 0);

      logger.warn(
        `[control-plane] revenue seed ${from}..${to} by admin ${req.user.username} ` +
          `(payments ${summary.payments}, commission rows ${summary.commission})`
      );

      res.json({
        success: true,
        data: {
          window: { from, to },
          ordersRead: rows.length,
          ...summary,
          collected: Math.round(collected * 100) / 100,
          commission: Math.round(commission * 100) / 100,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Revenue seed failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
