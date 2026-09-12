const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { rateLimiter, securityHeaders, corsOptions } = require('./middleware/rateLimiter');
const { userRateLimiter, userRateLimitInfo } = require('./middleware/userRateLimiter');
const { validateRequest } = require('./middleware/requestValidator');
const {
  requestLogger,
  queryLogger,
  errorStackTrace,
  performanceMetrics,
  debugHeaders,
  debugMiddleware
} = require('./middleware/debug');
const messagingLayer = require('../messaging');
const { createDatabase, getDatabase } = require('../storage/database');
const { requestTracker, getMetrics, getContentType } = require('../utils/metrics');
const cacheService = require('../services/cacheService');

// Load OpenAPI specification from YAML file
let swaggerSpecs;
try {
  const openApiPath = path.join(__dirname, '../../docs/openapi.yaml');
  const openApiFile = fs.readFileSync(openApiPath, 'utf8');
  swaggerSpecs = yaml.load(openApiFile);
} catch (error) {
  console.warn('Failed to load OpenAPI spec from YAML, using fallback:', error.message);
  swaggerSpecs = {
    openapi: '3.0.0',
    info: {
      title: 'CSCM Backend API',
      version: '1.0.0',
      description: 'Cognitive Supply Chain Mesh Backend API',
    },
    paths: {},
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);
app.use(userRateLimiter);
app.use(userRateLimitInfo);
app.use(requestTracker);

// Request validation middleware (will be applied to specific routes)
// For POST/PUT requests, we'll add validation in route definitions

// Debug middleware (development only)
if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
  app.use(requestLogger);
  app.use(performanceMetrics);
  app.use(debugHeaders);
}

// Initialize database
const database = getDatabase();
(async () => {
  try {
    await database.initialize();
    console.log('Database initialized successfully');

    // Run migration for PostgreSQL on first deployment
    if (process.env.DATABASE_TYPE === 'postgresql') {
      try {
        const { migrateToPostgres } = require('../scripts/migrate-to-postgres');
        console.log('Running PostgreSQL migration...');
        await migrateToPostgres();
        console.log('PostgreSQL migration completed successfully');
      } catch (migrationError) {
        console.warn('PostgreSQL migration skipped or failed:', migrationError.message);
        // Don't fail the startup if migration fails - tables may already exist
      }
    }
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
    status: 'running',
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
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

// Debug endpoints (development only)
if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
  app.get('/debug/info', (req, res) => {
    res.json({
      service: 'CSCM Backend API',
      version: '1.0.0',
      node_version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      debug_mode: true
    });
  });

  app.get('/debug/memory', (req, res) => {
    const memory = process.memoryUsage();
    res.json({
      heap: {
        used: memory.heapUsed,
        used_mb: Math.round(memory.heapUsed / 1024 / 1024),
        total: memory.heapTotal,
        total_mb: Math.round(memory.heapTotal / 1024 / 1024)
      },
      external: {
        used: memory.external,
        used_mb: Math.round(memory.external / 1024 / 1024)
      }
    });
  });

  app.get('/debug/config', (req, res) => {
    // Return safe configuration values
    const safeConfig = {
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      debug: process.env.DEBUG
    };
    res.json(safeConfig);
  });
}

// API Documentation endpoint
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CSCM API Documentation',
  })
);

// API Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const shipmentRoutes = require('./routes/shipments');
const analyticsRouter = require('../analytics/analyticsRouter');
const debugRoutes = require('./routes/debug');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/analytics', analyticsRouter);

// Debug routes for troubleshooting
app.use('/api/v1/debug', debugRoutes);

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
