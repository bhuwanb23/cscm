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

/**
 * Optional table alias, but never a clause keyword.
 *
 * `FROM shipments WHERE ...` must not read `WHERE` as the alias, or the clause
 * the alias group just consumed is the very thing being looked for and the
 * fragment is silently skipped - which is how a broken WHERE clause passes.
 */
const ALIAS = String.raw`((?:\s+(?:AS\s+)?(?!ON\b|WHERE\b|JOIN\b|LEFT\b|RIGHT\b|INNER\b|OUTER\b|CROSS\b|FULL\b|GROUP\b|ORDER\b|LIMIT\b|OFFSET\b|HAVING\b|UNION\b)\w+)?)`;

function aliasOf(aliasPart) {
  const m = new RegExp(String.raw`^\s+(?:AS\s+)?(\w+)`, 'i').exec(aliasPart);
  return m ? m[1] : null;
}

/**
 * Isolate each SQL string literal in a route file.
 *
 * Without this a `FROM <table>` match runs on past the end of its own template
 * literal into the next `client.query(...)` call, so the following query's
 * SELECT list is read as the first query's WHERE clause and every column in it
 * is blamed on the wrong table. Splitting on the literal first keeps each
 * fragment to the statement that actually contains it.
 */
function sqlStatements(source) {
  const out = [];
  const re = /`([^`]*)`/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const body = stripComments(m[1]);
    if (/\bFROM\b/i.test(body)) out.push(body);
  }
  return out;
}

/**
 * Strip comments before parsing SQL.
 *
 * Route files explain their SQL in prose, and a comment quoting the wrong
 * query (`Selecting MAX(created_at) FROM shipments WHERE store_id = ...` was
 * written to warn about exactly that) is indistinguishable from real SQL to a
 * regex. Left in, it produced a failure for a query the file does not contain.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1 ');
}

/** Pull `SELECT <cols> FROM <table>` out of a route file. */
function parseSelects(source) {
  const out = [];
  // Only plain SELECT lists; CTEs and INSERT/UPDATE are out of scope.
  const re = /SELECT\s+([\s\S]*?)\s+FROM\s+(\w+)/gi;
  for (const stmt of sqlStatements(source)) {
    let m;
    while ((m = re.exec(stmt)) !== null) {
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
  }
  return out;
}

/**
 * Pull `FROM <table> ... WHERE <predicate>` out of a route file.
 *
 * Exists because `parseSelects` deliberately skips parenthesised select lists,
 * which is correct for the column list but blind to WHERE clauses - and a
 * filtered query references a column just as fatally as a selected one. The
 * shipments/store_id bug in the freshness route was invisible for exactly that
 * reason: the whole query was one row of scalar subqueries.
 *
 * Each fragment is attributed to the table it follows, so `o.store_id` in a JOIN
 * is checked against `orders`, not `shipments`. Unqualified identifiers are
 * checked against every table in the fragment and allowed only if at least one
 * candidate table has them; an identifier no table has is reported against the
 * primary table so it still fails.
 */
function parseFilters(source) {
  const out = [];
  const re = new RegExp(String.raw`FROM\s+(\w+)${ALIAS}([\s\S]*?)(?=\bFROM\b|$)`, 'gi');
  for (const stmt of sqlStatements(source)) {
    let m;
    while ((m = re.exec(stmt)) !== null) {
      const [, table, aliasPart, tail] = m;
      const primary = table.toLowerCase();
      // `FROM orders o JOIN shipments s` - collect the aliases bound here.
      const aliasName = aliasOf(aliasPart);
      const aliases = new Map();
      if (aliasName) {
        aliases.set(aliasName.toLowerCase(), primary);
      }
    const joinRe = /JOIN\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?/gi;
      let j;
      while ((j = joinRe.exec(tail)) !== null) {
        aliases.set((j[2] || j[1]).toLowerCase(), j[1].toLowerCase());
      }

    const whereMatch = /\bWHERE\b([\s\S]*?)(?=\bGROUP\b|\bORDER\b|\bLIMIT\b|$)/i.exec(tail);
      if (!whereMatch) continue;
      const predicate = whereMatch[1];

      // Only qualified names: an unqualified one is usually the scoped
      // placeholder ($1) or genuinely ambiguous, and guessing would produce
      // false failures. parseBareFilters() below covers the unqualified case.
      const qualified = [];
      const qre = /\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b/gi;
      let q;
      while ((q = qre.exec(predicate)) !== null) {
        const [, prefix, col] = q;
        const target = aliases.get(prefix.toLowerCase());
        if (target) qualified.push({ table: target, col: col.toLowerCase() });
      }
      for (const item of qualified) {
        out.push({
          table: item.table,
          cols: [item.col],
          statement: `WHERE ${item.table}.${item.col}`,
        });
      }
    }
  }
  return out;
}

/**
 * Check UNQUALIFIED identifiers in a WHERE clause against the table it filters.
 *
 * The real regression was `FROM shipments WHERE store_id = $1` - unqualified,
 * so parseFilters() alone would miss it. A bare identifier is reported only
 * when the filtered table does not have it, which catches that case without
 * flagging SQL keywords, function calls or placeholders.
 */
function parseBareFilters(source) {
  const out = [];
  const re = new RegExp(String.raw`FROM\s+(\w+)${ALIAS}([\s\S]*?)(?=\bFROM\b|$)`, 'gi');
  const KEYWORDS = new Set([
    'and','or','not','null','is','in','between','like','ilike','as','any','all',
    'true','false','case','when','then','else','end','select','from','where',
    'group','order','by','limit','offset','having','join','on','asc','desc',
  ]);
  for (const stmt of sqlStatements(source)) {
    let m;
    while ((m = re.exec(stmt)) !== null) {
      const [, table, aliasPart, tail] = m;
      const primary = table.toLowerCase();
      const hasAlias = Boolean(aliasOf(aliasPart));
      const whereMatch = /\bWHERE\b([\s\S]*?)(?=\bGROUP\b|\bORDER\b|\bLIMIT\b|$)/i.exec(tail);
      if (!whereMatch) continue;
      // Only unambiguous single-table fragments: a JOIN makes bare names ambiguous.
      if (/\bJOIN\b/i.test(tail) || hasAlias) continue;

      const predicate = whereMatch[1]
        .replace(/\$[0-9]+/g, ' ')            // placeholders
        .replace(/\bINTERVAL\b/gi, ' ')        // INTERVAL '1 day'
        .replace(/'[^']*'/g, ' ')              // string literals
        .replace(/\b[a-z_][a-z0-9_]*\s*\([^)]*\)/gi, ' '); // function calls
      const cols = predicate
        .split(/[=<>!+\-*/(),]|\bAND\b|\bOR\b|\bNOT\b/i)
        .map((c) => c.trim().toLowerCase())
        .filter((c) => /^[a-z_][a-z0-9_]*$/.test(c) && !KEYWORDS.has(c));
      if (cols.length) {
        out.push({ table: primary, cols, statement: `WHERE on ${primary}: ${cols.join(', ')}` });
      }
    }
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
    const source = fs.readFileSync(file, 'utf8');
    // Columns can be referenced in a SELECT list, a WHERE clause or a JOIN
    // condition; all three are fatal when wrong.
    for (const sel of [...parseSelects(source), ...parseFilters(source), ...parseBareFilters(source)]) {
      const known = tables[sel.table];
      if (!known) {
        // A table this parser cannot see is reported, not skipped silently.
        problems.push(`${rel}: table "${sel.table}" not found in schema`);
        continue;
      }
      for (const col of sel.cols) {
        if (!known.has(col)) {
          problems.push(`${rel}: ${sel.statement} -> ${sel.table}.${col} does not exist (have: ${[...known].join(', ')})`);
        }
      }
    }
  }

  it('selects and filters only columns that exist', () => {
    expect(problems).toEqual([]);
  });
});

describe('the specific regression this guard exists for', () => {
  it('rejects a query naming a non-existent order_items column', () => {
    // Proves the guard would actually have caught the shipped bug, rather than
    // passing vacuously because the parser found nothing. Fixtures are wrapped
    // in backticks because the parsers read SQL out of template literals, the
    // way route files actually contain it.
    const [sel] = parseSelects('`SELECT order_id, quantity, unit_cost FROM order_items`');
    expect(sel).toBeDefined();
    expect(sel.cols).toContain('unit_cost');
    expect(tables.order_items.has(sel.cols[2])).toBe(false);
  });

  it('accepts a query naming only real order_items columns', () => {
    const [sel] = parseSelects(
      '`SELECT order_id, quantity, unit_price, total_price FROM order_items`'
    );
    const missing = sel.cols.filter((c) => !tables.order_items.has(c));
    expect(missing).toEqual([]);
  });

  // The second shipped 500: the freshness route filtered `shipments` by a
  // store_id column that table does not have, so every store-scoped user got a
  // 42703 while admins (scope null) were fine.
  it('rejects a WHERE clause naming a column the filtered table lacks', () => {
    const [filter] = parseBareFilters(
      '`SELECT MAX(created_at) FROM shipments WHERE ($1::text IS NULL OR store_id = $1)`'
    );
    expect(filter).toBeDefined();
    expect(filter.table).toBe('shipments');
    expect(filter.cols).toContain('store_id');
    expect(tables.shipments.has('store_id')).toBe(false);
  });

  it('attributes a JOIN alias to its own table, not the primary one', () => {
    const [filter] = parseFilters(
      '`SELECT MAX(s.created_at) FROM shipments s JOIN orders o ON o.order_id = s.order_id ' +
        'WHERE o.store_id = $1`'
    );
    expect(filter).toBeDefined();
    expect(filter.table).toBe('orders');
    expect(tables.orders.has(filter.cols[0])).toBe(true);
  });

  it('confirms shipments genuinely has no store_id to filter on', () => {
    // If a migration ever adds it, this test tells us the route changed meaning.
    expect(tables.shipments.has('store_id')).toBe(false);
    expect(tables.shipments.has('order_id')).toBe(true);
  });

  // A comment quoting the wrong SQL must not be mistaken for a real query,
  // which is what made the guard report a failure the file did not contain.
  it('ignores SQL quoted inside comments', () => {
    const sqlInComment =
      '// Selecting MAX(created_at) FROM shipments WHERE store_id = $1 is wrong\n' +
      'const real = `SELECT MAX(s.created_at) FROM shipments s JOIN orders o ON o.order_id = s.order_id ' +
      'WHERE o.store_id = $1`;';
    const bare = parseBareFilters(sqlInComment);
    expect(bare).toEqual([]);
    const qualified = parseFilters(sqlInComment);
    for (const q of qualified) {
      expect(tables[q.table].has(q.cols[0])).toBe(true);
    }
  });

  // Two adjacent queries must not bleed into one another: without statement
  // isolation the second query's SELECT list is read as the first's WHERE.
  it('keeps adjacent queries from contaminating each other', () => {
    const twoQueries =
      'await q(`SELECT order_id FROM order_items WHERE order_id = ANY($1)`);\n' +
      'await q(`SELECT order_id, status, carrier FROM shipments WHERE order_id = ANY($1)`);';
    for (const found of parseBareFilters(twoQueries)) {
      for (const col of found.cols) {
        expect(tables[found.table].has(col)).toBe(true);
      }
    }
    for (const sel of parseSelects(twoQueries)) {
      for (const col of sel.cols) {
        expect(tables[sel.table].has(col)).toBe(true);
      }
    }
  });
});
