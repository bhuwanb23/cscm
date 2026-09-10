/**
 * Rate Limiting Middleware for Gateway
 * Provides per-IP and per-user rate limiting using express-rate-limit
 */

const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');

// Rate limit configurations
const RATE_LIMIT_CONFIGS = {
  // Default rate limit (per IP)
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Strict rate limit (for sensitive endpoints)
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per window
    message: 'Rate limit exceeded for this endpoint',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Per-user rate limit
  perUser: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window per user
    message: 'User rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Service-to-service rate limit
  service: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    message: 'Service rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
  }
};

/**
 * Create rate limiter
 */
function createRateLimiter(config, keyGenerator = null) {
  const options = {
    ...config,
    keyGenerator: keyGenerator || ((req) => req.ip),
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      if (req.path === '/health' || req.path === '/health/python' || req.path === '/metrics') {
        return true;
      }
      
      // Skip rate limiting for service-to-service communication
      if (req.authType === 'api_key') {
        return true;
      }
      
      return false;
    }
  };

  return rateLimit(options);
}

/**
 * Default rate limiter (per IP)
 */
const defaultRateLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.default);

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictRateLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.strict);

/**
 * Per-user rate limiter
 */
const perUserRateLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.perUser, (req) => {
  // Use user ID if available, otherwise use IP
  return req.user?.id || req.ip;
});

/**
 * Service rate limiter (for service-to-service communication)
 */
const serviceRateLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.service, (req) => {
  return req.user?.apiKey || req.ip;
});

/**
 * Custom rate limiter factory
 */
function customRateLimiter(config) {
  return createRateLimiter(config);
}

/**
 * Rate limit middleware factory
 */
function rateLimitMiddleware(configName = 'default') {
  const limiters = {
    default: defaultRateLimiter,
    strict: strictRateLimiter,
    perUser: perUserRateLimiter,
    service: serviceRateLimiter
  };

  return limiters[configName] || defaultRateLimiter;
}

/**
 * Get rate limit info
 */
function getRateLimitInfo(req) {
  return {
    limit: RATE_LIMIT_CONFIGS.default.max,
    remaining: req.rateLimit?.remaining || 0,
    reset: req.rateLimit?.resetAt || null
  };
}

/**
 * Rate limit info middleware
 */
function rateLimitInfo(req, res, next) {
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIGS.default.max);
  res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining || 0);
  res.setHeader('X-RateLimit-Reset', req.rateLimit?.resetAt || 0);
  next();
}

module.exports = {
  defaultRateLimiter,
  strictRateLimiter,
  perUserRateLimiter,
  serviceRateLimiter,
  customRateLimiter,
  rateLimitMiddleware,
  getRateLimitInfo,
  rateLimitInfo
};
