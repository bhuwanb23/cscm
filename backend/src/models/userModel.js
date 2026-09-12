const { getDatabase } = require('../storage/database');
const logger = require('../utils/logger');

class UserModel {
  static async create(userData) {
    if (!userData.username || !userData.email || !userData.password) {
      throw new Error('Username, email, and password are required');
    }
    const db = getDatabase();
    
    // Ensure database is initialized
    if (!db.pool && !db.db) {
      logger.warn('Database not initialized, attempting to initialize...');
      try {
        await db.initialize();
      } catch (error) {
        logger.error('Failed to initialize database in UserModel:', error);
        throw new Error('Database initialization failed: ' + error.message);
      }
    }
    
    const id = await db.createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
    });
    return { id, ...userData };
  }

  static async findByUsername(username) {
    if (!username) throw new Error('Username is required');
    const db = getDatabase();
    
    // Ensure database is initialized
    if (!db.pool && !db.db) {
      logger.warn('Database not initialized, attempting to initialize...');
      try {
        await db.initialize();
      } catch (error) {
        logger.error('Failed to initialize database in UserModel:', error);
        throw new Error('Database initialization failed: ' + error.message);
      }
    }
    
    return db.findUserByUsername(username);
  }

  static async findById(id) {
    if (!id) throw new Error('User ID is required');
    const db = getDatabase();
    
    // Ensure database is initialized
    if (!db.pool && !db.db) {
      logger.warn('Database not initialized, attempting to initialize...');
      try {
        await db.initialize();
      } catch (error) {
        logger.error('Failed to initialize database in UserModel:', error);
        throw new Error('Database initialization failed: ' + error.message);
      }
    }
    
    return db.findUserById(id);
  }
}

module.exports = UserModel;
