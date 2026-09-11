const { Pool } = require('pg');
const logger = require('../utils/logger');

/**
 * PostgreSQL Database
 *
 * This module provides a PostgreSQL database implementation for production data storage.
 * It handles connection management, table creation, and data access.
 * It implements the same interface as SQLiteDatabase for easy switching.
 */

class PostgreSQLDatabase {
  constructor() {
    this.pool = null;
    this.dbUrl = process.env.DATABASE_URL;
  }

  /**
   * Initialize the database
   */
  async initialize() {
    try {
      if (!this.dbUrl) {
        throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
      }

      // Create connection pool
      this.pool = new Pool({
        connectionString: this.dbUrl,
        max: 20, // Maximum pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      logger.info('PostgreSQL connection pool created successfully');

      // Create tables
      await this.createTables();

      // Create indexes for performance
      await this.createIndexes();

      logger.info('PostgreSQL database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL database:', error.message);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    const client = await this.pool.connect();
    try {
      // Create inventory table
      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
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
        )
      `);

      // Create orders table
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          order_id TEXT NOT NULL UNIQUE,
          store_id TEXT NOT NULL,
          customer_id TEXT,
          total_amount REAL NOT NULL DEFAULT 0.0,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create order_items table
      await client.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price REAL NOT NULL DEFAULT 0.0,
          total_price REAL NOT NULL DEFAULT 0.0,
          FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
        )
      `);

      // Create shipments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS shipments (
          id SERIAL PRIMARY KEY,
          shipment_id TEXT NOT NULL UNIQUE,
          order_id TEXT,
          from_location TEXT NOT NULL,
          to_location TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          carrier TEXT,
          tracking_number TEXT,
          estimated_delivery TIMESTAMP,
          actual_delivery TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create shipment_items table
      await client.query(`
        CREATE TABLE IF NOT EXISTS shipment_items (
          id SERIAL PRIMARY KEY,
          shipment_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id) ON DELETE CASCADE
        )
      `);

      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      logger.info('PostgreSQL tables created successfully');
    } finally {
      client.release();
    }
  }

  /**
   * Create database indexes for performance optimization
   */
  async createIndexes() {
    const client = await this.pool.connect();
    try {
      // Inventory indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON inventory(store_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_store_product ON inventory(store_id, product_id)');

      // Orders indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store_id, status)');

      // Order items indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)');

      // Shipments indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_shipments_shipment_id ON shipments(shipment_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_shipments_from_location ON shipments(from_location)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_shipments_to_location ON shipments(to_location)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number)');

      // Users indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

      logger.info('PostgreSQL indexes created successfully');
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('PostgreSQL connection pool closed successfully');
    }
  }

  /**
   * Insert or update inventory item
   * @param {Object} item - Inventory item data
   */
  async upsertInventory(item) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO inventory (
          product_id, store_id, quantity, reserved_quantity,
          min_stock_level, max_stock_level, unit_cost, selling_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (product_id, store_id) DO UPDATE SET
          quantity = EXCLUDED.quantity,
          reserved_quantity = EXCLUDED.reserved_quantity,
          min_stock_level = EXCLUDED.min_stock_level,
          max_stock_level = EXCLUDED.max_stock_level,
          unit_cost = EXCLUDED.unit_cost,
          selling_price = EXCLUDED.selling_price,
          last_updated = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const params = [
        item.product_id,
        item.store_id,
        item.quantity || 0,
        item.reserved_quantity || 0,
        item.min_stock_level || 0,
        item.max_stock_level || 0,
        item.unit_cost || 0.0,
        item.selling_price || 0.0,
      ];

      const result = await client.query(query, params);
      logger.debug(`Inventory item upserted with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Get inventory items for a store
   * @param {string} storeId - Store ID
   */
  async getInventoryByStore(storeId) {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM inventory WHERE store_id = $1 ORDER BY product_id';
      const result = await client.query(query, [storeId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Create order
   * @param {Object} order - Order data
   */
  async createOrder(order) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO orders (order_id, store_id, customer_id, total_amount, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const params = [
        order.order_id,
        order.store_id,
        order.customer_id,
        order.total_amount || 0.0,
        order.status || 'pending',
      ];

      const result = await client.query(query, params);
      logger.debug(`Order created with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Add order item
   * @param {Object} item - Order item data
   */
  async addOrderItem(item) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const params = [
        item.order_id,
        item.product_id,
        item.quantity || 1,
        item.unit_price || 0.0,
        item.total_price || 0.0,
      ];

      const result = await client.query(query, params);
      logger.debug(`Order item added with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Create shipment
   * @param {Object} shipment - Shipment data
   */
  async createShipment(shipment) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO shipments (
          shipment_id, order_id, from_location, to_location,
          status, carrier, tracking_number, estimated_delivery
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const params = [
        shipment.shipment_id,
        shipment.order_id,
        shipment.from_location,
        shipment.to_location,
        shipment.status || 'pending',
        shipment.carrier,
        shipment.tracking_number,
        shipment.estimated_delivery,
      ];

      const result = await client.query(query, params);
      logger.debug(`Shipment created with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Add shipment item
   * @param {Object} item - Shipment item data
   */
  async addShipmentItem(item) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO shipment_items (shipment_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      const params = [item.shipment_id, item.product_id, item.quantity || 1];

      const result = await client.query(query, params);
      logger.debug(`Shipment item added with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Get shipments by status
   * @param {string} status - Shipment status
   */
  async getShipmentsByStatus(status) {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM shipments WHERE status = $1 ORDER BY created_at DESC';
      const result = await client.query(query, [status]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Update shipment status
   * @param {string} shipmentId - Shipment ID
   * @param {string} status - New status
   * @param {Object} additionalFields - Additional fields to update
   */
  async updateShipmentStatus(shipmentId, status, additionalFields = {}) {
    const client = await this.pool.connect();
    try {
      let query = 'UPDATE shipments SET status = $1, updated_at = CURRENT_TIMESTAMP';
      const params = [status];
      let paramIndex = 2;

      // Add additional fields to update
      if (additionalFields.actual_delivery) {
        query += `, actual_delivery = $${paramIndex}`;
        params.push(additionalFields.actual_delivery);
        paramIndex++;
      }

      query += ` WHERE shipment_id = $${paramIndex}`;
      params.push(shipmentId);

      const result = await client.query(query, params);
      logger.debug(`Shipment status updated for ID: ${shipmentId}`);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  /**
   * Get an order by ID with its items
   * @param {string} orderId
   * @returns {Promise<Object|null>}
   */
  async getOrderById(orderId) {
    const client = await this.pool.connect();
    try {
      const orderResult = await client.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
      if (orderResult.rows.length === 0) {
        return null;
      }

      const order = orderResult.rows[0];
      const itemsResult = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
      order.items = itemsResult.rows;

      return order;
    } finally {
      client.release();
    }
  }

  /**
   * Update an order's status
   * @param {string} orderId
   * @param {string} status
   * @returns {Promise<number>} number of rows changed
   */
  async updateOrderStatus(orderId, status) {
    const client = await this.pool.connect();
    try {
      const query = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2';
      const result = await client.query(query, [status, orderId]);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  /**
   * Get orders by store (optionally filtered by status)
   * @param {string} storeId
   * @param {string|null} status
   * @returns {Promise<Array>}
   */
  async getOrdersByStore(storeId, status = null) {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM orders WHERE store_id = $1';
      const params = [storeId];

      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get a shipment by ID with its items
   * @param {string} shipmentId
   * @returns {Promise<Object|null>}
   */
  async getShipmentById(shipmentId) {
    const client = await this.pool.connect();
    try {
      const shipmentResult = await client.query('SELECT * FROM shipments WHERE shipment_id = $1', [shipmentId]);
      if (shipmentResult.rows.length === 0) {
        return null;
      }

      const shipment = shipmentResult.rows[0];
      const itemsResult = await client.query('SELECT * FROM shipment_items WHERE shipment_id = $1', [shipmentId]);
      shipment.items = itemsResult.rows;

      return shipment;
    } finally {
      client.release();
    }
  }

  /**
   * Get shipments by location (from or to)
   * @param {string} location
   * @returns {Promise<Array>}
   */
  async getShipmentsByLocation(location) {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM shipments WHERE from_location = $1 OR to_location = $2 ORDER BY created_at DESC';
      const result = await client.query(query, [location, location]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new user
   * @param {Object} user - User data { username, email, password, role }
   * @returns {Promise<number>} The new user's ID
   */
  async createUser(user) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const params = [user.username, user.email, user.password, user.role || 'user'];
      const result = await client.query(query, params);
      logger.debug(`User created with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Find a user by username
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  async findUserByUsername(username) {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await client.query(query, [username]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * Find a user by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findUserById(id) {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }
}

module.exports = PostgreSQLDatabase;
