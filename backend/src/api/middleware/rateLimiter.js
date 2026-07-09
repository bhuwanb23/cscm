const config = require('../../config');
const logger = require('../../utils/logger');

// Simple in-memory rate limiter
const rateLimitStore = new Map();

const rateLimiter = (req, res, next) => {
  const clientId = req.ip;
  const windowMs = parseInt(config.security.rateLimitWindowMs);
  const maxRequests = parseInt(config.security.rateLimitMaxRequests);
  
  const currentTime = Date.now();
  const clientData = rateLimitStore.get(clientId) || { count: 0, startTime: currentTime };
  
  // Reset count if window has passed
  if (currentTime - clientData.startTime > windowMs) {
    clientData.count = 0;
    clientData.startTime = currentTime;
  }
  
  // Increment request count
  clientData.count += 1;
  rateLimitStore.set(clientId, clientData);
  
  // Check if limit exceeded
  if (clientData.count > maxRequests) {
    logger.warn(`Rate limit exceeded for client ${clientId}`);
    return res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  }
  
  // Add rate limit info to response headers
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientData.count));
  res.setHeader('X-RateLimit-Reset', new Date(clientData.startTime + windowMs).toUTCString());
  
  next();
};

// Enhanced security middleware
const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable DNS prefetching control
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // In production, you would check against a whitelist of allowed origins
    // For now, we'll allow all origins in development
    if (!origin || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

module.exports = {
  rateLimiter,
  securityHeaders,
  corsOptions
};