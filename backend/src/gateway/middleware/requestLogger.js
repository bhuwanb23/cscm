/**
 * Request/Response Logging Middleware for Gateway
 * Provides detailed logging with request ID generation for tracing
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

// Sensitive data patterns to filter
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /authorization/i,
  /credit[_-]?card/i,
  /ssn/i
];

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return uuidv4();
}

/**
 * Filter sensitive data from object
 */
function filterSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const filtered = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      filtered[key] = '[FILTERED]';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Log incoming request
 */
function logRequest(req) {
  const logData = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    headers: filterSensitiveData(req.headers),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    user: req.user ? { id: req.user.id, role: req.user.role } : null,
    authType: req.authType
  };

  logger.info('[Gateway] Incoming Request', logData);
}

/**
 * Log outgoing response
 */
function logResponse(req, res, duration) {
  const logData = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    statusMessage: res.statusMessage,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    user: req.user ? { id: req.user.id, role: req.user.role } : null
  };

  logger.info('[Gateway] Outgoing Response', logData);
}

/**
 * Request logger middleware
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Generate request ID
  req.id = generateRequestId();
  
  // Log incoming request
  logRequest(req);

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    logResponse(req, res, duration);
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.id);
    
    originalSend.call(this, data);
  };

  next();
}

/**
 * Error logging middleware
 */
function errorLogger(err, req, res, next) {
  const logData = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    timestamp: new Date().toISOString(),
    user: req.user ? { id: req.user.id, role: req.user.role } : null
  };

  logger.error('[Gateway] Error', logData);

  next(err);
}

/**
 * Proxy request logger
 */
function proxyLogger(targetService) {
  return (proxyReq, req, res) => {
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      targetService,
      targetUrl: proxyReq.path,
      headers: filterSensitiveData(proxyReq.getHeader ? proxyReq.getHeader() : {}),
      timestamp: new Date().toISOString()
    };

    logger.info(`[Gateway] Proxying to ${targetService}`, logData);
    
    // Store proxy start time for metrics
    req.proxyStartTime = Date.now();
  };
}

/**
 * Proxy response logger
 */
function proxyResponseLogger(targetService) {
  return (proxyRes, req, res) => {
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      targetService,
      statusCode: proxyRes.statusCode,
      statusMessage: proxyRes.statusMessage,
      timestamp: new Date().toISOString()
    };

    logger.info(`[Gateway] Response from ${targetService}`, logData);
    
    // Record proxy metrics
    if (req.proxyStartTime) {
      const duration = (Date.now() - req.proxyStartTime) / 1000; // Convert to seconds
      try {
        const metrics = require('../metrics');
        metrics.recordProxyRequest(targetService, req.method, req.path, proxyRes.statusCode, duration);
      } catch (error) {
        // Metrics not available, continue without recording
      }
    }
  };
}

/**
 * Proxy error logger
 */
function proxyErrorLogger(targetService) {
  return (err, req, res) => {
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      targetService,
      error: {
        message: err.message,
        code: err.code
      },
      timestamp: new Date().toISOString()
    };

    logger.error(`[Gateway] Proxy error for ${targetService}`, logData);
  };
}

module.exports = {
  requestLogger,
  errorLogger,
  proxyLogger,
  proxyResponseLogger,
  proxyErrorLogger,
  generateRequestId,
  filterSensitiveData
};
