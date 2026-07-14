const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');
const logger = require('../utils/logger');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8080;
const aiMlTarget = config.aiMl ? config.aiMl.apiUrl : (process.env.AI_ML_API_URL || 'http://localhost:8000');
const apiTarget = `http://localhost:${config.server.port}`;

// NOTE: Do NOT use express.json() here — it consumes the request body
// before http-proxy-middleware can forward it, causing POST requests to hang.

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

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

function proxyErrorHandler(err, req, res) {
  logger.error(`Proxy error for ${req.method} ${req.originalUrl}: ${err.message}`);
  if (!res.headersSent) {
    res.status(502).json({
      error: 'Upstream service unavailable',
      message: err.code === 'ECONNREFUSED'
        ? 'Service not running'
        : err.message
    });
  }
}

const aiMlProxy = createProxyMiddleware({
  target: aiMlTarget,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      logger.info(`[gateway] → Python AI/ML: ${req.method} ${req.originalUrl}`);
    },
    error: proxyErrorHandler
  }
});

const apiProxy = createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      logger.info(`[gateway] → Express API: ${req.method} ${req.originalUrl}`);
    },
    error: proxyErrorHandler
  }
});

const aiMlDomains = [
  'demand', 'demand-planning', 'routing', 'supplier', 'customer',
  'anomaly', 'coordination', 'simulation', 'explain', 'nlp', 'kg',
  'causal', 'vision', 'learning', 'uncertainty', 'monitoring'
];
const aiMlActions = ['optimize', 'recommendation', 'ss-policy', 'stochastic-optimize',
  'rl-train', 'mip-optimize', 'batch-optimize'];

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

let lastAiMlStatus = 'unknown';
let lastAiMlCheckedAt = null;
let lastGatewayStatus = 'healthy';

function probePythonHealth(timeoutMs) {
  const http = require('http');
  const pythonUrl = new URL(aiMlTarget);
  return new Promise((resolve) => {
    const clientReq = http.get(`${pythonUrl.protocol}//${pythonUrl.host}/health`, (pythonRes) => {
      let data = '';
      pythonRes.on('data', (chunk) => { data += chunk; });
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
  const aiMlStatus = await probePythonHealth(1000);
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
  });
});

app.get('/health/python', async (req, res) => {
  const http = require('http');
  const pythonUrl = new URL(aiMlTarget);
  return new Promise(resolve => {
    const clientReq = http.get(`${pythonUrl.protocol}//${pythonUrl.host}/health`, (pythonRes) => {
      let data = '';
      pythonRes.on('data', chunk => data += chunk);
      pythonRes.on('end', () => {
        res.json({
          service: 'ai-ml-python',
          status: pythonRes.statusCode === 200 ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString()
        });
        resolve();
      });
    });
    clientReq.on('error', () => {
      res.status(503).json({
        service: 'ai-ml-python',
        status: 'unreachable',
        timestamp: new Date().toISOString()
      });
      resolve();
    });
    clientReq.setTimeout(3000, () => {
      clientReq.destroy();
      res.status(504).json({
        service: 'ai-ml-python',
        status: 'timeout',
        timestamp: new Date().toISOString()
      });
      resolve();
    });
  });
});

app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`);
    console.log(`API Gateway listening on port ${PORT}`);
  });
}

module.exports = { app, isAiMlPath };
