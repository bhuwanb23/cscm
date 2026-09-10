const redis = require('redis');
const logger = require('../utils/logger');

/**
 * Cache Service
 * Redis-based caching service for frequently accessed data
 */

// Redis client instance
let redisClient = null;

// Cache configuration
const cacheConfig = {
  defaultTTL: 300, // 5 minutes in seconds
  inventoryTTL: 600, // 10 minutes
  userProfileTTL: 1800, // 30 minutes
  demandForecastTTL: 900, // 15 minutes
  aiMlResponseTTL: 300, // 5 minutes
  enabled: true
};

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0
};

/**
 * Initialize Redis client for caching
 */
async function initCache() {
  try {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 retries');
            return new Error('Redis reconnection failed');
          }
          return retries * 100; // Exponential backoff
        }
      }
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis cache client error:', err);
      cacheStats.errors++;
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis cache client connected');
    });
    
    redisClient.on('disconnect', () => {
      logger.warn('Redis cache client disconnected');
    });
    
    await redisClient.connect();
    logger.info('Redis cache service initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Redis cache service:', error);
    cacheConfig.enabled = false;
    return false;
  }
}

/**
 * Generate cache key
 * @param {string} prefix - Key prefix
 * @param {string} identifier - Unique identifier
 * @returns {string} Cache key
 */
function generateCacheKey(prefix, identifier) {
  return `cache:${prefix}:${identifier}`;
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
async function get(key) {
  if (!cacheConfig.enabled || !redisClient) {
    cacheStats.misses++;
    return null;
  }
  
  try {
    const value = await redisClient.get(key);
    if (value) {
      cacheStats.hits++;
      return JSON.parse(value);
    }
    cacheStats.misses++;
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    cacheStats.errors++;
    cacheStats.misses++;
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
async function set(key, value, ttl = cacheConfig.defaultTTL) {
  if (!cacheConfig.enabled || !redisClient) {
    return false;
  }
  
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setEx(key, ttl, serialized);
    cacheStats.sets++;
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function del(key) {
  if (!cacheConfig.enabled || !redisClient) {
    return false;
  }
  
  try {
    await redisClient.del(key);
    cacheStats.deletes++;
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Delete multiple keys by pattern
 * @param {string} pattern - Key pattern
 * @returns {Promise<number>} Number of deleted keys
 */
async function delPattern(pattern) {
  if (!cacheConfig.enabled || !redisClient) {
    return 0;
  }
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      cacheStats.deletes += keys.length;
    }
    return keys.length;
  } catch (error) {
    logger.error('Cache delete pattern error:', error);
    cacheStats.errors++;
    return 0;
  }
}

/**
 * Clear all cache
 * @returns {Promise<boolean>} Success status
 */
async function clear() {
  if (!cacheConfig.enabled || !redisClient) {
    return false;
  }
  
  try {
    await redisClient.flushDb();
    logger.info('Cache cleared');
    return true;
  } catch (error) {
    logger.error('Cache clear error:', error);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Existence status
 */
async function exists(key) {
  if (!cacheConfig.enabled || !redisClient) {
    return false;
  }
  
  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Cache exists error:', error);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Get or set cache value
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch value if not cached
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fetched value
 */
async function getOrSet(key, fetchFn, ttl = cacheConfig.defaultTTL) {
  // Try to get from cache
  const cached = await get(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch value
  try {
    const value = await fetchFn();
    
    // Set in cache
    await set(key, value, ttl);
    
    return value;
  } catch (error) {
    logger.error('Fetch function error in getOrSet:', error);
    throw error;
  }
}

/**
 * Cache inventory data
 * @param {string} storeId - Store ID
 * @param {Array} inventory - Inventory data
 * @returns {Promise<boolean>} Success status
 */
async function cacheInventory(storeId, inventory) {
  const key = generateCacheKey('inventory', storeId);
  return await set(key, inventory, cacheConfig.inventoryTTL);
}

/**
 * Get cached inventory
 * @param {string} storeId - Store ID
 * @returns {Promise<Array|null>} Cached inventory or null
 */
async function getCachedInventory(storeId) {
  const key = generateCacheKey('inventory', storeId);
  return await get(key);
}

/**
 * Invalidate inventory cache
 * @param {string} storeId - Store ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateInventory(storeId) {
  const key = generateCacheKey('inventory', storeId);
  return await del(key);
}

/**
 * Cache user profile
 * @param {string} userId - User ID
 * @param {Object} profile - User profile data
 * @returns {Promise<boolean>} Success status
 */
async function cacheUserProfile(userId, profile) {
  const key = generateCacheKey('user', userId);
  return await set(key, profile, cacheConfig.userProfileTTL);
}

/**
 * Get cached user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Cached profile or null
 */
async function getCachedUserProfile(userId) {
  const key = generateCacheKey('user', userId);
  return await get(key);
}

/**
 * Invalidate user profile cache
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateUserProfile(userId) {
  const key = generateCacheKey('user', userId);
  return await del(key);
}

/**
 * Cache demand forecast
 * @param {string} skuId - SKU ID
 * @param {string} storeId - Store ID
 * @param {Object} forecast - Forecast data
 * @returns {Promise<boolean>} Success status
 */
async function cacheDemandForecast(skuId, storeId, forecast) {
  const key = generateCacheKey('forecast', `${skuId}:${storeId}`);
  return await set(key, forecast, cacheConfig.demandForecastTTL);
}

/**
 * Get cached demand forecast
 * @param {string} skuId - SKU ID
 * @param {string} storeId - Store ID
 * @returns {Promise<Object|null>} Cached forecast or null
 */
async function getCachedDemandForecast(skuId, storeId) {
  const key = generateCacheKey('forecast', `${skuId}:${storeId}`);
  return await get(key);
}

/**
 * Invalidate demand forecast cache
 * @param {string} skuId - SKU ID
 * @param {string} storeId - Store ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateDemandForecast(skuId, storeId) {
  const key = generateCacheKey('forecast', `${skuId}:${storeId}`);
  return await del(key);
}

/**
 * Cache AI/ML response
 * @param {string} endpoint - API endpoint
 * @param {string} requestId - Request identifier
 * @param {Object} response - Response data
 * @returns {Promise<boolean>} Success status
 */
async function cacheAiMlResponse(endpoint, requestId, response) {
  const key = generateCacheKey('aiml', `${endpoint}:${requestId}`);
  return await set(key, response, cacheConfig.aiMlResponseTTL);
}

/**
 * Get cached AI/ML response
 * @param {string} endpoint - API endpoint
 * @param {string} requestId - Request identifier
 * @returns {Promise<Object|null>} Cached response or null
 */
async function getCachedAiMlResponse(endpoint, requestId) {
  const key = generateCacheKey('aiml', `${endpoint}:${requestId}`);
  return await get(key);
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total) * 100 : 0;
  
  return {
    ...cacheStats,
    total,
    hitRate: hitRate.toFixed(2) + '%',
    enabled: cacheConfig.enabled
  };
}

/**
 * Reset cache statistics
 */
function resetCacheStats() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.sets = 0;
  cacheStats.deletes = 0;
  cacheStats.errors = 0;
  logger.info('Cache statistics reset');
}

/**
 * Configure cache settings
 * @param {Object} config - Cache configuration
 */
function configureCache(config) {
  Object.assign(cacheConfig, config);
  logger.info('Cache configuration updated:', cacheConfig);
}

/**
 * Warm cache with initial data
 * @param {Object} initialData - Initial data to cache
 */
async function warmCache(initialData) {
  if (!cacheConfig.enabled) {
    logger.warn('Cache is disabled, skipping cache warming');
    return;
  }
  
  try {
    logger.info('Warming cache with initial data');
    
    // Cache inventory data
    if (initialData.inventory) {
      for (const [storeId, inventory] of Object.entries(initialData.inventory)) {
        await cacheInventory(storeId, inventory);
      }
    }
    
    // Cache user profiles
    if (initialData.users) {
      for (const [userId, profile] of Object.entries(initialData.users)) {
        await cacheUserProfile(userId, profile);
      }
    }
    
    logger.info('Cache warming completed');
  } catch (error) {
    logger.error('Cache warming failed:', error);
  }
}

/**
 * Close cache connection
 */
async function closeCache() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis cache client closed');
    } catch (error) {
      logger.error('Error closing Redis cache client:', error);
    }
  }
}

module.exports = {
  initCache,
  get,
  set,
  del,
  delPattern,
  clear,
  exists,
  getOrSet,
  cacheInventory,
  getCachedInventory,
  invalidateInventory,
  cacheUserProfile,
  getCachedUserProfile,
  invalidateUserProfile,
  cacheDemandForecast,
  getCachedDemandForecast,
  invalidateDemandForecast,
  cacheAiMlResponse,
  getCachedAiMlResponse,
  getCacheStats,
  resetCacheStats,
  configureCache,
  warmCache,
  closeCache,
  cacheConfig
};