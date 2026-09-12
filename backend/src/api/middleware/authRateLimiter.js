/**
 * Authentication-specific rate limiting middleware
 * Implements account lockout, progressive delays, and per-IP rate limiting
 */

const rateLimit = require('express-rate-limit');
const config = require('../../config');
const logger = require('../../utils/logger');

// In-memory storage for failed login attempts (should use Redis in production)
const failedAttempts = new Map();
const lockoutTimers = new Map();

/**
 * Rate limiter for authentication endpoints (login, register)
 * More aggressive than general rate limiting
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Allow 5 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Check if an account is locked out
 * @param {string} username - Username to check
 * @returns {boolean} True if account is locked out
 */
function isAccountLocked(username) {
  const lockoutInfo = lockoutTimers.get(username);
  if (!lockoutInfo) return false;

  const now = Date.now();
  if (now < lockoutInfo.unlockTime) {
    return true;
  }

  // Lockout period expired, remove it
  lockoutTimers.delete(username);
  failedAttempts.delete(username);
  return false;
}

/**
 * Get lockout remaining time in seconds
 * @param {string} username - Username to check
 * @returns {number} Remaining lockout time in seconds
 */
function getLockoutRemainingTime(username) {
  const lockoutInfo = lockoutTimers.get(username);
  if (!lockoutInfo) return 0;

  const now = Date.now();
  const remaining = Math.ceil((lockoutInfo.unlockTime - now) / 1000);
  return remaining > 0 ? remaining : 0;
}

/**
 * Record failed login attempt and implement progressive delays
 * @param {string} username - Username that failed login
 * @returns {Object} Information about whether account is locked
 */
function recordFailedAttempt(username) {
  const attempts = (failedAttempts.get(username) || 0) + 1;
  failedAttempts.set(username, attempts);

  logger.warn(`Failed login attempt ${attempts} for user: ${username}`);

  // Progressive lockout: 5 attempts = 5 min, 10 attempts = 15 min, 15+ attempts = 30 min
  let lockoutDuration = 0;
  if (attempts >= 5 && attempts < 10) {
    lockoutDuration = 5 * 60 * 1000; // 5 minutes
  } else if (attempts >= 10 && attempts < 15) {
    lockoutDuration = 15 * 60 * 1000; // 15 minutes
  } else if (attempts >= 15) {
    lockoutDuration = 30 * 60 * 1000; // 30 minutes
  }

  if (lockoutDuration > 0) {
    const unlockTime = Date.now() + lockoutDuration;
    lockoutTimers.set(username, { unlockTime, attempts });
    logger.warn(`Account locked for user: ${username} until ${new Date(unlockTime).toISOString()}`);
  }

  return {
    isLocked: lockoutDuration > 0,
    attempts,
    lockoutDuration
  };
}

/**
 * Clear failed attempts on successful login
 * @param {string} username - Username that successfully logged in
 */
function clearFailedAttempts(username) {
  failedAttempts.delete(username);
  lockoutTimers.delete(username);
  logger.info(`Cleared failed attempts for user: ${username}`);
}

/**
 * Middleware to check account lockout status
 */
const checkAccountLockout = (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return next();
  }

  if (isAccountLocked(username)) {
    const remainingTime = getLockoutRemainingTime(username);
    return res.status(429).json({
      success: false,
      error: 'Account temporarily locked due to too many failed login attempts',
      retryAfter: remainingTime
    });
  }

  next();
};

module.exports = {
  authRateLimiter,
  recordFailedAttempt,
  clearFailedAttempts,
  checkAccountLockout,
  isAccountLocked,
  getLockoutRemainingTime
};
