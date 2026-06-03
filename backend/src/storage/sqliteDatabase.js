const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

/**
 * SQLite Database
 * 
 * This module provides a SQLite database implementation for local data storage.
 * It handles connection management, table creation, and data access.
 */

class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '..', '..', 'data', 'cscm_local.db');
  }

  /**
   * Initialize the database
   */
  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      const fs = require('fs');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Open database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Failed to open SQLite database:', err.message);
          throw err;
        }
      });

      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');

      // Create tables
      await this.createTables();
      
      logger.info('SQLite database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SQLite database:', error.message);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      // Create inventory table
      const inventoryTable = `
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
        )
      `;

      // Create orders table
      const ordersTable = `
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL UNIQUE,
          store_id TEXT NOT NULL,
          customer_id TEXT,
          total_amount REAL NOT NULL DEFAULT 0.0,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create order_items table
      const orderItemsTable = `
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price REAL NOT NULL DEFAULT 0.0,
          total_price REAL NOT NULL DEFAULT 0.0,
          FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
        )
      `;

      // Create shipments table
      const shipmentsTable = `
        CREATE TABLE IF NOT EXISTS shipments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      `;

      // Create shipment_items table
      const shipmentItemsTable = `
        CREATE TABLE IF NOT EXISTS shipment_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shipment_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id) ON DELETE CASCADE
        )
      `;

      // Create users table
      const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Execute all table creation queries
      const queries = [
        inventoryTable,
        ordersTable,
        orderItemsTable,
        shipmentsTable,
        shipmentItemsTable,
        usersTable
      ];

      let completed = 0;
      const checkCompletion = () => {
        completed++;
        if (completed === queries.length) {
          logger.info('Database tables created successfully');
          resolve();
        }
      };

      queries.forEach(query => {
        this.db.run(query, (err) => {
          if (err) {
            logger.error('Failed to create table:', err.message);
            reject(err);
          } else {
            checkCompletion();
          }
        });
      });
    });
  }

  /**
   * Close database connection
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Failed to close database:', err.message);
            reject(err);
          } else {
            logger.info('Database closed successfully');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Insert or update inventory item
   * @param {Object} item - Inventory item data
   */
  async upsertInventory(item) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO inventory (
          product_id, store_id, quantity, reserved_quantity, 
          min_stock_level, max_stock_level, unit_cost, selling_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(product_id, store_id) DO UPDATE SET
          quantity = excluded.quantity,
          reserved_quantity = excluded.reserved_quantity,
          min_stock_level = excluded.min_stock_level,
          max_stock_level = excluded.max_stock_level,
          unit_cost = excluded.unit_cost,
          selling_price = excluded.selling_price,
          last_updated = CURRENT_TIMESTAMP
      `;

      const params = [
        item.product_id,
        item.store_id,
        item.quantity || 0,
        item.reserved_quantity || 0,
        item.min_stock_level || 0,
        item.max_stock_level || 0,
        item.unit_cost || 0.0,
        item.selling_price || 0.0
      ];

      this.db.run(query, params, function(err) {
        if (err) {
          logger.error('Failed to upsert inventory item:', err.message);
          reject(err);
        } else {
          logger.debug(`Inventory item upserted with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Get inventory items for a store
   * @param {string} storeId - Store ID
   */
  async getInventoryByStore(storeId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM inventory WHERE store_id = ? ORDER BY product_id';
      this.db.all(query, [storeId], (err, rows) => {
        if (err) {
          logger.error('Failed to get inventory by store:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Create order
   * @param {Object} order - Order data
   */
  async createOrder(order) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO orders (order_id, store_id, customer_id, total_amount, status)
        VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        order.order_id,
        order.store_id,
        order.customer_id,
        order.total_amount || 0.0,
        order.status || 'pending'
      ];

      this.db.run(query, params, function(err) {
        if (err) {
          logger.error('Failed to create order:', err.message);
          reject(err);
        } else {
          logger.debug(`Order created with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Add order item
   * @param {Object} item - Order item data
   */
  async addOrderItem(item) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        item.order_id,
        item.product_id,
        item.quantity || 1,
        item.unit_price || 0.0,
        item.total_price || 0.0
      ];

      this.db.run(query, params, function(err) {
        if (err) {
          logger.error('Failed to add order item:', err.message);
          reject(err);
        } else {
          logger.debug(`Order item added with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Create shipment
   * @param {Object} shipment - Shipment data
   */
  async createShipment(shipment) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO shipments (
          shipment_id, order_id, from_location, to_location, 
          status, carrier, tracking_number, estimated_delivery
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        shipment.shipment_id,
        shipment.order_id,
        shipment.from_location,
        shipment.to_location,
        shipment.status || 'pending',
        shipment.carrier,
        shipment.tracking_number,
        shipment.estimated_delivery
      ];

      this.db.run(query, params, function(err) {
        if (err) {
          logger.error('Failed to create shipment:', err.message);
          reject(err);
        } else {
          logger.debug(`Shipment created with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Add shipment item
   * @param {Object} item - Shipment item data
   */
  async addShipmentItem(item) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO shipment_items (shipment_id, product_id, quantity)
        VALUES (?, ?, ?)
      `;

      const params = [
        item.shipment_id,
        item.product_id,
        item.quantity || 1
      ];

      this.db.run(query, params, function(err) {
        if (err) {
          logger.error('Failed to add shipment item:', err.message);
          reject(err);
        } else {
          logger.debug(`Shipment item added with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Get shipments by status
   * @param {string} status - Shipment status
   */
  async getShipmentsByStatus(status) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM shipments WHERE status = ? ORDER BY created_at DESC';
      this.db.all(query, [status], (err, rows) => {
        if (err) {
          logger.error('Failed to get shipments by status:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Update shipment status
   * @param {string} shipmentId - Shipment ID
   * @param {string} status - New status
   * @param {Object} additionalFields - Additional fields to update
   */
  async updateShipmentStatus(shipmentId, status, additionalFields = {}) {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP';
      const params = [status];

      // Add additional fields to update
      if (additionalFields.actual_delivery) {
        query += ', actual_delivery = ?';
        params.push(additionalFields.actual_delivery);
      }

      query += ' WHERE shipment_id = ?';
      params.push(shipmentId);

      this.db.run(query, params, function(err) {
        if (err) {
          logger.error('Failed to update shipment status:', err.message);
          reject(err);
        } else {
          logger.debug(`Shipment status updated for ID: ${shipmentId}`);
          resolve(this.changes);
        }
      });
    });
  }
  // ──────────────────────────────────────────────
  // User operations
  // ──────────────────────────────────────────────

  /**
   * Create a new user
   * @param {Object} user - User data { username, email, password, role }
   * @returns {Promise<number>} The new user's ID
   */
  async createUser(user) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (username, email, password, role)
        VALUES (?, ?, ?, ?)
      `;
      const params = [user.username, user.email, user.password, user.role || 'user'];
      this.db.run(query, params, function(err) {
        if (err) {
          logger.error('Failed to create user:', err.message);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Find a user by username
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  async findUserByUsername(username) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE username = ?';
      this.db.get(query, [username], (err, row) => {
        if (err) {
          logger.error('Failed to find user by username:', err.message);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Find a user by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findUserById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      this.db.get(query, [id], (err, row) => {
        if (err) {
          logger.error('Failed to find user by ID:', err.message);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }
}

// Export singleton instance
module.exports = new SQLiteDatabase();