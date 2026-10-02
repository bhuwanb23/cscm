#!/usr/bin/env node
/**
 * CSCM September 2026 history seeder
 * ==================================
 * Backfills the production PostgreSQL database (Render) with a believable
 * month of user onboarding + daily business activity so the deployed product
 * shows a real history of usage:
 *
 *   phase 1  roster    - 23 users (8 Downtown shops, 8 transporters,
 *                        5 wholesalers, 2 admins) with staggered
 *                        Sep 1-10 signup timestamps and working logins
 *   phase 2  history   - Sep 1 -> Sep 30 daily orders, order items,
 *                        shipments and inventory movements (deterministic,
 *                        idempotent, coherent status lifecycles)
 *   phase 3  verify    - day-by-day count tables for review
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/seed-history.js --phase=all
 *   DATABASE_URL=postgres://... node scripts/seed-history.js --phase=roster
 *   DATABASE_URL=postgres://... node scripts/seed-history.js --phase=history --reset
 *   node scripts/seed-history.js --phase=all --dry-run     # plan only, no DB
 *
 * Options:
 *   --phase=roster|history|verify|all   (default: all)
 *   --dry-run     print the plan without touching the database
 *   --reset       delete previously seeded ORD- / SHP- rows before backfill
 *
 * Env:
 *   DATABASE_URL     Render Postgres EXTERNAL connection string (required)
 *   SEED_PASSWORD    password for every seeded demo user (default below)
 *   SEED_FROM/SEED_TO  activity window (default 2026-09-01 .. 2026-09-30)
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};

const PHASE = opt('phase', 'all');
const DRY_RUN = flag('dry-run');
const RESET = flag('reset');

const FROM = process.env.SEED_FROM || '2026-09-01';
const TO = process.env.SEED_TO || '2026-09-30';
// SECURITY: the demo password is NOT hardcoded. A literal fallback here would
// be published in this public repo and would become the real password of every
// seeded account in production. Callers must opt in explicitly.
const PASSWORD = process.env.SEED_PASSWORD;
if (!PASSWORD) {
  console.error(
    'SEED_PASSWORD is required. Generate one, e.g. ' +
    'SEED_PASSWORD="$(openssl rand -base64 18)Aa1!" npm run seed:history\n' +
    'It is deliberately not defaulted in source so it cannot leak via git.'
  );
  process.exit(1);
}
const DATABASE_URL = process.env.DATABASE_URL;

// ---------------------------------------------------------------------------
// Domain constants - all 8 shops are the SAME type: Downtown
// ---------------------------------------------------------------------------
const STORE_TYPE = 'Downtown';
const STORES = Array.from({ length: 8 }, (_, i) => `STORE${String(i + 1).padStart(3, '0')}`);
const SKUS = Array.from({ length: 5 }, (_, i) => `SKU${String(i + 1).padStart(3, '0')}`);
const LOCATIONS = ['DELHI', 'MUMBAI', 'BANGALORE', 'CHENNAI', 'KOLKATA'];
const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date();

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const pad = (n, w = 2) => String(n).padStart(w, '0');
const ts = (d) => d.toISOString().slice(0, 19).replace('T', ' '); // UTC 'YYYY-MM-DD HH:MM:SS'
const at = (day, h, m) => new Date(`${day}T${pad(h)}:${pad(m)}:00Z`);
const dayKey = (d) => d.toISOString().slice(0, 10);

function eachDay(from, to) {
  const out = [];
  let cur = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cur <= end) {
    out.push(dayKey(cur));
    cur = new Date(cur.getTime() + DAY_MS);
  }
  return out;
}

// Deterministic PRNG so every run produces the same history (seeded 2026-09-01)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const chance = (rng, p) => rng() < p;

// ---------------------------------------------------------------------------
// Roster: staggered, believable onboarding (admins first, then shops,
// transporters, wholesalers) - all on business days.
// ---------------------------------------------------------------------------
function buildRoster() {
  const roster = [];
  const add = (username, role, day, h, m, storeId) =>
    roster.push({
      username,
      role,
      email: `${username}@cscm-sim.local`,
      store_id: storeId || null,
      store_type: storeId ? STORE_TYPE : null,
      signup: at(day, h, m),
    });

  // Operators first
  add('admin_001', 'admin', '2026-09-01', 9, 0);
  add('admin_002', 'admin', '2026-09-01', 9, 40);

  // 8 Downtown shops onboard Sep 1-4 (2 per day)
  const shopDays = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'];
  for (let i = 0; i < 8; i++) {
    const day = shopDays[Math.floor(i / 2)];
    add(`shopkeeper_${pad(i + 1, 3)}`, 'shopkeeper', day, i % 2 === 0 ? 10 : 15, (i * 7) % 60, STORES[i]);
  }

  // 8 transporters onboard Sep 2-7 (business days)
  const trDays = ['2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07'];
  for (let i = 0; i < 8; i++) {
    const day = trDays[Math.floor(i / 2)];
    add(`transporter_${pad(i + 1, 3)}`, 'transporter', day, i % 2 === 0 ? 11 : 16, (i * 11) % 60);
  }

  // 5 wholesalers onboard Sep 8-10
  const whDays = ['2026-09-08', '2026-09-09', '2026-09-10'];
  for (let i = 0; i < 5; i++) {
    const day = whDays[Math.floor(i / 2)];
    add(`wholesaler_${pad(i + 1, 3)}`, 'wholesaler', day, i % 2 === 0 ? 10 : 14, (i * 13) % 60);
  }

  return roster;
}

// ---------------------------------------------------------------------------
// History plan: Sep 1 -> Sep 30, medium volume (15-30 orders/weekday),
// ramp-up in week 1, quieter weekends, coherent status lifecycles.
// ---------------------------------------------------------------------------
function buildHistoryPlan() {
  const rng = mulberry32(20260901);
  const days = eachDay(FROM, TO);
  const plan = [];

  days.forEach((day, idx) => {
    const date = new Date(`${day}T12:00:00Z`);
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const ramp = idx < 7 ? 0.55 + 0.45 * (idx / 7) : 1; // product-market-fit ramp
    const target = int(rng, 15, 30) * ramp * (weekend ? 0.45 : 1);
    const nOrders = Math.max(4, Math.round(target));

    const orders = [];
    const shipments = [];

    for (let k = 0; k < nOrders; k++) {
      // Business-hours ordering, weighted toward late morning / mid afternoon
      const hour = pick(rng, [10, 11, 11, 14, 15, 16, 17]);
      const created = at(day, hour, int(rng, 0, 59));
      if (created > NOW) continue; // never create rows in the future

      const storeIdx = int(rng, 0, STORES.length - 1);
      const storeId = STORES[storeIdx];
      // 75% of orders come from the shop that owns the store, 25% wholesale
      const fromWholesaler = chance(rng, 0.25);
      const customer = fromWholesaler
        ? `wholesaler_${pad(int(rng, 1, 5), 3)}`
        : `shopkeeper_${pad(storeIdx + 1, 3)}`;

      const itemCount = int(rng, 1, 4);
      const chosenSkus = [];
      while (chosenSkus.length < itemCount) {
        const sku = pick(rng, SKUS);
        if (!chosenSkus.includes(sku)) chosenSkus.push(sku);
      }
      const items = chosenSkus.map((sku) => {
        const quantity = int(rng, 5, 40);
        const unit_price = Math.round((20 + rng() * 180) * 100) / 100;
        return { product_id: sku, quantity, unit_price, total_price: +(quantity * unit_price).toFixed(2) };
      });
      const total_amount = +items.reduce((s, it) => s + it.total_price, 0).toFixed(2);

      // Status derived from age: everything older than ~3 days is delivered
      const ageDays = (NOW - created) / DAY_MS;
      let status;
      if (ageDays > 3) status = 'delivered';
      else if (ageDays > 1) status = 'shipped';
      else status = chance(rng, 0.5) ? 'processing' : 'confirmed';

      const updated =
        status === 'delivered'
          ? new Date(Math.min(created.getTime() + (2 + rng() * 2) * DAY_MS, NOW.getTime() - 3600000))
          : new Date(created.getTime() + 45 * 60000);

      const orderId = `ORD-${day.replace(/-/g, '')}-${pad(k + 1, 3)}`;
      orders.push({
        order_id: orderId,
        store_id: storeId,
        customer_id: customer,
        total_amount,
        status,
        created,
        updated,
        items,
      });

      // Ship most orders; every shipped/delivered order gets a shipment
      const shipProb = status === 'delivered' || status === 'shipped' ? 0.92 : 0.45;
      if (chance(rng, shipProb)) {
        const shipCreated = new Date(created.getTime() + int(rng, 1, 20) * 60 * 60000);
        if (shipCreated <= NOW) {
          let shipStatus;
          if (status === 'delivered') shipStatus = 'delivered';
          else if (status === 'shipped') shipStatus = 'in_transit';
          else shipStatus = chance(rng, 0.5) ? 'pending' : 'in_transit';

          const from = pick(rng, LOCATIONS);
          let to = pick(rng, LOCATIONS);
          while (to === from) to = pick(rng, LOCATIONS);

          const estimated = new Date(shipCreated.getTime() + int(rng, 2, 4) * DAY_MS);
          const actual =
            shipStatus === 'delivered'
              ? new Date(Math.min(estimated.getTime() + int(rng, 0, 20) * 3600000, NOW.getTime() - 1800000))
              : null;

          const shipItems = items.slice(0, int(rng, 1, Math.min(2, items.length))).map((it) => ({
            product_id: it.product_id,
            quantity: it.quantity,
          }));

          shipments.push({
            shipment_id: `SHP-${day.replace(/-/g, '')}-${pad(k + 1, 3)}`,
            order_id: orderId,
            from_location: from,
            to_location: to,
            status: shipStatus,
            carrier: `transporter_${pad(int(rng, 1, 8), 3)}`,
            tracking_number: `TRK${day.replace(/-/g, '')}${pad(k + 1, 3)}`,
            estimated_delivery: estimated,
            actual_delivery: actual,
            created: shipCreated,
            updated: actual || new Date(shipCreated.getTime() + 60 * 60000),
            items: shipItems,
          });
        }
      }
    }

    // Daily inventory movement: shops sell stock (down) + periodic restocks (up)
    const patches = [];
    const patchCount = int(rng, 5, 10);
    for (let p = 0; p < patchCount; p++) {
      const storeId = pick(rng, STORES);
      const sku = pick(rng, SKUS);
      const restock = chance(rng, 0.3);
      patches.push({
        store_id: storeId,
        product_id: sku,
        delta: restock ? int(rng, 10, 60) : -int(rng, 2, 25),
        at: at(day, int(rng, 9, 18), int(rng, 0, 59)),
      });
    }

    plan.push({ day, orders, shipments, patches });
  });

  return plan;
}

// ---------------------------------------------------------------------------
// Phase: roster
// ---------------------------------------------------------------------------
async function seedRoster(client, roster, hash) {
  let created = 0;
  let updated = 0;

  for (const u of roster) {
    const existing = await client.query('SELECT id FROM users WHERE username = $1', [u.username]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO users (username, email, password, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)`,
        [u.username, u.email, hash, u.role, ts(u.signup)]
      );
      created++;
      console.log(`  + ${u.username.padEnd(18)} ${u.role.padEnd(12)} signup ${ts(u.signup)}${u.store_id ? `  store ${u.store_id} (${STORE_TYPE})` : ''}`);
    } else {
      // Re-assert role, password and backdated signup so the roster is exact
      await client.query(
        `UPDATE users SET password = $1, role = $2, created_at = $3, updated_at = $3 WHERE username = $4`,
        [hash, u.role, ts(u.signup), u.username]
      );
      updated++;
      console.log(`  ~ ${u.username.padEnd(18)} ${u.role.padEnd(12)} signup ${ts(u.signup)} (existing row re-dated)`);
    }
  }

  console.log(`roster: ${created} created, ${updated} updated, ${roster.length} total`);
  return { created, updated, total: roster.length };
}

// ---------------------------------------------------------------------------
// Phase: history
// ---------------------------------------------------------------------------
async function seedHistory(client, plan, reset = false) {
  // Idempotency: wipe previous seeded rows when --reset, otherwise refuse to
  // double-fill a month that already has seeded data.
  const existing = await client.query(
    `SELECT count(*)::int AS n FROM orders WHERE order_id LIKE 'ORD-20%'`
  );
  if (existing.rows[0].n > 0) {
    if (!reset) {
      console.log(
        `history: ${existing.rows[0].n} seeded orders already present - nothing to do ` +
          `(use --reset to wipe and regenerate).`
      );
      return { skipped: true, existingOrders: existing.rows[0].n };
    }
    console.log('history: --reset requested, deleting previously seeded rows...');
    await client.query(`DELETE FROM shipments WHERE shipment_id LIKE 'SHP-20%'`);
    await client.query(`DELETE FROM orders WHERE order_id LIKE 'ORD-20%'`);
  }

  // Seed inventory shelves (8 Downtown stores x 5 SKUs), keep existing rows
  console.log('history: ensuring inventory rows for 8 Downtown stores x 5 SKUs...');
  const shelfRng = mulberry32(777);
  for (const store of STORES) {
    for (const sku of SKUS) {
      await client.query(
        `INSERT INTO inventory
           (product_id, store_id, quantity, reserved_quantity, min_stock_level, max_stock_level,
            unit_cost, selling_price, last_updated)
         VALUES ($1, $2, $3, 0, 20, 250, $4, $5, $6)
         ON CONFLICT (product_id, store_id) DO NOTHING`,
        [sku, store, int(shelfRng, 80, 200), 10, 25, ts(at(FROM, 8, 0))]
      );
    }
  }

  let totOrders = 0;
  let totShipments = 0;
  let totItems = 0;

  for (const dayPlan of plan) {
    await client.query('BEGIN');
    try {
      for (const o of dayPlan.orders) {
        await client.query(
          `INSERT INTO orders (order_id, store_id, customer_id, total_amount, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [o.order_id, o.store_id, o.customer_id, o.total_amount, o.status, ts(o.created), ts(o.updated)]
        );
        for (const it of o.items) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [o.order_id, it.product_id, it.quantity, it.unit_price, it.total_price]
          );
          totItems++;
        }
        totOrders++;
      }

      for (const s of dayPlan.shipments) {
        await client.query(
          `INSERT INTO shipments
             (shipment_id, order_id, from_location, to_location, status, carrier, tracking_number,
              estimated_delivery, actual_delivery, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            s.shipment_id, s.order_id, s.from_location, s.to_location, s.status, s.carrier,
            s.tracking_number, ts(s.estimated_delivery), s.actual_delivery ? ts(s.actual_delivery) : null,
            ts(s.created), ts(s.updated),
          ]
        );
        for (const it of s.items) {
          await client.query(
            `INSERT INTO shipment_items (shipment_id, product_id, quantity) VALUES ($1, $2, $3)`,
            [s.shipment_id, it.product_id, it.quantity]
          );
        }
        totShipments++;
      }

      for (const p of dayPlan.patches) {
        await client.query(
          `UPDATE inventory
              SET quantity = GREATEST(0, quantity + $1), last_updated = $2
            WHERE store_id = $3 AND product_id = $4`,
          [p.delta, ts(p.at), p.store_id, p.product_id]
        );
      }

      await client.query('COMMIT');
      console.log(
        `  ${dayPlan.day}  orders ${String(dayPlan.orders.length).padStart(3)}  ` +
          `shipments ${String(dayPlan.shipments.length).padStart(3)}  ` +
          `inventory moves ${dayPlan.patches.length}`
      );
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`${dayPlan.day}: ${err.message}`);
    }
  }

  console.log(`history: ${totOrders} orders, ${totShipments} shipments, ${totItems} order items`);
  return { orders: totOrders, shipments: totShipments, items: totItems };
}

// ---------------------------------------------------------------------------
// Phase: verify
// ---------------------------------------------------------------------------
async function verify(client) {
  console.log('\n=== Users by role ===');
  const roles = await client.query(
    `SELECT role, count(*)::int AS n, min(created_at)::text AS first_signup, max(created_at)::text AS last_signup
       FROM users GROUP BY role ORDER BY role`
  );
  roles.rows.forEach((r) =>
    console.log(
      `  ${r.role.padEnd(12)} ${String(r.n).padStart(3)} users   ${r.first_signup} .. ${r.last_signup}`
    )
  );

  console.log('\n=== Daily activity (orders / shipments / users) ===');
  const daily = await client.query(
    `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
            coalesce(o.n, 0)  AS orders,
            coalesce(s.n, 0)  AS shipments,
            coalesce(u.n, 0)  AS new_users
       FROM generate_series($1::date, $2::date, interval '1 day') AS d(day)
       LEFT JOIN (SELECT created_at::date AS day, count(*)::int AS n FROM orders
                   WHERE created_at::date BETWEEN $1::date AND $2::date GROUP BY 1) o ON o.day = d.day
       LEFT JOIN (SELECT created_at::date AS day, count(*)::int AS n FROM shipments
                   WHERE created_at::date BETWEEN $1::date AND $2::date GROUP BY 1) s ON s.day = d.day
       LEFT JOIN (SELECT created_at::date AS day, count(*)::int AS n FROM users
                   WHERE created_at::date BETWEEN $1::date AND $2::date GROUP BY 1) u ON u.day = d.day
      ORDER BY d.day`,
    [FROM, TO]
  );
  console.log('  date        orders  shipments  new_users');
  let [to, ts2, tu] = [0, 0, 0];
  daily.rows.forEach((r) => {
    console.log(
      `  ${r.day}   ${String(r.orders).padStart(4)}    ${String(r.shipments).padStart(6)}     ${String(r.new_users).padStart(6)}`
    );
    to += r.orders; ts2 += r.shipments; tu += r.new_users;
  });
  console.log(`  TOTAL      ${String(to).padStart(4)}    ${String(ts2).padStart(6)}     ${String(tu).padStart(6)}`);

  console.log('\n=== Orders per shop (all Downtown type) ===');
  const stores = await client.query(
    `SELECT store_id, count(*)::int AS n, round(sum(total_amount)::numeric)::int AS revenue
       FROM orders WHERE created_at::date BETWEEN $1::date AND $2::date
      GROUP BY store_id ORDER BY store_id`,
    [FROM, TO]
  );
  stores.rows.forEach((r) =>
    console.log(`  ${r.store_id}  (${STORE_TYPE})  orders ${String(r.n).padStart(4)}  revenue ${r.revenue}`)
  );

  const extras = await client.query(
    `SELECT username, role FROM users
      WHERE email LIKE '%@cscm-sim.local'
        AND username !~ '^(admin_00[12]|shopkeeper_00[1-8]|transporter_00[1-8]|wholesaler_00[1-5])$'
      ORDER BY username`
  );
  if (extras.rows.length) {
    console.log('\n=== Sim users outside the roster (leftovers from earlier runs) ===');
    extras.rows.forEach((r) => console.log(`  ${r.username} (${r.role})`));
  }

  return { roles: roles.rows, daily: daily.rows, stores: stores.rows };
}

// ---------------------------------------------------------------------------
// Dry run: print the plan without a database
// ---------------------------------------------------------------------------
function dryRun(roster, plan) {
  console.log('\n=== ROSTER PLAN (23 users, all shops are Downtown) ===');
  roster.forEach((u) =>
    console.log(
      `  ${u.username.padEnd(18)} ${u.role.padEnd(12)} ${ts(u.signup)}` +
        (u.store_id ? `  store ${u.store_id} [${u.store_type}]` : '')
    )
  );

  console.log('\n=== HISTORY PLAN (per day) ===');
  console.log('  date        orders  shipments  inventory_moves  sample');
  let [to, tsh] = [0, 0];
  plan.forEach((d) => {
    to += d.orders.length;
    tsh += d.shipments.length;
    const sample = d.orders[0] ? `${d.orders[0].order_id} ${d.orders[0].status} ${d.orders[0].store_id}` : '-';
    console.log(
      `  ${d.day}   ${String(d.orders.length).padStart(4)}    ${String(d.shipments.length).padStart(6)}       ${String(d.patches.length).padStart(3)}          ${sample}`
    );
  });
  console.log(`  TOTAL      ${String(to).padStart(4)}    ${String(tsh).padStart(6)}`);

  const first = plan[0];
  if (first && first.orders[0]) {
    console.log('\n=== SAMPLE ORDER (day 1) ===');
    console.log(JSON.stringify({ ...first.orders[0], created: ts(first.orders[0].created), updated: ts(first.orders[0].updated) }, null, 2));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function runSeed(options = {}) {
  const phase = options.phase || PHASE;
  const isDryRun = options.dryRun !== undefined ? !!options.dryRun : DRY_RUN;
  const reset = options.reset !== undefined ? !!options.reset : RESET;
  const databaseUrl = options.databaseUrl || DATABASE_URL;
  const injected = options.client || null;
  const summary = { phase, window: `${FROM}..${TO}` };

  console.log(`CSCM seed-history  phase=${phase}${isDryRun ? '  [DRY RUN]' : ''}  window=${FROM}..${TO}`);

  const roster = buildRoster();
  const plan = phase === 'roster' ? [] : buildHistoryPlan();

  if (isDryRun) {
    if (phase === 'history') {
      // still show history plan only
      console.log('\n=== HISTORY PLAN (per day) ===');
      plan.forEach((d) => console.log(`  ${d.day}  orders ${d.orders.length}  shipments ${d.shipments.length}`));
    } else {
      dryRun(roster, plan);
    }
    return summary;
  }

  if (!injected && !databaseUrl) {
    throw new Error('DATABASE_URL is required (Render Postgres EXTERNAL connection string).');
  }

  const client =
    injected ||
    new Client({
      connectionString: databaseUrl,
      ssl: /localhost|127\.0\.0\.1/.test(databaseUrl) ? false : { rejectUnauthorized: false },
    });
  if (!injected) await client.connect();

  try {
    if (phase === 'roster' || phase === 'all') {
      console.log('\n=== PHASE: roster ===');
      const hash = bcrypt.hashSync(PASSWORD, 10);
      summary.roster = await seedRoster(client, roster, hash);
    }
    if (phase === 'history' || phase === 'all') {
      console.log('\n=== PHASE: history (Sep 1 - Sep 30) ===');
      summary.history = await seedHistory(client, plan, reset);
    }
    if (phase === 'verify' || phase === 'all') {
      summary.verify = await verify(client);
    }
    console.log('\nDone.');
    return summary;
  } finally {
    if (!injected) await client.end();
  }
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('SEED FAILED:', err.message);
    process.exit(1);
  });
}

module.exports = { runSeed, buildRoster, buildHistoryPlan };
