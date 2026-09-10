/**
 * Debug Middleware for Backend API
 * Provides comprehensive debugging capabilities for development
 */

const logger = require('../../utils/logger');

/**
 * Request logging middleware
 * Logs all incoming requests with detailed information
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request details
  logger.debug('Incoming Request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.debug('Response Details', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? data.length : 0
    });
    
    originalSend.call(this, data);
  };
  
  next();
}

/**
 * Query logging middleware
 * Logs database queries with execution time
 */
function queryLogger(req, res, next) {
  const originalQuery = req.db?.query;
  
  if (originalQuery) {
    req.db.query = function(sql, params) {
      const startTime = Date.now();
      
      return originalQuery.call(this, sql, params).then(result => {
        const duration = Date.now() - startTime;
        
        logger.debug('Database Query', {
          sql: sql.substring(0, 200), // Truncate long queries
          params: params,
          duration: `${duration}ms`,
          rowsAffected: result?.length || 0
        });
        
        return result;
      });
    };
  }
  
  next();
}

/**
 * Error stack trace middleware
 * Enhances error logging with detailed stack traces
 */
function errorStackTrace(err, req, res, next) {
  logger.error('Error Details', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  
  next(err);
}

/**
 * Performance metrics middleware
 * Tracks performance metrics for requests
 */
function performanceMetrics(req, res, next) {
  const startTime = Date.now();
  const memoryBefore = process.memoryUsage();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const memoryAfter = process.memoryUsage();
    const memoryDiff = {
      heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
      external: memoryAfter.external - memoryBefore.external
    };
    
    logger.debug('Performance Metrics', {
      url: req.url,
      method: req.method,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memoryUsage: memoryDiff
    });
  });
  
  next();
}

/**
 * Debug headers middleware
 * Adds debug headers to responses
 */
function debugHeaders(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Add debug headers in development mode
    if (process.env.NODE_ENV === 'development' && !res.headersSent) {
      try {
        res.setHeader('X-Debug-Duration', duration);
        res.setHeader('X-Debug-Node-Version', process.version);
        res.setHeader('X-Debug-Platform', process.platform);
        res.setHeader('X-Debug-Memory', JSON.stringify(process.memoryUsage()));
      } catch (e) {
        // Ignore header setting errors
      }
    }
  });
  
  next();
}

/**
 * Debug mode check middleware
 * Only applies debug middleware when in development mode
 */
function debugMiddleware(req, res, next) {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
    requestLogger(req, res, next);
  } else {
    next();
  }
}

module.exports = {
  requestLogger,
  queryLogger,
  errorStackTrace,
  performanceMetrics,
  debugHeaders,
  debugMiddleware
};
