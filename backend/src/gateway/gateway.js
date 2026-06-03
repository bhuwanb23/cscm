const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');
const logger = require('../utils/logger');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8080;

// Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Proxy middleware for Python FastAPI AI/ML service
const aiMlProxy = createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying ${req.method} ${req.path} to Python AI/ML service`);
  }
});

// Proxy middleware for Node.js Express API service (auth, events)
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1': '',
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying ${req.method} ${req.path} to Express API service`);
  }
});

// AI/ML routes — must be mounted before the generic /api/v1 to take precedence.
// Use a filter to avoid conflicts with Node.js CRUD routes under the same prefix
// (e.g. /api/v1/inventory is shared between Python AI/ML and Node.js CRUD).
const aiMlDomains = [
  'demand', 'demand-planning', 'routing', 'supplier', 'customer',
  'anomaly', 'coordination', 'simulation', 'explain', 'nlp', 'kg',
  'causal', 'vision', 'learning', 'uncertainty', 'monitoring'
];
const aiMlActions = ['optimize', 'recommendation', 'ss-policy', 'stochastic-optimize',
  'rl-train', 'mip-optimize', 'batch-optimize'];

function isAiMlPath(pathname) {
  // Remove /api/v1/ prefix to get the domain part
  if (!pathname.startsWith('/api/v1/')) return false;
  const rest = pathname.slice(8); // '/api/v1/'.length
  const firstSlash = rest.indexOf('/');
  const domain = firstSlash === -1 ? rest : rest.slice(0, firstSlash);
  const subpath = firstSlash === -1 ? '' : rest.slice(firstSlash + 1);

  // Domains that exist ONLY in Python (no Node.js CRUD under the same prefix)
  if (aiMlDomains.includes(domain) && domain !== 'inventory') return true;

  // Inventory has both Python AI/ML and Node.js CRUD — route AI actions to Python
  if (domain === 'inventory') {
    const actionSegment = subpath.split('/')[0];
    return aiMlActions.includes(actionSegment);
  }

  return false;
}

app.use('/api/v1', (req, res, next) => {
  if (isAiMlPath(req.path)) {
    return aiMlProxy(req, res, next);
  }
  next();
});

// Node.js Express routes (auth, events)
app.use('/api/v1', apiProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
  console.log(`API Gateway listening on port ${PORT}`);
});

module.exports = app;