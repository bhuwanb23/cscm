const SQLiteDatabase = require('./sqliteDatabase');
const PostgreSQLDatabase = require('./postgresqlDatabase');
const logger = require('../utils/logger');

/**
 * Database Factory
 *
 * This module provides a factory to create the appropriate database instance
 * based on the environment configuration.
 *
 * - SQLite: Used for local development (default)
 * - PostgreSQL: Used for production deployment on Render
 */

let databaseInstance = null;

function createDatabase() {
  const databaseType = process.env.DATABASE_TYPE || 'sqlite';

  logger.info(`Creating database instance with type: ${databaseType}`);

  switch (databaseType.toLowerCase()) {
    case 'postgresql':
    case 'postgres':
      logger.info('Using PostgreSQL database for production');
      return new PostgreSQLDatabase();

    case 'sqlite':
    default:
      logger.info('Using SQLite database for local development');
      return new SQLiteDatabase();
  }
}

function getDatabase() {
  if (!databaseInstance) {
    databaseInstance = createDatabase();
  }
  return databaseInstance;
}

module.exports = { createDatabase, getDatabase };
