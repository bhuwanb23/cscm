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

// AI/ML routes — must be mounted before the generic /api/v1 to take precedence
const aiMlPrefixes = [
  '/api/v1/demand',
  '/api/v1/demand-planning',
  '/api/v1/inventory',
  '/api/v1/routing',
  '/api/v1/supplier',
  '/api/v1/customer',
  '/api/v1/anomaly',
  '/api/v1/coordination',
  '/api/v1/simulation',
  '/api/v1/explain',
  '/api/v1/nlp',
  '/api/v1/kg',
  '/api/v1/causal',
  '/api/v1/vision',
  '/api/v1/learning',
  '/api/v1/uncertainty',
  '/api/v1/monitoring'
];
app.use(aiMlPrefixes, aiMlProxy);

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