const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');
const logger = require('../utils/logger');
const helmet = require('helmet');
const { bypassHealthCheck, optionalAuth, authenticateJWT } = require('./middleware/auth');
const { authorize } = require('./middleware/authorization');
const { requestLogger, errorLogger, proxyLogger, proxyResponseLogger, proxyErrorLogger } = require('./middleware/requestLogger');
const { defaultRateLimiter, perUserRateLimiter, rateLimitInfo } = require('./middleware/rateLimiter');
const { circuitBreakerState, getAllCircuitBreakerStates, resetCircuitBreaker } = require('./middleware/circuitBreaker');
const { getServiceUrl, getServiceMetrics, startHealthChecks } = require('./serviceDiscovery');
const { metricsMiddleware, getMetricsEndpoint, recordAuthenticationSuccess, recordAuthenticationFailure } = require('./metrics');

const app = express();
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 8080;

// Use service discovery for dynamic service URLs
// For Render deployment, use internal network URLs
const aiMlTarget = getServiceUrl('aiMl') || process.env.AI_ML_API_URL || (config.aiMl
  ? config.aiMl.apiUrl
  : 'http://localhost:8000');
const apiTarget = getServiceUrl('backend') || process.env.BACKEND_URL || `http://localhost:${config.server.port}`;

// NOTE: Do NOT use express.json() here — it consumes the request body
// before http-proxy-middleware can forward it, causing POST requests to hang.

// Security headers using helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\''],
      fontSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\'']
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  noSniff: true
}));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use((req, res, next) => {
  // Parse allowed origins from environment variable (comma-separated)
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001']; // Default to localhost in development
  
  const origin = req.headers.origin;
  
  // In production, only allow configured origins
  if (process.env.NODE_ENV === 'production') {
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    // In development, allow all origins for easier testing
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Authentication and authorization middleware
app.use(bypassHealthCheck);
app.use(optionalAuth);

// SECURITY: admin-only gateway control endpoints. authenticateJWT is
// applied here (not via bypassHealthCheck) so these routes always require
// a valid admin identity regardless of path-based bypass logic.
const adminControlPaths = [
  '/circuit-breaker/state',
  '/circuit-breaker/reset',
  '/services/registry',
];
app.use((req, res, next) => {
  if (adminControlPaths.some((p) => req.path === p || req.path.startsWith(p + '/'))) {
    return authenticateJWT(req, res, next);
  }
  next();
});

// Rate limiting middleware
app.use(defaultRateLimiter);
app.use(perUserRateLimiter);
app.use(rateLimitInfo);

// Request logging middleware
app.use(requestLogger);

// Metrics middleware (must be after request logger to track duration)
app.use(metricsMiddleware);

function proxyErrorHandler(err, req, res) {
  logger.error(`Proxy error for ${req.method} ${req.originalUrl}: ${err.message}`);
  if (!res.headersSent) {
    res.status(502).json({
      error: 'Upstream service unavailable',
      message: err.code === 'ECONNREFUSED' ? 'Service not running' : err.message,
    });
  }
}

const aiMlProxy = createProxyMiddleware({
  target: aiMlTarget,
  changeOrigin: true,
  on: {
    proxyReq: proxyLogger('AI/ML'),
    proxyRes: proxyResponseLogger('AI/ML'),
    error: proxyErrorLogger('AI/ML'),
  },
});

const apiProxy = createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  on: {
    proxyReq: proxyLogger('Backend API'),
    proxyRes: proxyResponseLogger('Backend API'),
    error: proxyErrorLogger('Backend API'),
  },
});

const aiMlDomains = [
  'demand',
  'demand-planning',
  'routing',
  'supplier',
  'customer',
  'anomaly',
  'coordination',
  'simulation',
  'explain',
  'nlp',
  'kg',
  'causal',
  'vision',
  'learning',
  'uncertainty',
  'monitoring',
];
const aiMlActions = [
  'optimize',
  'recommendation',
  'ss-policy',
  'stochastic-optimize',
  'rl-train',
  'mip-optimize',
  'batch-optimize',
];

function isAiMlPath(pathname) {
  // req.originalUrl is absolute (e.g. /api/v1/demand/forecast),
  // not relative to the mount point like req.path would be.
  if (!pathname.startsWith('/api/v1/')) return false;
  const rest = pathname.slice(8);
  const firstSlash = rest.indexOf('/');
  const domain = firstSlash === -1 ? rest : rest.slice(0, firstSlash);
  const subpath = firstSlash === -1 ? '' : rest.slice(firstSlash + 1);

  if (aiMlDomains.includes(domain) && domain !== 'inventory') return true;

  if (domain === 'inventory') {
    const actionSegment = subpath.split('/')[0];
    return aiMlActions.includes(actionSegment);
  }

  return false;
}

app.use('/api/v1', (req, res, next) => {
  if (isAiMlPath(req.originalUrl)) {
    return aiMlProxy(req, res, next);
  }
  next();
});

app.use('/api/v1', apiProxy);

// Circuit breaker state endpoint (admin only)
app.get('/circuit-breaker/state', authorize('admin'), (req, res) => {
  res.json({
    circuitBreakers: getAllCircuitBreakerStates(),
    timestamp: new Date().toISOString()
  });
});

// Reset circuit breaker endpoint (admin only)
app.post('/circuit-breaker/reset/:service', authorize('admin'), (req, res) => {
  const { service } = req.params;
  resetCircuitBreaker(service);
  res.json({
    success: true,
    message: `Circuit breaker reset for ${service}`
  });
});

// Service discovery endpoints (admin only)
app.get('/services/registry', authorize('admin'), (req, res) => {
  res.json({
    services: getServiceMetrics(),
    timestamp: new Date().toISOString()
  });
});

app.get('/services/:serviceName/url', authorize('admin'), (req, res) => {
  const { serviceName } = req.params;
  const url = getServiceUrl(serviceName);
  if (url) {
    res.json({ serviceName, url });
  } else {
    res.status(404).json({ error: 'Service not found' });
  }
});

// Metrics endpoint
app.get('/metrics', getMetricsEndpoint);

let lastAiMlStatus = 'unknown';
let lastAiMlCheckedAt = null;
let lastGatewayStatus = 'healthy';

function probePythonHealth(timeoutMs) {
  const http = require('http');
  const https = require('https');
  const pythonUrl = new URL(aiMlTarget);
  const protocol = pythonUrl.protocol === 'https:' ? https : http;
  return new Promise((resolve) => {
    const clientReq = protocol.get(`${pythonUrl.protocol}//${pythonUrl.host}/health`, (pythonRes) => {
      let data = '';
      pythonRes.on('data', (chunk) => {
        data += chunk;
      });
      pythonRes.on('end', () => {
        resolve(pythonRes.statusCode === 200 ? 'healthy' : 'unhealthy');
      });
    });
    clientReq.on('error', () => resolve('unreachable'));
    clientReq.setTimeout(timeoutMs, () => {
      clientReq.destroy();
      resolve('timeout');
    });
  });
}

app.get('/health', async (req, res) => {
  const now = new Date().toISOString();
  const aiMlStatus = await probePythonHealth(3000);
  lastAiMlStatus = aiMlStatus;
  lastAiMlCheckedAt = now;
  const gatewayStatus = 'healthy';
  if (gatewayStatus !== lastGatewayStatus) {
    logger.warn(`[gateway] health status changed: ${lastGatewayStatus} -> ${gatewayStatus}`);
    lastGatewayStatus = gatewayStatus;
  }
  res.json({
    status: gatewayStatus,
    service: 'api-gateway',
    timestamp: now,
    aiMl: {
      status: aiMlStatus,
      checkedAt: now,
    },
    circuitBreakers: getAllCircuitBreakerStates()
  });
});

app.get('/health/python', async (req, res) => {
  const http = require('http');
  const https = require('https');
  const pythonUrl = new URL(aiMlTarget);
  const protocol = pythonUrl.protocol === 'https:' ? https : http;
  return new Promise((resolve) => {
    const clientReq = protocol.get(`${pythonUrl.protocol}//${pythonUrl.host}/health`, (pythonRes) => {
      let data = '';
      pythonRes.on('data', (chunk) => (data += chunk));
      pythonRes.on('end', () => {
        res.json({
          service: 'ai-ml-python',
          status: pythonRes.statusCode === 200 ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
        });
        resolve();
      });
    });
    clientReq.on('error', () => {
      res.status(503).json({
        service: 'ai-ml-python',
        status: 'unreachable',
        timestamp: new Date().toISOString(),
      });
      resolve();
    });
    clientReq.setTimeout(3000, () => {
      clientReq.destroy();
      res.status(504).json({
        service: 'ai-ml-python',
        status: 'timeout',
        timestamp: new Date().toISOString(),
      });
      resolve();
    });
  });
});

app.use(errorLogger);
app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

if (require.main === module) {
  // Start service discovery health checks
  startHealthChecks(30000); // Check every 30 seconds
  
  app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`);
    console.log(`API Gateway listening on port ${PORT}`);
  });
}

module.exports = { app, isAiMlPath };
