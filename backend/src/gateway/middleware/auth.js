/**
 * Authentication Middleware for Gateway
 * Provides JWT authentication and API key authentication
 */

const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

// SECURITY: the gateway must share the backend's JWT secret. No default is
// allowed: a known fallback would let anyone forge admin tokens. In
// production a missing JWT_SECRET is fatal; in development we use a
// clearly-labeled dev-only value.
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error(
          'JWT_SECRET environment variable is required for the gateway in production. ' +
            'It must match the backend secret. Generate one with: openssl rand -hex 32'
        );
      })()
    : 'cscm-dev-only-secret-change-me');
const API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

/**
 * Verify JWT token with strict options.
 * Algorithm, issuer and audience must match what the backend signs.
 */
function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // matches backend config.auth.jwtAlgorithm default
      issuer: 'cscm-backend', // matches backend config.auth.jwtIssuer default
      audience: 'cscm-api', // matches backend config.auth.jwtAudience default
    });
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

  // SECURITY: tokens in query strings leak into proxy/access logs and
  // browser history — only headers are accepted.

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
