/**
 * User-based Rate Limiting Middleware for Backend API
 * Provides per-user rate limiting with role-based tiers
 */

const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');
const jwt = require('jsonwebtoken');
const config = require('../../config');

// Rate limit store for tracking usage (simple in-memory implementation)
const rateLimitStore = new Map();

/**
 * Best-effort early decode of the Bearer JWT so role-tiered limiting works
 * even though this middleware runs before route-level auth fills req.user.
 * Signature/issuer/audience are verified; on any failure the request falls
 * back to IP-based limiting.
 */
function resolveRateLimitUser(req) {
  if (req.user) return req.user;
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), config.auth.jwtSecret, {
      issuer: config.auth.jwtIssuer,
      audience: config.auth.jwtAudience,
      algorithms: [config.auth.jwtAlgorithm],
    });
  } catch {
    return null;
  }
}

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

// Verified admins are control-plane clients (dev dashboard, ops scripts) that
// legitimately burst far beyond user-tier budgets; skip tier limiting for them.
function isAdminPrincipal(user) {
  return !!user && user.role === 'admin';
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
  const user = resolveRateLimitUser(req);
  if (isAdminPrincipal(user)) return next();
  const config = getRateLimitConfig(user);
  const windowMs = config.windowMs;
  const max = config.max;
  
  // Simple in-memory rate limiting using a Map
  const key = user?.id || req.ip;
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const userLimit = rateLimitStore.get(key);
  
  // Reset if window expired
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return next();
  }
  
  // Check if limit exceeded
  if (userLimit.count >= max) {
    logger.warn(`Rate limit exceeded for user ${key} on ${req.path}`);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: config.message,
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
    });
  }
  
  userLimit.count++;
  return next();
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
  
  const windowMs = strictConfig.windowMs;
  const max = strictConfig.max;
  
  const key = req.user?.id || req.ip;
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const userLimit = rateLimitStore.get(key);
  
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return next();
  }
  
  if (userLimit.count >= max) {
    logger.warn(`Strict rate limit exceeded for user ${key} on ${req.path}`);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: strictConfig.message,
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
    });
  }
  
  userLimit.count++;
  return next();
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
