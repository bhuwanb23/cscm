/**
 * Migration: Initial Schema
 * Version: 2024-01-01_00-00-00_initial_schema
 * Description: Creates the initial database schema with all tables
 */

exports.name = 'Initial Schema';
exports.up = `
  -- Create inventory table
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    max_stock_level INTEGER NOT NULL DEFAULT 0,
    unit_cost REAL NOT NULL DEFAULT 0.0,
    selling_price REAL NOT NULL DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, store_id)
  );

  -- Create orders table
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL UNIQUE,
    store_id TEXT NOT NULL,
    customer_id TEXT,
    total_amount REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create order_items table
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0.0,
    total_price REAL NOT NULL DEFAULT 0.0,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
  );

  -- Create shipments table
  CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    carrier TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    origin_address TEXT,
    origin_city TEXT,
    origin_state TEXT,
    origin_zip TEXT,
    destination_address TEXT,
    destination_city TEXT,
    destination_state TEXT,
    destination_zip TEXT,
    estimated_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
  );

  -- Create events table
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    data TEXT,
    user_id TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory(store_id);
  CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
  CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
`;

exports.down = `
  -- Drop indexes
  DROP INDEX IF EXISTS idx_events_timestamp;
  DROP INDEX IF EXISTS idx_events_type;
  DROP INDEX IF EXISTS idx_shipments_tracking;
  DROP INDEX IF EXISTS idx_shipments_order;
  DROP INDEX IF EXISTS idx_orders_status;
  DROP INDEX IF EXISTS idx_orders_store;
  DROP INDEX IF EXISTS idx_inventory_store;
  DROP INDEX IF EXISTS idx_inventory_product;

  -- Drop tables
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS shipments;
  DROP TABLE IF EXISTS order_items;
  DROP TABLE IF EXISTS orders;
  DROP TABLE IF EXISTS inventory;
`;
