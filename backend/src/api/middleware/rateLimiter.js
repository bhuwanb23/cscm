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
      error: 'Too many requests, please try again later.',
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
    // Parse allowed origins from environment variable (comma-separated)
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001']; // Default to localhost in development
    
    // In production, only allow configured origins
    if (process.env.NODE_ENV === 'production') {
      if (!origin || !allowedOrigins.includes(origin)) {
        callback(new Error('Not allowed by CORS'));
        return;
      }
      callback(null, true);
    } else {
      // In development, allow all origins for easier testing
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = {
  rateLimiter,
  securityHeaders,
  corsOptions,
};
