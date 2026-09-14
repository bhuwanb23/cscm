/**
 * Authentication Middleware for Gateway
 * Provides JWT authentication and API key authentication
 */

const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

/**
 * Verify JWT token
 */
function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.warn('JWT verification failed:', error.message);
    return null;
  }
}

/**
 * Verify API key
 */
function verifyAPIKey(apiKey) {
  return API_KEYS.includes(apiKey);
}

/**
 * Extract token from request
 */
function extractToken(req) {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameter
  if (req.query.token) {
    return req.query.token;
  }

  // Check API key header
  if (req.headers['x-api-key']) {
    return req.headers['x-api-key'];
  }

  return null;
}

/**
 * JWT authentication middleware
 */
function authenticateJWT(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided'
    });
  }

  // Try JWT authentication first
  const decoded = verifyJWT(token);
  if (decoded) {
    req.user = decoded;
    req.authType = 'jwt';
    return next();
  }

  // Fall back to API key authentication
  if (verifyAPIKey(token)) {
    req.user = { type: 'service', apiKey: token };
    req.authType = 'api_key';
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid authentication token'
  });
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      req.user = decoded;
      req.authType = 'jwt';
    } else if (verifyAPIKey(token)) {
      req.user = { type: 'service', apiKey: token };
      req.authType = 'api_key';
    }
  }

  next();
}

/**
 * Health check bypass middleware
 * Allows health check and auth endpoints to bypass authentication
 */
function bypassHealthCheck(req, res, next) {
  const publicPaths = ['/health', '/health/python', '/metrics', '/api/v1/auth/login', '/api/v1/auth/register'];
  
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  return authenticateJWT(req, res, next);
}

module.exports = {
  authenticateJWT,
  optionalAuth,
  bypassHealthCheck,
  verifyJWT,
  verifyAPIKey
};
