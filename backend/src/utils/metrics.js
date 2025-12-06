const client = require('prom-client');
const logger = require('./logger');

// Enable default metrics
client.collectDefaultMetrics({ timeout: 5000 });

// Create custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const kafkaMessagesPublished = new client.Counter({
  name: 'kafka_messages_published_total',
  help: 'Total number of Kafka messages published',
  labelNames: ['topic']
});

const mqttMessagesPublished = new client.Counter({
  name: 'mqtt_messages_published_total',
  help: 'Total number of MQTT messages published',
  labelNames: ['topic']
});

const errorCount = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'service']
});

// Middleware to track HTTP requests
const requestTracker = (req, res, next) => {
  const startTime = Date.now();
  
  // Track active connections
  activeConnections.inc();
  
  // Capture response finish to record metrics
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    
    // Record metrics
    httpRequestDuration.observe({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    }, duration);
    
    httpRequestTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
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
  getContentType
};