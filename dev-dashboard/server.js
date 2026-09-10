const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';
const AI_ML_URL = process.env.AI_ML_URL || 'http://localhost:8000';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Service status tracking
const serviceStatus = {
  backend: { status: 'unknown', lastCheck: null, responseTime: null },
  gateway: { status: 'unknown', lastCheck: null, responseTime: null },
  aiMl: { status: 'unknown', lastCheck: null, responseTime: null },
  redis: { status: 'unknown', lastCheck: null, responseTime: null }
};

// Check service health
async function checkService(serviceName, url) {
  const startTime = Date.now();
  try {
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    serviceStatus[serviceName] = {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: responseTime
    };
  } catch (error) {
    serviceStatus[serviceName] = {
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime: null,
      error: error.message
    };
  }
  
  // Broadcast status update to all connected clients
  broadcastStatus();
}

// Broadcast status to all WebSocket clients
function broadcastStatus() {
  const data = JSON.stringify({ type: 'status', data: serviceStatus });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Periodic health checks
setInterval(() => {
  checkService('backend', BACKEND_URL);
  checkService('gateway', GATEWAY_URL);
  checkService('aiMl', AI_ML_URL);
}, 10000); // Check every 10 seconds

// Initial health checks
checkService('backend', BACKEND_URL);
checkService('gateway', GATEWAY_URL);
checkService('aiMl', AI_ML_URL);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to dashboard');
  
  // Send current status on connection
  ws.send(JSON.stringify({ type: 'status', data: serviceStatus }));
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'restart') {
      // Handle service restart request
      console.log(`Restart request for ${data.service}`);
      // In a real implementation, this would restart the service
      ws.send(JSON.stringify({ type: 'restart', service: data.service, status: 'not_implemented' }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected from dashboard');
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json(serviceStatus);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`Development Dashboard running on port ${PORT}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Gateway URL: ${GATEWAY_URL}`);
  console.log(`AI/ML URL: ${AI_ML_URL}`);
});
