const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { rateLimiter, securityHeaders, corsOptions } = require('./middleware/rateLimiter');
const messagingLayer = require('../messaging');
const sqliteDatabase = require('../storage/sqliteDatabase');
const { requestTracker, getMetrics, getContentType } = require('../utils/metrics');
const swaggerSpecs = require('../../../docs/swagger');
const cacheService = require('../services/cacheService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);
app.use(requestTracker);

// Initialize database
(async () => {
  try {
    await sqliteDatabase.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Initialize messaging layer
(async () => {
  try {
    await messagingLayer.initialize();
  } catch (error) {
    console.error('Failed to initialize messaging layer:', error);
  }
})();

// Initialize cache service
(async () => {
  try {
    await cacheService.initCache();
    console.log('Cache service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize cache service:', error);
  }
})();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Cognitive Supply Chain Mesh API', 
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', getContentType());
    res.end(await getMetrics());
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// Cache metrics endpoint
app.get('/cache/stats', (req, res) => {
  try {
    const stats = cacheService.getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get cache stats' });
  }
});

// API Documentation endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CSCM API Documentation'
}));

// API Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const shipmentRoutes = require('./routes/shipments');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/shipments', shipmentRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server (skip when imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CSCM Backend API listening on port ${PORT}`);
  });
}

module.exports = app;