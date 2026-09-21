const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../storage/database');
const logger = require('../../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

/**
 * Admin control-plane API for the dev dashboard.
 *
 * SECURITY MODEL:
 *  - Always requires an authenticated ADMIN (JWT) — see router.use below.
 *  - In production additionally requires DEBUG=true.
 *  - SQL inspection is READ-ONLY: only SELECT / EXPLAIN / WITH statements are
 *    allowed, values are bound as parameters (never interpolated), and a
 *    hard row limit is enforced.
 */

const requireDebugMode = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG !== 'true') {
    return res.status(404).json({
      success: false,
      error: 'Debug endpoints are not available in production'
    });
  }
  next();
};

router.use(authenticate, authorize('admin'), requireDebugMode);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function promisifyDbCall(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, result) => (err ? reject(err) : resolve(result)));
  });
}

const FORBIDDEN_SQL =
  /\b(insert|update|delete|drop|alter|create|replace|truncate|attach|detach|pragma|grant|revoke|vacuum|reindex)\b/i;
const ALLOWED_SQL_PREFIX = /^\s*(select|with|explain)\b/i;
const MAX_QUERY_ROWS = 500;
const MAX_QUERY_LENGTH = 4000;

function validateReadOnlySql(sql) {
  if (!sql || typeof sql !== 'string') {
    throw new Error('SQL query is required');
  }
  if (sql.length > MAX_QUERY_LENGTH) {
    throw new Error(`SQL query too long (max ${MAX_QUERY_LENGTH} characters)`);
  }
  if (sql.includes(';')) {
    throw new Error('Multiple statements are not allowed');
  }
  if (FORBIDDEN_SQL.test(sql)) {
    throw new Error('Only read-only SELECT queries are permitted');
  }
  if (!ALLOWED_SQL_PREFIX.test(sql)) {
    throw new Error('Only SELECT / WITH / EXPLAIN queries are permitted');
  }
  return sql;
}

function ensureDb(db) {
  if (!db || (!db.pool && !db.db)) {
    throw new Error('Database not initialized');
  }
  return db;
}

/**
 * Run a parameterized write statement against whichever driver is active.
 * Used ONLY by the admin control plane for guarded deletes/updates.
 */
async function runWrite(db, sql, params = []) {
  if (db.pool) {
    const client = await db.pool.connect();
    try {
      const result = await client.query(sql, params);
      return { changes: result.rowCount };
    } finally {
      client.release();
    }
  }
  return new Promise((resolve, reject) => {
    db.db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

async function runRead(db, sql, params = []) {
  if (db.pool) {
    const client = await db.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
  return promisifyDbCall(db.db.all.bind(db.db), sql, params);
}

/* ------------------------------------------------------------------ */
/* System summary                                                      */
/* ------------------------------------------------------------------ */

router.get('/system', async (req, res) => {
  try {
    const db = getDatabase();
    const summary = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      database: {
        type: process.env.DATABASE_TYPE || 'sqlite',
        initialized: !!(db && (db.pool || db.db)),
      },
      messaging: {
        kafkaConfigured: !!process.env.KAFKA_BROKERS,
        mqttConfigured: !!process.env.MQTT_URL,
        redisConfigured: !!(process.env.REDIS_URL || process.env.REDIS_HOST),
      },
    };
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* Database inspection (read-only)                                     */
/* ------------------------------------------------------------------ */

router.get('/database/test', async (req, res) => {
  try {
    const db = getDatabase();
    const isInitialized = db.pool !== null || db.db !== null;
    const result = {
      success: true,
      databaseType: process.env.DATABASE_TYPE || 'sqlite',
      isInitialized,
      hasPool: !!db.pool,
      hasDb: !!db.db,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    };
    if (isInitialized) {
      try {
        if (db.pool) {
          const client = await db.pool.connect();
          await client.query('SELECT NOW()');
          client.release();
          result.connectionTest = 'SUCCESS';
        } else if (db.db) {
          await promisifyDbCall(db.db.get.bind(db.db), 'SELECT 1');
          result.connectionTest = 'SUCCESS';
        }
      } catch (error) {
        result.connectionTest = 'FAILED';
        result.connectionError = error.message;
      }
    }
    res.json(result);
  } catch (error) {
    logger.error('Debug database test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/database/tables', async (req, res) => {
  try {
    const db = ensureDb(getDatabase());
    const tables = [];
    if (db.pool) {
      const client = await db.pool.connect();
      try {
        const result = await client.query(
          `SELECT table_name, (SELECT count(*) FROM information_schema.columns c
             WHERE c.table_name = t.table_name) AS column_count
           FROM information_schema.tables t
           WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
           ORDER BY table_name`
        );
        for (const row of result.rows) {
          const countResult = await client.query(
            `SELECT count(*)::int AS n FROM "${row.table_name}"`
          );
          tables.push({
            name: row.table_name,
            columnCount: row.column_count,
            rowCount: countResult.rows[0].n,
          });
        }
      } finally {
        client.release();
      }
    } else {
      const rows = await promisifyDbCall(
        db.db.all.bind(db.db),
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
      );
      for (const row of rows) {
        const countRow = await promisifyDbCall(
          db.db.get.bind(db.db),
          `SELECT COUNT(*) AS n FROM "${row.name}"`
        );
        const colRows = await promisifyDbCall(
          db.db.all.bind(db.db),
          `PRAGMA table_info("${row.name}")`
        );
        tables.push({
          name: row.name,
          columnCount: colRows.length,
          rowCount: countRow.n,
        });
      }
    }
    res.json({ success: true, data: tables });
  } catch (error) {
    logger.error('Failed to list tables:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/database/tables/:table/schema', async (req, res) => {
  try {
    const table = String(req.params.table).replace(/[^a-zA-Z0-9_]/g, '');
    const db = ensureDb(getDatabase());
    const columns = [];
    if (db.pool) {
      const client = await db.pool.connect();
      try {
        const result = await client.query(
          `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns WHERE table_name = $1
           ORDER BY ordinal_position`,
          [table]
        );
        for (const r of result.rows) {
          columns.push({
            name: r.column_name,
            type: r.data_type,
            nullable: r.is_nullable === 'YES',
            default: r.column_default,
          });
        }
      } finally {
        client.release();
      }
    } else {
      const colRows = await promisifyDbCall(
        db.db.all.bind(db.db),
        `PRAGMA table_info("${table}")`
      );
      for (const r of colRows) {
        columns.push({
          name: r.name,
          type: r.type,
          nullable: r.notnull === 0,
          default: r.dflt_value,
          pk: r.pk === 1,
        });
      }
    }
    res.json({ success: true, data: { table, columns } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/database/tables/:table/rows', async (req, res) => {
  try {
    const table = String(req.params.table).replace(/[^a-zA-Z0-9_]/g, '');
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, MAX_QUERY_ROWS);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const db = ensureDb(getDatabase());
    let rows;
    if (db.pool) {
      const client = await db.pool.connect();
      try {
        const result = await client.query(
          `SELECT * FROM "${table}" ORDER BY 1 LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        rows = result.rows;
      } finally {
        client.release();
      }
    } else {
      rows = await promisifyDbCall(
        db.db.all.bind(db.db),
        `SELECT * FROM "${table}" LIMIT ? OFFSET ?`,
        [limit, offset]
      );
    }
    res.json({ success: true, data: { table, limit, offset, rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/database/query', async (req, res) => {
  try {
    const { sql, params } = req.body || {};
    const safeSql = validateReadOnlySql(sql);
    const bound = Array.isArray(params) ? params.slice(0, 50) : [];
    const db = ensureDb(getDatabase());
    let rows;
    if (db.pool) {
      const client = await db.pool.connect();
      try {
        const result = await client.query(safeSql + ` LIMIT ${MAX_QUERY_ROWS}`, bound);
        rows = result.rows;
      } finally {
        client.release();
      }
    } else {
      rows = await promisifyDbCall(db.db.all.bind(db.db), safeSql, bound);
      if (rows.length > MAX_QUERY_ROWS) rows = rows.slice(0, MAX_QUERY_ROWS);
    }
    res.json({ success: true, data: { sql: safeSql, rowCount: rows.length, rows } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* Domain data quick access (via models, works for sqlite + postgres)  */
/* ------------------------------------------------------------------ */

router.get('/data/inventory/:storeId', async (req, res) => {
  try {
    const InventoryModel = require('../../models/inventoryModel');
    const items = await InventoryModel.getByStore(req.params.storeId);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/data/orders/:storeId', async (req, res) => {
  try {
    const OrderModel = require('../../models/orderModel');
    const orders = await OrderModel.getByStore(req.params.storeId);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/data/shipments/status/:status', async (req, res) => {
  try {
    const ShipmentModel = require('../../models/shipmentModel');
    const shipments = await ShipmentModel.getByStatus(req.params.status);
    res.json({ success: true, data: shipments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/data/users', async (req, res) => {
  try {
    const db = ensureDb(getDatabase());
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    let rows;
    if (db.pool) {
      const client = await db.pool.connect();
      try {
        const result = await client.query(
          'SELECT id, username, email, role, created_at FROM users ORDER BY id LIMIT $1',
          [limit]
        );
        rows = result.rows;
      } finally {
        client.release();
      }
    } else {
      rows = await promisifyDbCall(
        db.db.all.bind(db.db),
        'SELECT id, username, email, role, created_at FROM users ORDER BY id LIMIT ?',
        [limit]
      );
    }
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* Logs                                                                */
/* ------------------------------------------------------------------ */

router.get('/logs', async (req, res) => {
  try {
    const file = req.query.file === 'error' ? 'error.log' : 'combined.log';
    const lines = Math.min(parseInt(req.query.lines, 10) || 200, 1000);
    const logPath = path.join(process.cwd(), 'logs', file);
    if (!fs.existsSync(logPath)) {
      return res.json({ success: true, data: { file, lines: [] } });
    }
    const content = fs.readFileSync(logPath, 'utf8');
    const all = content.split('\n').filter(Boolean);
    const tail = all.slice(-lines).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
    res.json({ success: true, data: { file, total: all.length, lines: tail } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* Agent runtime control                                               */
/* ------------------------------------------------------------------ */

router.get('/agents', async (req, res) => {
  try {
    const agentRuntime = require('../../agent-runtime');
    let agents = {};
    try {
      agents = agentRuntime.getAllAgentsStatus ? agentRuntime.getAllAgentsStatus() : {};
    } catch {
      agents = { note: 'Agent runtime not started in this process' };
    }
    res.json({ success: true, data: agents });
  } catch (error) {
    res.json({ success: true, data: { note: `Agent runtime unavailable: ${error.message}` } });
  }
});

router.post('/agents/:name/:action', async (req, res) => {
  try {
    const { name, action } = req.params;
    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }
    const agentRuntime = require('../../agent-runtime');
    const processManager = agentRuntime.processManager;
    if (!processManager || !processManager.isInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Agent runtime not started in this process (run: npm run agent-runtime)'
      });
    }
    await processManager[action + 'Agent'](name);
    logger.info(`[control-plane] agent ${action}: ${name} by admin ${req.user.username}`);
    res.json({ success: true, data: { agent: name, action } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* Cache operations                                                    */
/* ------------------------------------------------------------------ */

router.get('/cache/stats', async (req, res) => {
  try {
    const cacheService = require('../../services/cacheService');
    res.json({ success: true, data: cacheService.getCacheStats() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cache/clear', async (req, res) => {
  try {
    const cacheService = require('../../services/cacheService');
    await cacheService.clear();
    logger.info(`[control-plane] cache cleared by admin ${req.user.username}`);
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* Backups                                                             */
/* ------------------------------------------------------------------ */

router.get('/backups', async (req, res) => {
  try {
    const DatabaseBackup = require('../../storage/backup');
    const db = getDatabase();
    const dbPath =
      (db && db.dbPath) || path.join(process.cwd(), 'data', 'cscm_local.db');
    const backup = new DatabaseBackup(dbPath);
    res.json({ success: true, data: backup.listBackups() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/backups', async (req, res) => {
  try {
    const DatabaseBackup = require('../../storage/backup');
    const db = getDatabase();
    const dbPath =
      (db && db.dbPath) || path.join(process.cwd(), 'data', 'cscm_local.db');
    const backup = new DatabaseBackup(dbPath);
    const result = await backup.createBackup();
    logger.info(`[control-plane] backup created by admin ${req.user.username}`);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* Admin write operations (guarded deletes / role updates)             */
/* ------------------------------------------------------------------ */

const WRITE_ACTIONS = {
  'delete-user': {
    sql: 'DELETE FROM users WHERE id = ?',
    pgSql: 'DELETE FROM users WHERE id = $1',
  },
  'delete-order': {
    sql: 'DELETE FROM orders WHERE order_id = ?',
    pgSql: 'DELETE FROM orders WHERE order_id = $1',
  },
  'delete-shipment': {
    sql: 'DELETE FROM shipments WHERE shipment_id = ?',
    pgSql: 'DELETE FROM shipments WHERE shipment_id = $1',
  },
  'delete-inventory': {
    sql: 'DELETE FROM inventory WHERE store_id = ? AND product_id = ?',
    pgSql: 'DELETE FROM inventory WHERE store_id = $1 AND product_id = $2',
  },
};

router.post('/data/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const spec = WRITE_ACTIONS[action];
    if (!spec) {
      return res.status(404).json({ success: false, error: 'Unknown admin action' });
    }
    const params = Array.isArray(req.body && req.body.params) ? req.body.params : [];
    if (!params.length) {
      return res.status(400).json({ success: false, error: 'params[] is required' });
    }
    const db = ensureDb(getDatabase());
    const result = await runWrite(db, db.pool ? spec.pgSql : spec.sql, params);
    logger.warn(
      `[control-plane] ${action} by admin ${req.user.username} (changes: ${result.changes})`
    );
    res.json({ success: true, data: { action, ...result } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/data/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body || {};
    const allowed = ['user', 'admin', 'shopkeeper', 'transporter', 'wholesaler', 'guest'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, error: `role must be one of: ${allowed.join(', ')}` });
    }
    const db = ensureDb(getDatabase());
    const result = await runWrite(
      db,
      db.pool
        ? 'UPDATE users SET role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1'
        : 'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      db.pool ? [req.params.id, role] : [req.params.id, role]
    );
    logger.warn(`[control-plane] role change for user ${req.params.id} -> ${role} by ${req.user.username}`);
    res.json({ success: true, data: { id: req.params.id, role, changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* User simulation control (in-process lifecycle for the dashboard)    */
/* ------------------------------------------------------------------ */

let simulationState = { running: false, startedAt: null, report: null };

router.get('/simulation/status', async (req, res) => {
  res.json({ success: true, data: simulationState });
});

router.post('/simulation/:action', async (req, res) => {
  try {
    const { action } = req.params;
    if (action === 'start') {
      if (simulationState.running) {
        return res.status(409).json({ success: false, error: 'Simulation already running' });
      }
      const { runContinuousSimulation } = require('../../simulation');
      simulationState = { running: true, startedAt: new Date().toISOString(), report: null };
      // Fire-and-forget: continuous simulation runs until stopped.
      runContinuousSimulation()
        .then((report) => {
          simulationState.running = false;
          simulationState.report = report || null;
        })
        .catch((error) => {
          simulationState.running = false;
          simulationState.report = { error: error.message };
          logger.error(`[control-plane] simulation failed: ${error.message}`);
        });
      logger.info(`[control-plane] simulation started by admin ${req.user.username}`);
      return res.json({ success: true, data: simulationState });
    }
    if (action === 'stop') {
      const simulator = require('../../simulation').simulator;
      if (simulator && typeof simulator.stopSimulation === 'function') {
        simulator.stopSimulation();
      }
      simulationState.running = false;
      logger.info(`[control-plane] simulation stopped by admin ${req.user.username}`);
      return res.json({ success: true, data: simulationState });
    }
    return res.status(400).json({ success: false, error: 'action must be start or stop' });
  } catch (error) {
    simulationState.running = false;
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------ */
/* Legacy debug create-user (kept for compatibility)                   */
/* ------------------------------------------------------------------ */

router.post('/database/create-user', async (req, res) => {
  try {
    const { username, email, password, role } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    const db = ensureDb(getDatabase());
    if (!db.pool && !db.db) {
      await db.initialize();
    }
    const id = await db.createUser({ username, email, password, role: role || 'user' });
    res.json({ success: true, message: 'User created successfully', userId: id });
  } catch (error) {
    logger.error('Debug create user failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
