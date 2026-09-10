/**
 * User-based Rate Limiting Middleware for Backend API
 * Provides per-user rate limiting with role-based tiers
 */

const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');

// Rate limit store for tracking usage (simple in-memory implementation)
const rateLimitStore = new Map();

// Role-based rate limit configurations
const ROLE_RATE_LIMITS = {
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window
    message: 'Admin rate limit exceeded'
  },
  shopkeeper: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Shopkeeper rate limit exceeded'
  },
  transporter: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Transporter rate limit exceeded'
  },
  wholesaler: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Wholesaler rate limit exceeded'
  },
  service: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    message: 'Service rate limit exceeded'
  },
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Rate limit exceeded'
  }
};

/**
 * Get rate limit configuration based on user role
 */
function getRateLimitConfig(user) {
  if (!user) {
    return ROLE_RATE_LIMITS.default;
  }

  const role = user.role || 'default';
  return ROLE_RATE_LIMITS[role] || ROLE_RATE_LIMITS.default;
}

/**
 * Create user-based rate limiter
 */
function createUserRateLimiter(config) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      error: 'Too Many Requests',
      message: config.message,
      retryAfter: Math.ceil(config.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if available, otherwise use IP
      return req.user?.id || req.ip;
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for user ${req.user?.id || req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks and metrics
      if (req.path === '/health' || req.path === '/metrics' || req.path === '/cache/stats') {
        return true;
      }
      
      // Skip rate limiting for admin users (optional - can be configured)
      if (req.user?.role === 'admin' && process.env.ADMIN_BYPASS_RATE_LIMIT === 'true') {
        return true;
      }
      
      return false;
    }
  });
}

/**
 * Middleware to apply user-based rate limiting
 */
function userRateLimiter(req, res, next) {
  const config = getRateLimitConfig(req.user);
  const limiter = createUserRateLimiter(config);
  return limiter(req, res, next);
}

/**
 * Strict rate limiter for sensitive endpoints
 */
function strictUserRateLimiter(req, res, next) {
  const config = getRateLimitConfig(req.user);
  const strictConfig = {
    ...config,
    max: Math.floor(config.max / 10), // 10% of normal limit
    message: 'Strict rate limit exceeded for sensitive endpoint'
  };
  const limiter = createUserRateLimiter(strictConfig);
  return limiter(req, res, next);
}

/**
 * Get user rate limit info
 */
function getUserRateLimitInfo(user) {
  const config = getRateLimitConfig(user);
  return {
    max: config.max,
    windowMs: config.windowMs,
    windowMinutes: Math.ceil(config.windowMs / 60000)
  };
}

/**
 * Rate limit info middleware
 */
function userRateLimitInfo(req, res, next) {
  const config = getRateLimitConfig(req.user);
  res.setHeader('X-RateLimit-Limit', config.max);
  res.setHeader('X-RateLimit-Window', config.windowMs);
  next();
}

/**
 * Check if user is rate limited
 */
function isUserRateLimited(req) {
  const config = getRateLimitConfig(req.user);
  // This is a simplified check - in production, you'd want to check actual usage
  return false;
}

module.exports = {
  userRateLimiter,
  strictUserRateLimiter,
  getUserRateLimitInfo,
  userRateLimitInfo,
  isUserRateLimited,
  ROLE_RATE_LIMITS
};
