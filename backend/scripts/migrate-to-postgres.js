/**
 * Migration Script: SQLite to PostgreSQL
 *
 * This script is used to initialize the PostgreSQL database for Render deployment.
 * It creates the schema and seeds initial test data.
 *
 * Usage: node scripts/migrate-to-postgres.js
 *
 * Environment Variables:
 * - DATABASE_URL: PostgreSQL connection string (provided by Render)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  debug: (msg) => console.log(`[DEBUG] ${msg}`)
};

async function migrateToPostgres() {
  logger.info('Starting PostgreSQL migration...');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.error('DATABASE_URL environment variable is not set');
    logger.error('This script requires DATABASE_URL to be set (provided by Render)');
    process.exit(1);
  }

  // Create connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
  });

  try {
    // Test connection
    logger.info('Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../schema/postgres-schema.sql');
    logger.info(`Reading schema from: ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
      logger.error('Schema file not found');
      process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    logger.info('Executing schema...');

    // Split schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await pool.query(statement);
        logger.debug(`Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        // Ignore errors for IF NOT EXISTS statements
        if (!error.message.includes('already exists')) {
          logger.warn(`Statement warning: ${error.message}`);
        }
      }
    }

    logger.info('Schema created successfully');

    // Seed initial test data
    logger.info('Seeding initial test data...');
    await seedTestData(pool);
    logger.info('Test data seeded successfully');

    logger.info('Migration completed successfully');
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function seedTestData(pool) {
  // Seed sample inventory data
  const inventoryData = [
    { product_id: 'PROD001', store_id: 'STORE001', quantity: 100, unit_cost: 10.50, selling_price: 15.00 },
    { product_id: 'PROD002', store_id: 'STORE001', quantity: 50, unit_cost: 20.00, selling_price: 30.00 },
    { product_id: 'PROD003', store_id: 'STORE001', quantity: 75, unit_cost: 15.00, selling_price: 22.50 },
    { product_id: 'PROD001', store_id: 'STORE002', quantity: 80, unit_cost: 10.50, selling_price: 15.00 },
    { product_id: 'PROD002', store_id: 'STORE002', quantity: 60, unit_cost: 20.00, selling_price: 30.00 },
  ];

  for (const item of inventoryData) {
    try {
      await pool.query(
        `INSERT INTO inventory (product_id, store_id, quantity, unit_cost, selling_price)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (product_id, store_id) DO NOTHING`,
        [item.product_id, item.store_id, item.quantity, item.unit_cost, item.selling_price]
      );
      logger.debug(`Seeded inventory: ${item.product_id} at ${item.store_id}`);
    } catch (error) {
      logger.warn(`Failed to seed inventory ${item.product_id}: ${error.message}`);
    }
  }

  // Seed sample orders
  const orderData = [
    { order_id: 'ORD001', store_id: 'STORE001', total_amount: 45.00, status: 'pending' },
    { order_id: 'ORD002', store_id: 'STORE001', total_amount: 60.00, status: 'processing' },
    { order_id: 'ORD003', store_id: 'STORE002', total_amount: 30.00, status: 'shipped' },
  ];

  for (const order of orderData) {
    try {
      await pool.query(
        `INSERT INTO orders (order_id, store_id, total_amount, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (order_id) DO NOTHING`,
        [order.order_id, order.store_id, order.total_amount, order.status]
      );
      logger.debug(`Seeded order: ${order.order_id}`);
    } catch (error) {
      logger.warn(`Failed to seed order ${order.order_id}: ${error.message}`);
    }
  }

  // Seed sample shipments
  const shipmentData = [
    { shipment_id: 'SHIP001', order_id: 'ORD001', from_location: 'WAREHOUSE_A', to_location: 'STORE001', status: 'pending' },
    { shipment_id: 'SHIP002', order_id: 'ORD003', from_location: 'WAREHOUSE_B', to_location: 'STORE002', status: 'in_transit' },
  ];

  for (const shipment of shipmentData) {
    try {
      await pool.query(
        `INSERT INTO shipments (shipment_id, order_id, from_location, to_location, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (shipment_id) DO NOTHING`,
        [shipment.shipment_id, shipment.order_id, shipment.from_location, shipment.to_location, shipment.status]
      );
      logger.debug(`Seeded shipment: ${shipment.shipment_id}`);
    } catch (error) {
      logger.warn(`Failed to seed shipment ${shipment.shipment_id}: ${error.message}`);
    }
  }

  // Seed sample users
  const userData = [
    { username: 'shopkeeper1', email: 'shopkeeper1@cscm.example.com', password: 'hashed_password_here', role: 'shopkeeper' },
    { username: 'transporter1', email: 'transporter1@cscm.example.com', password: 'hashed_password_here', role: 'transporter' },
    { username: 'wholesaler1', email: 'wholesaler1@cscm.example.com', password: 'hashed_password_here', role: 'wholesaler' },
    { username: 'admin', email: 'admin@cscm.example.com', password: 'hashed_password_here', role: 'admin' },
  ];

  for (const user of userData) {
    try {
      await pool.query(
        `INSERT INTO users (username, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO NOTHING`,
        [user.username, user.email, user.password, user.role]
      );
      logger.debug(`Seeded user: ${user.username}`);
    } catch (error) {
      logger.warn(`Failed to seed user ${user.username}: ${error.message}`);
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToPostgres()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToPostgres };
