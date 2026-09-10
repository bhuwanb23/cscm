/**
 * Cache Configuration
 * Redis cache configuration for the CSCM backend
 */

module.exports = {
  // Time to live (TTL) values in seconds
  defaultTTL: 300,        // 5 minutes
  inventoryTTL: 600,     // 10 minutes
  userProfileTTL: 1800,   // 30 minutes
  demandForecastTTL: 900, // 15 minutes
  aiMlResponseTTL: 300,   // 5 minutes
  orderTTL: 300,          // 5 minutes
  shipmentTTL: 600,        // 10 minutes
  
  // Cache enabled flag
  enabled: true,
  
  // Redis connection settings
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    url: process.env.REDIS_URL || null,
    reconnectDelay: 100,
    maxRetries: 10
  },
  
  // Cache warming settings
  warmOnStartup: true,
  warmInterval: 300000, // 5 minutes
  
  // Cache statistics
  stats: {
    enabled: true,
    resetInterval: 3600000 // 1 hour
  }
};