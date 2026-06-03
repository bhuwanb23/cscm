// Configuration settings for CSCM Backend
require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },

  // Database configuration
  database: {
    // The project uses SQLite via src/storage/sqliteDatabase.js.
    // DATABASE_URI is reserved for future MongoDB integration.
    uri: process.env.DATABASE_URI || ''
  },

  // Kafka configuration
  kafka: {
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',').filter(broker => broker.trim() !== '') : [],
    clientId: process.env.KAFKA_CLIENT_ID || 'cscm-backend'
  },

  // MQTT configuration
  mqtt: {
    url: process.env.MQTT_URL || ''
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'cscm-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // Security
  security: {
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100 // limit each IP to 100 requests per windowMs
  }
};

module.exports = config;