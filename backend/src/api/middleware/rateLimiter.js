const config = require('../../config');
const logger = require('../../utils/logger');
const jwt = require('jsonwebtoken');

// Simple in-memory rate limiter
const rateLimitStore = new Map();

// Authenticated admins get a much larger per-admin budget (see below).
const ADMIN_RATE_LIMIT_MAX = parseInt(process.env.ADMIN_RATE_LIMIT_MAX_REQUESTS || 10000, 10);

const rateLimiter = (req, res, next) => {
  const windowMs = parseInt(config.security.rateLimitWindowMs);

  // Health/metrics probes are infrastructure traffic (e.g. the dev dashboard
  // polls /health every 10s); they must not consume the client budget.
  if (req.path === '/health' || req.path === '/metrics' || req.path === '/api/health') {
    return next();
  }

  // Authenticated admins get a per-admin high-budget bucket instead of the
  // shared per-IP one. The dev dashboard proxies the whole control plane
  // through a single IP; one shared bucket would exhaust after a few pages.
  const authHeader = (req.headers && req.headers.authorization) || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), config.auth.jwtSecret, {
        issuer: config.auth.jwtIssuer,
        audience: config.auth.jwtAudience,
        algorithms: [config.auth.jwtAlgorithm],
      });
      if (decoded && decoded.role === 'admin') {
        const key = `admin:${decoded.id ?? decoded.username ?? 'unknown'}`;
        const currentTime = Date.now();
        const bucket = rateLimitStore.get(key) || { count: 0, startTime: currentTime };
        if (currentTime - bucket.startTime > windowMs) {
          bucket.count = 0;
          bucket.startTime = currentTime;
        }
        bucket.count += 1;
        rateLimitStore.set(key, bucket);
        res.setHeader('X-RateLimit-Limit', ADMIN_RATE_LIMIT_MAX);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, ADMIN_RATE_LIMIT_MAX - bucket.count));
        res.setHeader('X-RateLimit-Reset', new Date(bucket.startTime + windowMs).toUTCString());
        if (bucket.count > ADMIN_RATE_LIMIT_MAX) {
          logger.warn(`Admin rate limit exceeded for ${key}`);
          return res.status(429).json({
            success: false,
            error: 'Too many requests, please try again later.',
          });
        }
        return next();
      }
    } catch {
      // Invalid/expired token: fall through to the standard per-IP bucket.
    }
  }

  const clientId = req.ip;
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

  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

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
