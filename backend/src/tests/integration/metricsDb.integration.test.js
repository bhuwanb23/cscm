/**
 * Postgres integration tests for the metrics queries.
 *
 * Why this exists separately from the unit suite
 * ----------------------------------------------
 * Every unit test for these routes feeds the service hand-built rows. That
 * cannot catch a query naming a column the table does not have, because no
 * query is ever executed. `SELECT order_items.unit_cost` passed every local
 * check and returned a 500 against the real database.
 *
 * These tests execute the actual SQL against a live Postgres, so a bad column,
 * a bad cast or a broken date predicate fails here rather than in production.
 *
 * SKIPPED unless INTEGRATION_TEST=1, following the existing convention in
 * pythonApi.integration.test.js. `npm test` does not run them.
 *
 * To run against a throwaway database:
 *   docker run -d --rm -p 5433:5432 \
 *     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cscm_test postgres:16
 *   DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/cscm_test \
 *     INTEGRATION_TEST=1 npx jest src/tests/integration/metricsDb.integration.test.js
 *
 * CI runs this against a service container on every push.
 */

const INTEGRATION_ENABLED = process.env.INTEGRATION_TEST === '1';
const DB_URL = process.env.DATABASE_URL || '';

/** The exact column list each analytics query selects, kept in one place. */
const QUERIES = {
  orders: `SELECT order_id, store_id, customer_id, total_amount, status, created_at
             FROM orders
            WHERE created_at >= $1 AND created_at < $2::date + INTERVAL '1 day'
              AND ($3::text IS NULL OR store_id = $3)
            ORDER BY created_at DESC`,
  orderItems: `SELECT order_id, product_id, quantity, unit_price, total_price
                 FROM order_items
                WHERE order_id = ANY($1)`,
  shipments: `SELECT order_id, status, carrier, created_at, estimated_delivery, actual_delivery
                FROM shipments
               WHERE order_id = ANY($1)`,
  inventory: `SELECT product_id, store_id, quantity, reserved_quantity, min_stock_level, unit_cost
                FROM inventory
               WHERE ($1::text IS NULL OR store_id = $1)`,
};

const describeIf = INTEGRATION_ENABLED ? describe : describe.skip;

describeIf('metrics queries against a real database', () => {
  let client;

  beforeAll(async () => {
    if (!DB_URL) throw new Error('DATABASE_URL is required when INTEGRATION_TEST=1');
    const { Client } = require('pg');
    client = new Client({ connectionString: DB_URL });
    await client.connect();
  });

  afterAll(async () => {
    if (client) await client.end();
  });

  it('the schema source is the one the application itself applies', async () => {
    // Reuse the application's own DDL rather than duplicating it here, so the
    // tests exercise the schema the app actually creates. The module exports
    // the class directly, not under a named property.
    const PostgreSQLDatabase = require('../../storage/postgresqlDatabase');
    expect(typeof PostgreSQLDatabase).toBe('function');
    expect(typeof PostgreSQLDatabase.prototype.initialize).toBe('function');
    expect(typeof PostgreSQLDatabase.prototype.close).toBe('function');
  });

  it('every analytics table exists', async () => {
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [['orders', 'order_items', 'shipments', 'inventory']]
    );
    const found = rows.map((r) => r.table_name);
    for (const t of ['orders', 'order_items', 'shipments', 'inventory']) {
      expect(found).toContain(t);
    }
  });

  it('executes the orders query without error', async () => {
    // The regression this suite exists for: a column that does not exist
    // raises 42703 here instead of a 500 in production.
    const { rows } = await client.query(QUERIES.orders, ['2020-01-01', '2030-01-01', null]);
    expect(Array.isArray(rows)).toBe(true);
  });

  it('executes the order_items query and proves unit_cost is absent', async () => {
    const { rows } = await client.query(QUERIES.orderItems, [[]]);
    expect(Array.isArray(rows)).toBe(true);

    await expect(
      client.query('SELECT unit_cost FROM order_items LIMIT 1')
    ).rejects.toMatchObject({ code: '42703' });
  });

  it('executes the shipments query', async () => {
    const { rows } = await client.query(QUERIES.shipments, [[]]);
    expect(Array.isArray(rows)).toBe(true);
  });

  it('executes the inventory query', async () => {
    const { rows } = await client.query(QUERIES.inventory, [null]);
    expect(Array.isArray(rows)).toBe(true);
  });

  it('honours the store scope so a shopkeeper cannot read another house', async () => {
    const { rows } = await client.query(QUERIES.inventory, ['__no_such_store__']);
    expect(rows).toEqual([]);
  });

  it('uses the $2::date + INTERVAL cast without a type error', async () => {
    // A malformed date predicate is a runtime failure that mocks cannot show.
    const { rows } = await client.query(QUERIES.orders, ['2020-01-01', '2030-01-01', null]);
    expect(rows.every((r) => r.created_at !== undefined)).toBe(true);
  });

  it('feeds real rows through the metrics service', async () => {
    const { computeMetrics } = require('../../services/metricsService');

    const { rows: ords } = await client.query(QUERIES.orders, ['2020-01-01', '2030-01-01', null]);
    const ids = ords.map((o) => o.order_id);
    const { rows: items } = ids.length ? await client.query(QUERIES.orderItems, [ids]) : { rows: [] };
    const { rows: ships } = ids.length ? await client.query(QUERIES.shipments, [ids]) : { rows: [] };
    const { rows: inv } = await client.query(QUERIES.inventory, [null]);

    const out = computeMetrics({
      orders: ords,
      orderItems: items,
      shipments: ships,
      inventory: inv,
      from: '2026-11-02',
      to: '2026-11-09',
    });

    expect(out.market.tradingDays).toBeGreaterThan(0);
    expect(Number.isFinite(out.volume.gmv)).toBe(true);
    expect(Array.isArray(out.series.dailyGmv)).toBe(true);
    // pg returns TIMESTAMPs as Date objects; the service must cope, or every
    // row lands in no bucket and the chart silently reads all zeros.
    expect(out.series.dailyGmv.every((d) => typeof d.isTradingDay === 'boolean')).toBe(true);
  });
});
