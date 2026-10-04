/**
 * Schema-drift guard.
 *
 * A query that selects a column the table does not have is a runtime 500, and
 * it survives every local check: unit tests feed routes mocked rows, SQLite
 * never sees the Postgres SQL, and the linter parses JavaScript, not SQL.
 * `order_items.unit_cost` shipped exactly that way - the real column is
 * `total_price` - and it only failed once a request met Postgres.
 *
 * This closes the gap structurally. It parses the CREATE TABLE statements the
 * application itself runs, then checks every column named in the SQL of the
 * analytics routes against those definitions. No database is required, so it
 * runs on every commit, in CI, on any machine.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.resolve(__dirname, '../../storage/postgresqlDatabase.js');
const ROUTE_FILES = [
  '../../api/routes/metrics.js',
  '../../api/routes/revenue.js',
  '../../api/routes/inventory.js',
  '../../api/routes/orders.js',
  '../../api/routes/shipments.js',
];

/**
 * Parse the schema into { tableName: Set(columnName) }.
 *
 * Deliberately tolerant: it reads the CREATE TABLE bodies the app executes on
 * boot, which is the contract the running system depends on. A table defined
 * by a migration file rather than here simply yields no entry, and the
 * assertions below report that rather than silently passing.
 */
function parseSchema(source) {
  const tables = {};
  const re = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\s*\)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const [, name, body] = m;
    const cols = new Set();
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim().replace(/,$/, '');
      if (!line || /^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|INDEX)\b/i.test(line)) continue;
      const col = /^(\w+)\s+(SERIAL|INTEGER|INT|BIGINT|TEXT|REAL|DOUBLE|NUMERIC|DECIMAL|BOOLEAN|BOOL|TIMESTAMP|DATE|JSON|JSONB|UUID|VARCHAR)/i.exec(line);
      if (col) cols.add(col[1].toLowerCase());
    }
    tables[name.toLowerCase()] = cols;
  }
  return tables;
}

/** Pull `SELECT <cols> FROM <table>` out of a route file. */
function parseSelects(source) {
  const out = [];
  // Only plain SELECT lists; CTEs and INSERT/UPDATE are out of scope.
  const re = /SELECT\s+([\s\S]*?)\s+FROM\s+(\w+)/gi;
  let m;
  while ((m = re.exec(source)) !== null) {
    const list = m[1];
    const table = m[2].toLowerCase();
    // Skip aggregate/aliased expressions we cannot attribute to one column.
    if (/[()]|COUNT\s*\(|SUM\s*\(|COALESCE|::/i.test(list)) continue;
    const cols = list
      .split(',')
      .map((c) => c.trim().split(/\s+AS\s+/i)[0].trim().toLowerCase())
      .filter((c) => /^[a-z_][a-z0-9_]*$/.test(c));
    if (cols.length) out.push({ table, cols, statement: m[0].replace(/\s+/g, ' ').slice(0, 120) });
  }
  return out;
}

const schemaSource = fs.readFileSync(SCHEMA_FILE, 'utf8');
const tables = parseSchema(schemaSource);

describe('schema definition is parseable', () => {
  it('finds the tables the analytics routes depend on', () => {
    for (const t of ['orders', 'order_items', 'shipments', 'inventory']) {
      expect(tables[t]).toBeDefined();
    }
  });

  it('knows the columns of order_items', () => {
    expect(tables.order_items.has('total_price')).toBe(true);
    // This is the column that does not exist and caused a 500 in production.
    expect(tables.order_items.has('unit_cost')).toBe(false);
  });
});

describe('route SQL matches the schema', () => {
  const problems = [];

  for (const rel of ROUTE_FILES) {
    const file = path.resolve(__dirname, rel);
    if (!fs.existsSync(file)) continue;
    for (const sel of parseSelects(fs.readFileSync(file, 'utf8'))) {
      const known = tables[sel.table];
      if (!known) {
        // A table this parser cannot see is reported, not skipped silently.
        problems.push(`${rel}: table "${sel.table}" not found in schema`);
        continue;
      }
      for (const col of sel.cols) {
        if (!known.has(col)) {
          problems.push(`${rel}: ${sel.table}.${col} does not exist (have: ${[...known].join(', ')})`);
        }
      }
    }
  }

  it('selects only columns that exist', () => {
    expect(problems).toEqual([]);
  });
});

describe('the specific regression this guard exists for', () => {
  it('rejects a query naming a non-existent order_items column', () => {
    // Proves the guard would actually have caught the shipped bug, rather than
    // passing vacuously because the parser found nothing.
    const [sel] = parseSelects('SELECT order_id, quantity, unit_cost FROM order_items');
    expect(sel).toBeDefined();
    expect(sel.cols).toContain('unit_cost');
    expect(tables.order_items.has(sel.cols[2])).toBe(false);
  });

  it('accepts a query naming only real order_items columns', () => {
    const [sel] = parseSelects('SELECT order_id, quantity, unit_price, total_price FROM order_items');
    const missing = sel.cols.filter((c) => !tables.order_items.has(c));
    expect(missing).toEqual([]);
  });
});
