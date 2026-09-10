const redis = require('redis');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Rate Limit Configuration
 * Defines rate limits for different user tiers
 */
const rateLimitConfig = {
  anonymous: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
  },
  user: {
    windowMs: 900000, // 15 minutes
    maxRequests: 500,
  },
  premium: {
    windowMs: 900000, // 15 minutes
    maxRequests: 2000,
  },
  admin: {
    windowMs: 900000, // 15 minutes
    maxRequests: 5000,
  },
  internal: {
    windowMs: 900000, // 15 minutes
    maxRequests: 10000,
  },
};

/**
 * Redis Client for Rate Limiting
 * Shared Redis client for distributed rate limiting
 */
let redisClient = null;

/**
 * Initialize Redis Client
 * Initializes Redis client for rate limiting
 */
async function initRedisClient() {
  try {
    const redisUrl = config.redis.url || process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 retries');
            return new Error('Redis reconnection failed');
          }
          return retries * 100; // Exponential backoff
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected for rate limiting');
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis client disconnected');
    });

    await redisClient.connect();
    logger.info('Redis client initialized for rate limiting');
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis client for rate limiting:', error);
    // Return null to fall back to in-memory rate limiting
    return null;
  }
}

/**
 * In-Memory Fallback Store
 * Used when Redis is unavailable
 */
const inMemoryStore = new Map();

/**
 * Determine User Tier
 * Determines the rate limit tier based on user role and authentication
 */
function determineUserTier(req) {
  // Check for internal service flag
  if (req.headers['x-internal-service'] === 'true') {
    return 'internal';
  }

  // Check for admin role
  if (req.user && req.user.role === 'admin') {
    return 'admin';
  }

  // Check for premium user
  if (req.user && req.user.role === 'premium') {
    return 'premium';
  }

  // Check for authenticated user
  if (req.user) {
    return 'user';
  }

  // Default to anonymous
  return 'anonymous';
}

/**
 * Generate Rate Limit Key
 * Generates a unique key for rate limiting based on identifier and tier
 */
function generateRateLimitKey(identifier, tier, endpoint = 'global') {
  return `ratelimit:${tier}:${endpoint}:${identifier}`;
}

/**
 * Check Rate Limit (Redis)
 * Checks rate limit using Redis
 */
async function checkRateLimitRedis(identifier, tier, endpoint = 'global') {
  try {
    if (!redisClient) {
      redisClient = await initRedisClient();
    }

    if (!redisClient) {
      // Fall back to in-memory
      return checkRateLimitInMemory(identifier, tier, endpoint);
    }

    const config = rateLimitConfig[tier] || rateLimitConfig.anonymous;
    const key = generateRateLimitKey(identifier, tier, endpoint);
    const windowMs = config.windowMs;
    const maxRequests = config.maxRequests;

    // Use Redis INCR with expiration for sliding window
    const pipeline = redisClient.multi();
    pipeline.incr(key);
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    const currentCount = results[0].value;

    const resetTime = Date.now() + windowMs;

    return {
      success: currentCount <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount),
      reset: resetTime,
      current: currentCount,
    };
  } catch (error) {
    logger.error('Redis rate limit check failed, falling back to in-memory:', error);
    return checkRateLimitInMemory(identifier, tier, endpoint);
  }
}

/**
 * Check Rate Limit (In-Memory)
 * Checks rate limit using in-memory store (fallback)
 */
function checkRateLimitInMemory(identifier, tier, endpoint = 'global') {
  const config = rateLimitConfig[tier] || rateLimitConfig.anonymous;
  const key = generateRateLimitKey(identifier, tier, endpoint);
  const windowMs = config.windowMs;
  const maxRequests = config.maxRequests;
  const now = Date.now();

  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    const newEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    inMemoryStore.set(key, newEntry);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: newEntry.resetTime,
      current: 1,
    };
  }

  // Increment count
  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    success: entry.count <= maxRequests,
    limit: maxRequests,
    remaining: remaining,
    reset: entry.resetTime,
    current: entry.count,
  };
}

/**
 * Advanced Rate Limiter Middleware
 * Express middleware for rate limiting with Redis support
 */
function advancedRateLimiter(options = {}) {
  const {
    keyGenerator = defaultKeyGenerator,
    endpoint = 'global',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req, res, next) => {
    try {
      const tier = determineUserTier(req);
      const identifier = keyGenerator(req);

      const result = await checkRateLimitRedis(identifier, tier, endpoint);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.reset);
      res.setHeader('X-RateLimit-Tier', tier);

      if (!result.success) {
        logger.warn(`Rate limit exceeded for ${identifier} (${tier}) on ${endpoint}`);

        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again after ${new Date(result.reset).toISOString()}`,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          tier: tier,
          limit: result.limit,
        });
      }

      // Track successful/failed requests
      const originalJson = res.json;
      res.json = function (data) {
        const statusCode = res.statusCode;

        if (statusCode >= 200 && statusCode < 400 && !skipSuccessfulRequests) {
          // Success - count it
        } else if (statusCode >= 400 && !skipFailedRequests) {
          // Error - could decrement count
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Allow request through if rate limiter fails
      next();
    }
  };
}

/**
 * Default Key Generator
 * Generates identifier for rate limiting based on request
 */
function defaultKeyGenerator(req) {
  // Try to get user ID from authenticated user
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // Fall back to IP address
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * API Key Rate Limiter
 * Rate limiter specifically for API key authentication
 */
function apiKeyRateLimiter(apiKey) {
  return advancedRateLimiter({
    keyGenerator: () => `apikey:${apiKey}`,
    endpoint: 'api',
  });
}

/**
 * Get Rate Limit Status
 * Returns current rate limit status for a user
 */
async function getRateLimitStatus(identifier, tier = 'anonymous', endpoint = 'global') {
  return await checkRateLimitRedis(identifier, tier, endpoint);
}

/**
 * Reset Rate Limit
 * Resets rate limit for a specific user (admin function)
 */
async function resetRateLimit(identifier, tier = 'anonymous', endpoint = 'global') {
  try {
    if (redisClient) {
      const key = generateRateLimitKey(identifier, tier, endpoint);
      await redisClient.del(key);
      logger.info(`Rate limit reset for ${identifier} (${tier}) on ${endpoint}`);
      return { success: true };
    } else {
      const key = generateRateLimitKey(identifier, tier, endpoint);
      inMemoryStore.delete(key);
      logger.info(`Rate limit reset (in-memory) for ${identifier} (${tier}) on ${endpoint}`);
      return { success: true };
    }
  } catch (error) {
    logger.error('Failed to reset rate limit:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Configure Rate Limits
 * Allows runtime configuration of rate limits
 */
function configureRateLimit(tier, config) {
  if (rateLimitConfig[tier]) {
    Object.assign(rateLimitConfig[tier], config);
    logger.info(`Rate limit configuration updated for ${tier}:`, rateLimitConfig[tier]);
  } else {
    logger.warn(`Unknown rate limit tier: ${tier}`);
  }
}

/**
 * Get Rate Limit Configuration
 * Returns current rate limit configuration
 */
function getRateLimitConfig() {
  return { ...rateLimitConfig };
}

/**
 * Cleanup In-Memory Store
 * Removes expired entries from in-memory store
 */
function cleanupInMemoryStore() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} expired rate limit entries from in-memory store`);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupInMemoryStore, 300000);

module.exports = {
  advancedRateLimiter,
  apiKeyRateLimiter,
  initRedisClient,
  checkRateLimitRedis,
  checkRateLimitInMemory,
  getRateLimitStatus,
  resetRateLimit,
  configureRateLimit,
  getRateLimitConfig,
  rateLimitConfig,
  determineUserTier,
  defaultKeyGenerator,
};
