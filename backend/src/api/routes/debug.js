const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../storage/database');
const logger = require('../../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Middleware to check if debug mode is enabled
 * Debug routes are only accessible in development or if DEBUG=true.
 * SECURITY: they also always require an authenticated admin — DEBUG=true
 * alone must never expose database internals to unauthenticated callers.
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

/**
 * Debug endpoint to test database connection and operations
 * This should be removed in production
 */
router.get('/database/test', requireDebugMode, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Check if database is initialized
    const isInitialized = db.pool !== null || db.db !== null;
    
    const result = {
      success: true,
      databaseType: process.env.DATABASE_TYPE || 'sqlite',
      isInitialized,
      hasPool: !!db.pool,
      hasDb: !!db.db,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    };
    
    // Try to test connection
    if (isInitialized) {
      try {
        if (db.pool) {
          const client = await db.pool.connect();
          await client.query('SELECT NOW()');
          client.release();
          result.connectionTest = 'SUCCESS';
        } else if (db.db) {
          // SQLite test
          await db.db.get('SELECT 1');
          result.connectionTest = 'SUCCESS';
        }
      } catch (error) {
        result.connectionTest = 'FAILED';
        result.connectionError = error.message;
      }
    }
    
    // Try to check if users table exists
    try {
      if (db.pool) {
        const client = await db.pool.connect();
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'users'
          )
        `);
        client.release();
        result.usersTableExists = tableCheck.rows[0].exists;
      } else if (db.db) {
        const tableCheck = await db.db.get(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='users'
        `);
        result.usersTableExists = !!tableCheck;
      }
    } catch (error) {
      result.usersTableCheckError = error.message;
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Debug database test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Debug endpoint to test user creation directly
 */
router.post('/database/create-user', requireDebugMode, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    
    const db = getDatabase();
    
    // Ensure database is initialized
    if (!db.pool && !db.db) {
      logger.warn('Database not initialized, attempting to initialize...');
      await db.initialize();
    }
    
    const id = await db.createUser({
      username,
      email,
      password,
      role: role || 'user'
    });
    
    res.json({
      success: true,
      message: 'User created successfully',
      userId: id
    });
  } catch (error) {
    logger.error('Debug create user failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
