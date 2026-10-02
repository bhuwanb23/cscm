/**
 * Revenue & work analytics API.
 *
 * Read-only endpoints that turn the monetization tables into the figures the
 * dashboard and the pitch need: MRR/ARR, collected revenue, GMV commission,
 * churn, per-store concentration, and the work actually performed.
 *
 * Every route requires an authenticated user; store-level figures are filtered
 * so a shopkeeper can only ever see their own revenue.
 */

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../storage/database');
const { authenticate } = require('../middleware/auth');
const { storeIdForUser } = require('../middleware/storeAccess');
const { revenueSummary, revenueByStore, money } = require('../../services/revenueService');
const { PLANS } = require('../../../scripts/kanchipuram-domain');

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
  // Guard against an unbounded scan of the whole ledger.
  const spanDays = (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000;
  return { from, to, spanDays: Number.isFinite(spanDays) ? Math.min(Math.max(spanDays, 0), 366) : 30 };
}

async function rows(client, sql, params) {
  const r = await client.query(sql, params);
  return r.rows;
}

function withClient(fn) {
  return async (req, res) => {
    const db = getDatabase();
    if (!db || !db.pool) {
      return res.status(503).json({
        success: false,
        error: 'Revenue analytics require the PostgreSQL driver',
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

/** GET /api/v1/revenue/summary — headline figures for the dashboard. */
router.get(
  '/summary',
  withClient(async (client, req, res) => {
    const { from, to } = parseWindow(req);
    const scope = scopeFor(req);

    const subscriptions = await rows(
      client,
      scope
        ? 'SELECT * FROM subscriptions WHERE store_id = $1'
        : 'SELECT * FROM subscriptions',
      scope ? [scope] : []
    );
    const payments = await rows(
      client,
      scope
        ? "SELECT * FROM payments WHERE store_id = $1 AND status = 'succeeded' AND created_at BETWEEN $2 AND $3"
        : "SELECT * FROM payments WHERE status = 'succeeded' AND created_at BETWEEN $1 AND $2",
      scope ? [scope, `${from} 00:00:00`, `${to} 23:59:59`] : [`${from} 00:00:00`, `${to} 23:59:59`]
    );
    const commission = await rows(
      client,
      scope
        ? 'SELECT * FROM commission_ledger WHERE store_id = $1 AND recognized_on BETWEEN $2 AND $3'
        : 'SELECT * FROM commission_ledger WHERE recognized_on BETWEEN $1 AND $2',
      scope ? [scope, from, to] : [from, to]
    );
    const orders = await rows(
      client,
      scope
        ? 'SELECT total_amount, created_at FROM orders WHERE store_id = $1 AND created_at BETWEEN $2 AND $3'
        : 'SELECT total_amount, created_at FROM orders WHERE created_at BETWEEN $1 AND $2',
      scope ? [scope, `${from} 00:00:00`, `${to} 23:59:59`] : [`${from} 00:00:00`, `${to} 23:59:59`]
    );

    return revenueSummary({ subscriptions, payments, commission, orders, from, to });
  })
);

/** GET /api/v1/revenue/stores — per-store revenue and concentration share. */
router.get(
  '/stores',
  withClient(async (client, req) => {
    const { from, to } = parseWindow(req);
    const scope = scopeFor(req);

    const subscriptions = await rows(
      client,
      scope ? 'SELECT * FROM subscriptions WHERE store_id = $1' : 'SELECT * FROM subscriptions',
      scope ? [scope] : []
    );
    const payments = await rows(
      client,
      scope
        ? "SELECT store_id, amount FROM payments WHERE store_id = $1 AND status = 'succeeded' AND created_at BETWEEN $2 AND $3"
        : "SELECT store_id, amount FROM payments WHERE status = 'succeeded' AND created_at BETWEEN $1 AND $2",
      scope ? [scope, `${from} 00:00:00`, `${to} 23:59:59`] : [`${from} 00:00:00`, `${to} 23:59:59`]
    );
    const commission = await rows(
      client,
      scope
        ? 'SELECT store_id, amount FROM commission_ledger WHERE store_id = $1 AND recognized_on BETWEEN $2 AND $3'
        : 'SELECT store_id, amount FROM commission_ledger WHERE recognized_on BETWEEN $1 AND $2',
      scope ? [scope, from, to] : [from, to]
    );

    return revenueByStore({ subscriptions, payments, commission });
  })
);

/** GET /api/v1/revenue/plans — plan catalogue with live subscriber counts. */
router.get(
  '/plans',
  withClient(async (client) => {
    const counts = await rows(
      client,
      `SELECT plan_code, count(*)::int AS subscribers,
              sum(CASE WHEN status = 'active' THEN 1 ELSE 0 END)::int AS active
         FROM subscriptions GROUP BY plan_code`
    );
    const byCode = Object.fromEntries(counts.map((c) => [c.plan_code, c]));
    return PLANS.map((p) => ({
      ...p,
      subscribers: byCode[p.code]?.subscribers || 0,
      active: byCode[p.code]?.active || 0,
      mrr: money(p.monthlyPrice * (byCode[p.code]?.active || 0)),
    }));
  })
);

/**
 * GET /api/v1/revenue/work — what agents and staff actually did.
 * `kind` separates agent decisions from fulfillment milestones.
 */
router.get(
  '/work',
  withClient(async (client, req) => {
    const { from, to } = parseWindow(req);
    const scope = scopeFor(req);
    const kind = String(req.query.kind || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);

    const params = [];
    const where = [];
    if (scope) {
      params.push(scope);
      where.push(`store_id = $${params.length}`);
    }
    params.push(`${from} 00:00:00`, `${to} 23:59:59`);
    where.push(`occurred_at BETWEEN $${params.length - 1} AND $${params.length}`);
    if (kind) {
      params.push(kind);
      where.push(`kind = $${params.length}`);
    }
    params.push(limit);
    const sql =
      `SELECT * FROM work_log WHERE ${where.join(' AND ')} ` +
      `ORDER BY occurred_at DESC LIMIT $${params.length}`;

    const entries = await rows(client, sql, params);

    const summary = await rows(
      client,
      `SELECT kind, actor_type, count(*)::int AS n FROM work_log
       WHERE occurred_at BETWEEN $1 AND $2 GROUP BY kind, actor_type`,
      [`${from} 00:00:00`, `${to} 23:59:59`]
    );

    const daily = await rows(
      client,
      `SELECT occurred_at::date AS date, kind, count(*)::int AS n FROM work_log
       WHERE occurred_at BETWEEN $1 AND $2 GROUP BY date, kind ORDER BY date`,
      [`${from} 00:00:00`, `${to} 23:59:59`]
    );

    return { window: { from, to }, entries, summary, daily };
  })
);

module.exports = router;
