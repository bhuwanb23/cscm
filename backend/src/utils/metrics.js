const client = require('prom-client');
const logger = require('./logger');

// Enable default metrics
client.collectDefaultMetrics({ timeout: 5000 });

// Create custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const kafkaMessagesPublished = new client.Counter({
  name: 'kafka_messages_published_total',
  help: 'Total number of Kafka messages published',
  labelNames: ['topic'],
});

const mqttMessagesPublished = new client.Counter({
  name: 'mqtt_messages_published_total',
  help: 'Total number of MQTT messages published',
  labelNames: ['topic'],
});

const errorCount = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'service'],
});

// --- Business metrics (fed from analytics/metricsCollector) ---
const businessGauges = {
  users_total: new client.Gauge({
    name: 'cscm_users_total',
    help: 'Total registered users',
  }),
  users_active: new client.Gauge({
    name: 'cscm_users_active',
    help: 'Currently active users',
  }),
  orders_total: new client.Gauge({
    name: 'cscm_orders_total',
    help: 'Total orders',
  }),
  orders_pending: new client.Gauge({
    name: 'cscm_orders_pending',
    help: 'Orders pending completion',
  }),
  orders_revenue: new client.Gauge({
    name: 'cscm_orders_revenue',
    help: 'Accumulated order revenue',
  }),
  inventory_total_items: new client.Gauge({
    name: 'cscm_inventory_total_items',
    help: 'Total inventory items tracked',
  }),
  inventory_low_stock: new client.Gauge({
    name: 'cscm_inventory_low_stock',
    help: 'Inventory items below minimum stock level',
  }),
  inventory_out_of_stock: new client.Gauge({
    name: 'cscm_inventory_out_of_stock',
    help: 'Inventory items out of stock',
  }),
  shipments_total: new client.Gauge({
    name: 'cscm_shipments_total',
    help: 'Total shipments',
  }),
  shipments_in_transit: new client.Gauge({
    name: 'cscm_shipments_in_transit',
    help: 'Shipments currently in transit',
  }),
  shipments_delivered: new client.Gauge({
    name: 'cscm_shipments_delivered',
    help: 'Shipments delivered',
  }),
  shipments_delayed: new client.Gauge({
    name: 'cscm_shipments_delayed',
    help: 'Shipments running late',
  }),
};

// Periodically publish the in-memory business metrics snapshot to Prometheus
// gauges so /metrics exposes orders, inventory, shipment and user KPIs.
const metricsCollector = require('../analytics/metricsCollector');
function syncBusinessMetrics() {
  try {
    const m = metricsCollector.getMetrics();
    businessGauges.users_total.set(m.users.total);
    businessGauges.users_active.set(m.users.active);
    businessGauges.orders_total.set(m.orders.total);
    businessGauges.orders_pending.set(m.orders.pending);
    businessGauges.orders_revenue.set(m.orders.revenue);
    businessGauges.inventory_total_items.set(m.inventory.totalItems);
    businessGauges.inventory_low_stock.set(m.inventory.lowStock);
    businessGauges.inventory_out_of_stock.set(m.inventory.outOfStock);
    businessGauges.shipments_total.set(m.shipments.total);
    businessGauges.shipments_in_transit.set(m.shipments.inTransit);
    businessGauges.shipments_delivered.set(m.shipments.delivered);
    businessGauges.shipments_delayed.set(m.shipments.delayed);
  } catch (error) {
    // Metrics must never break the app; snapshot may be mid-update.
  }
}
setInterval(syncBusinessMetrics, 15000).unref();
syncBusinessMetrics();

// Middleware to track HTTP requests
const requestTracker = (req, res, next) => {
  const startTime = Date.now();

  // Track active connections
  activeConnections.inc();

  // Capture response finish to record metrics
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds

    // Record metrics
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode,
      },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });

    // Decrement active connections
    activeConnections.dec();
  });

  next();
};

// Function to track Kafka messages
const trackKafkaMessage = (topic) => {
  kafkaMessagesPublished.inc({ topic });
};

// Function to track MQTT messages
const trackMqttMessage = (topic) => {
  mqttMessagesPublished.inc({ topic });
};

// Function to track errors
const trackError = (type, service) => {
  errorCount.inc({ type, service });
  logger.error(`Error tracked: ${type} in ${service}`);
};

// Function to get metrics as string
const getMetrics = async () => {
  return await client.register.metrics();
};

// Function to get content type for metrics
const getContentType = () => {
  return client.register.contentType;
};

module.exports = {
  requestTracker,
  trackKafkaMessage,
  trackMqttMessage,
  trackError,
  getMetrics,
  getContentType,
};
