const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Load local .env (dev convenience only — Render injects env vars natively).
// Does not override variables already set in the environment.
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith('#')) continue;
      if (!(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^['"](.*)['"]$/, '$1');
      }
    }
  }
} catch { /* env file is optional */ }

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3002;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';
const AI_ML_URL = process.env.AI_ML_URL || 'http://localhost:8000';

// Auth for the dashboard itself. In dev, default admin/admin123.
// SECURITY: set DASHBOARD_JWT_SECRET in any shared environment; when unset
// the dashboard refuses to start unless NODE_ENV is development.
const DASHBOARD_JWT_SECRET =
  process.env.DASHBOARD_JWT_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? null
    : 'dashboard-dev-only-secret');
if (!DASHBOARD_JWT_SECRET) {
  console.error('DASHBOARD_JWT_SECRET is required in production. Aborting.');
  process.exit(1);
}
const DASHBOARD_USER = process.env.DASHBOARD_USER || 'admin';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';

// Optional admin JWT used to call backend admin APIs on the user's behalf.
// The dashboard never stores credentials; the browser keeps its own backend
// token if provided via localStorage after logging in through the gateway.
const AI_ML_API_KEY = process.env.AI_ML_API_KEY || '';

app.use(express.json());

// Static assets: in development the React app runs via Vite (npm run dev on
// :5173, proxying /api and /gateway here). In production, serve the built SPA.
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  app.use(express.static(DIST_DIR));
}

/* ------------------------------------------------------------------ */
/* Service status tracking + live broadcast                            */
/* ------------------------------------------------------------------ */

const serviceStatus = {
  backend: { status: 'unknown', lastCheck: null, responseTime: null },
  gateway: { status: 'unknown', lastCheck: null, responseTime: null },
  aiMl: { status: 'unknown', lastCheck: null, responseTime: null },
  redis: { status: 'unknown', lastCheck: null, responseTime: null }
};

const recentEvents = []; // ring buffer for the activity feed
const MAX_EVENTS = 200;

function pushEvent(event) {
  const entry = { id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), ...event };
  recentEvents.push(entry);
  if (recentEvents.length > MAX_EVENTS) recentEvents.shift();
  broadcast({ type: 'event', data: entry });
  return entry;
}

function broadcast(payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
}

async function checkService(serviceName, url) {
  const startTime = Date.now();
  const previous = serviceStatus[serviceName].status;
  try {
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    serviceStatus[serviceName] = {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime,
      detail: typeof response.data === 'object' ? response.data : undefined
    };
    if (previous !== 'healthy') {
      pushEvent({ kind: 'service', message: `${serviceName} is healthy (${responseTime}ms)`, level: 'ok' });
    }
  } catch (error) {
    serviceStatus[serviceName] = {
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime: null,
      error: error.message
    };
    if (previous !== 'unhealthy') {
      pushEvent({ kind: 'service', message: `${serviceName} is DOWN: ${error.message}`, level: 'error' });
    }
  }
  broadcast({ type: 'status', data: serviceStatus });
}

setInterval(() => {
  checkService('backend', BACKEND_URL);
  checkService('gateway', GATEWAY_URL);
  checkService('aiMl', AI_ML_URL);
}, 10000);

checkService('backend', BACKEND_URL);
checkService('gateway', GATEWAY_URL);
checkService('aiMl', AI_ML_URL);

/* ------------------------------------------------------------------ */
/* Dashboard auth                                                      */
/* ------------------------------------------------------------------ */

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== DASHBOARD_USER || password !== DASHBOARD_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  const token = jwt.sign({ sub: username, role: 'dashboard-admin' }, DASHBOARD_JWT_SECRET, {
    expiresIn: '8h'
  });
  res.json({ success: true, token });
});

function requireDashboardAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Login required' });
  try {
    req.user = jwt.verify(token, DASHBOARD_JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }
}

/* ------------------------------------------------------------------ */
/* Public dashboard endpoints — declared BEFORE the authed /api router */
/* so they are not shadowed by its auth middleware.                    */
/* ------------------------------------------------------------------ */

app.get('/api/status', (req, res) => res.json(serviceStatus));
app.get('/api/events', (req, res) => res.json(recentEvents.slice(-100).reverse()));
app.get('/api/health', (req, res) =>
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
);

/* ------------------------------------------------------------------ */
/* Backend admin proxy (forward dashboard auth → backend admin API)    */
/* ------------------------------------------------------------------ */

const api = express.Router();
api.use(requireDashboardAuth);

// Build backend auth: reuse a real admin JWT if the browser supplies one
// (x-backend-token); otherwise sign one locally using the backend secret if
// the dashboard has it configured (BACKEND_JWT_SECRET). This avoids giving
// the dashboard a hardcoded admin password.
function backendAuthHeaders(req) {
  const headers = { 'Content-Type': 'application/json' };
  const browserToken = req.headers['x-backend-token'];
  if (browserToken) {
    headers.Authorization = `Bearer ${browserToken}`;
  } else if (process.env.BACKEND_JWT_SECRET) {
    const token = jwt.sign(
      { id: 0, username: 'dev-dashboard', role: 'admin' },
      process.env.BACKEND_JWT_SECRET,
      { expiresIn: '5m', issuer: 'cscm-backend', audience: 'cscm-api', algorithm: 'HS256' }
    );
    headers.Authorization = `Bearer ${token}`;
  }
  if (AI_ML_API_KEY) headers['X-API-Key'] = AI_ML_API_KEY;
  return headers;
}

async function proxyGet(req, res, url) {
  try {
    const response = await axios.get(url, {
      headers: backendAuthHeaders(req),
      timeout: 15000,
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response ? error.response.status : 502;
    const detail = error.response ? error.response.data : error.message;
    res.status(status).json({ success: false, error: detail });
  }
}

async function proxyPost(req, res, url) {
  try {
    const response = await axios.post(url, req.body, {
      headers: backendAuthHeaders(req),
      timeout: 30000
    });
    pushEvent({ kind: 'action', message: `${req.method} ${url}`, level: 'info' });
    res.json(response.data);
  } catch (error) {
    const status = error.response ? error.response.status : 502;
    const detail = error.response ? error.response.data : error.message;
    res.status(status).json({ success: false, error: detail });
  }
}
async function proxyRequest(req, res, method, url) {
  try {
    const response = await axios.request({
      method,
      url,
      data: req.body,
      headers: backendAuthHeaders(req),
      timeout: 30000
    });
    pushEvent({ kind: 'action', message: `${method} ${url}`, level: 'info' });
    res.json(response.data);
  } catch (error) {
    const status = error.response ? error.response.status : 502;
    const detail = error.response ? error.response.data : error.message;
    res.status(status).json({ success: false, error: detail });
  }
}

// -- system & db inspection
api.get('/system', (req, res) => proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/system`));
api.get('/db/tables', (req, res) => proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/database/tables`));
api.get('/db/tables/:table/schema', (req, res) =>
  proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/database/tables/${req.params.table}/schema`)
);
api.get('/db/tables/:table/rows', (req, res) =>
  proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/database/tables/${req.params.table}/rows`)
);
api.post('/db/query', (req, res) => proxyPost(req, res, `${BACKEND_URL}/api/v1/debug/database/query`));

// -- domain data
api.get('/data/users', (req, res) => proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/data/users`));
api.get('/data/inventory/:storeId', (req, res) =>
  proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/data/inventory/${req.params.storeId}`)
);
api.get('/data/orders/:storeId', (req, res) =>
  proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/data/orders/${req.params.storeId}`)
);
api.get('/data/shipments/:status', (req, res) =>
  proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/data/shipments/status/${req.params.status}`)
);

// -- admin writes (guarded deletes / role updates)
api.post('/data/:action', (req, res) =>
  proxyPost(req, res, `${BACKEND_URL}/api/v1/debug/data/${req.params.action}`)
);
api.patch('/data/users/:id/role', (req, res) =>
  proxyRequest(req, res, 'PATCH', `${BACKEND_URL}/api/v1/debug/data/users/${req.params.id}/role`)
);

// -- logs / agents / cache / backups
api.get('/logs', (req, res) => proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/logs`));
api.get('/agents', (req, res) => proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/agents`));
api.post('/agents/:name/:action', (req, res) =>
  proxyPost(req, res, `${BACKEND_URL}/api/v1/debug/agents/${req.params.name}/${req.params.action}`)
);
api.get('/cache/stats', (req, res) => proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/cache/stats`));
api.post('/cache/clear', (req, res) => proxyPost(req, res, `${BACKEND_URL}/api/v1/debug/cache/clear`));
api.get('/backups', (req, res) => proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/backups`));
api.post('/backups', (req, res) => proxyPost(req, res, `${BACKEND_URL}/api/v1/debug/backups`));

// -- AI/ML public health (the AI/ML /health endpoint sits outside /api/v1)
api.get('/aiml/health', (req, res) => proxyRequest(req, res, 'GET', `${AI_ML_URL}/health`));

// -- AI/ML direct proxy (playground)
async function proxyAiMl(req, res, subPath) {
  try {
    const response = await axios.request({
      method: req.method,
      url: `${AI_ML_URL}/api/v1/${subPath}`,
      data: req.body,
      headers: backendAuthHeaders(req),
      timeout: 60000
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response ? error.response.status : 502;
    const detail = error.response ? error.response.data : error.message;
    res.status(status).json({ success: false, error: detail });
  }
}
api.all('/aiml/*', (req, res) => {
  const subPath = req.path.replace(/^\/aiml\//, '');
  return proxyAiMl(req, res, subPath);
});

// -- Recent events snapshot (websocket replays live events; this is the poll fallback)
api.get('/events', (req, res) => res.json({ events: recentEvents.slice(-100) }));

// -- Simulation control (backend lifecycle endpoints)
api.get('/simulation/status', (req, res) =>
  proxyGet(req, res, `${BACKEND_URL}/api/v1/debug/simulation/status`)
);
api.post('/simulation/:action', (req, res) =>
  proxyPost(req, res, `${BACKEND_URL}/api/v1/debug/simulation/${req.params.action}`)
);

// -- Generic backend passthrough: full backend paths (e.g. /api/v1/debug/...)
//    forward with signed admin auth. Registered last so curated routes win.
api.all('/v1/*', (req, res) => {
  const subPath = req.path.replace(/^\/v1/, '/api/v1');
  return proxyRequest(req, res, req.method, `${BACKEND_URL}${subPath}`);
});

// -- Gateway passthrough (authed: admin JWT required for circuit-breaker ops).
//    Lives on the authed /api router so /gateway/* page deep-links still hit
//    the SPA fallback instead of this handler.
api.all('/gateway/*', (req, res) => {
  const subPath = req.path.replace(/^\/gateway/, '');
  const browserToken = req.headers['x-backend-token'] || '';
  axios.request({
    method: req.method,
    url: `${GATEWAY_URL}${subPath}`,
    data: req.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: browserToken || `Bearer ${jwt.sign(
        { id: 0, username: 'dev-dashboard', role: 'admin' },
        process.env.BACKEND_JWT_SECRET || DASHBOARD_JWT_SECRET,
        { expiresIn: '5m', issuer: 'cscm-backend', audience: 'cscm-api', algorithm: 'HS256' }
      )}`,
    },
    timeout: 30000
  }).then((response) => res.status(response.status).json(response.data))
    .catch((error) => {
      const status = error.response ? error.response.status : 502;
      const detail = error.response ? error.response.data : error.message;
      res.status(status).json({ success: false, error: detail });
    });
});

app.use('/api', api);

// CRUD passthrough to the gateway has moved onto the authed /api router
// (see api.all('/gateway/*') above) so SPA deep-links to /gateway/* pages work.

/* ------------------------------------------------------------------ */
/* WebSocket                                                           */
/* ------------------------------------------------------------------ */

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', data: serviceStatus }));
  ws.send(JSON.stringify({ type: 'events', data: recentEvents.slice(-50) }));
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'restart') {
        ws.send(JSON.stringify({ type: 'restart', service: data.service, status: 'not_implemented' }));
      }
    } catch {
      // ignore malformed frames
    }
  });
});

// SPA fallback: any non-API GET serves the React app (client-side routing).
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexHtml = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  res.status(200).send(
    '<h2>CSCM Control Plane</h2><p>React app not built yet. Run <code>npm run dev</code> (Vite on :5173) or <code>npm run build</code> then restart.</p>'
  );
});

server.listen(PORT, () => {
  console.log(`Development Dashboard running on port ${PORT}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Gateway URL: ${GATEWAY_URL}`);
  console.log(`AI/ML URL: ${AI_ML_URL}`);
  console.log(`Dashboard login: ${DASHBOARD_USER} ${process.env.DASHBOARD_PASSWORD ? '(from env)' : '(default admin123 - change me!)'}`);
});
