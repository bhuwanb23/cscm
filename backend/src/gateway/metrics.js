/**
 * Gateway Metrics Module
 * Provides Prometheus metrics for monitoring gateway performance
 */

const client = require('prom-client');
const logger = require('../utils/logger');

// Create a Registry to register the metrics
const register = new client.Registry();

// Enable default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Gateway metrics
const httpRequestDuration = new client.Histogram({
  name: 'gateway_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'gateway_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code']
});

const httpErrorsTotal = new client.Counter({
  name: 'gateway_http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'path', 'error_type']
});

const proxyRequestDuration = new client.Histogram({
  name: 'gateway_proxy_request_duration_seconds',
  help: 'Duration of proxy requests in seconds',
  labelNames: ['service', 'method', 'path', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const proxyRequestTotal = new client.Counter({
  name: 'gateway_proxy_requests_total',
  help: 'Total number of proxy requests',
  labelNames: ['service', 'method', 'path', 'status_code']
});

const proxyErrorsTotal = new client.Counter({
  name: 'gateway_proxy_errors_total',
  help: 'Total number of proxy errors',
  labelNames: ['service', 'error_type']
});

const circuitBreakerState = new client.Gauge({
  name: 'gateway_circuit_breaker_state',
  help: 'Current state of circuit breakers (0=closed, 1=open, 2=half-open)',
  labelNames: ['service']
});

const circuitBreakerFailures = new client.Counter({
  name: 'gateway_circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['service']
});

const rateLimitHits = new client.Counter({
  name: 'gateway_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['limit_type', 'user_id']
});

const activeConnections = new client.Gauge({
  name: 'gateway_active_connections',
  help: 'Number of active connections'
});

// Track active connections count
let activeConnectionsCount = 0;

const authenticationSuccess = new client.Counter({
  name: 'gateway_authentication_success_total',
  help: 'Total number of successful authentications',
  labelNames: ['auth_type']
});

const authenticationFailure = new client.Counter({
  name: 'gateway_authentication_failure_total',
  help: 'Total number of failed authentications',
  labelNames: ['auth_type', 'reason']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpErrorsTotal);
register.registerMetric(proxyRequestDuration);
register.registerMetric(proxyRequestTotal);
register.registerMetric(proxyErrorsTotal);
register.registerMetric(circuitBreakerState);
register.registerMetric(circuitBreakerFailures);
register.registerMetric(rateLimitHits);
register.registerMetric(activeConnections);
register.registerMetric(authenticationSuccess);
register.registerMetric(authenticationFailure);

/**
 * Record HTTP request metrics
 */
function recordHttpRequest(method, path, statusCode, duration) {
  const labels = { method, path, status_code: statusCode };
  
  httpRequestDuration.observe(labels, duration);
  httpRequestTotal.inc(labels);
  
  if (statusCode >= 400) {
    httpErrorsTotal.inc({
      method,
      path,
      error_type: statusCode >= 500 ? 'server_error' : 'client_error'
    });
  }
}

/**
 * Record proxy request metrics
 */
function recordProxyRequest(service, method, path, statusCode, duration) {
  const labels = { service, method, path, status_code: statusCode };
  
  proxyRequestDuration.observe(labels, duration);
  proxyRequestTotal.inc(labels);
  
  if (statusCode >= 400) {
    proxyErrorsTotal.inc({
      service,
      error_type: statusCode >= 500 ? 'server_error' : 'client_error'
    });
  }
}

/**
 * Record proxy error
 */
function recordProxyError(service, errorType) {
  proxyErrorsTotal.inc({ service, error_type: errorType });
}

/**
 * Update circuit breaker state
 */
function updateCircuitBreakerState(service, state) {
  const stateValue = state === 'open' ? 1 : (state === 'half-open' ? 2 : 0);
  circuitBreakerState.set({ service }, stateValue);
}

/**
 * Record circuit breaker failure
 */
function recordCircuitBreakerFailure(service) {
  circuitBreakerFailures.inc({ service });
}

/**
 * Record rate limit hit
 */
function recordRateLimitHit(limitType, userId = 'anonymous') {
  rateLimitHits.inc({ limit_type: limitType, user_id: userId });
}

/**
 * Update active connections
 */
function updateActiveConnections(count) {
  activeConnectionsCount = count;
  activeConnections.set(count);
}

/**
 * Record authentication success
 */
function recordAuthenticationSuccess(authType) {
  authenticationSuccess.inc({ auth_type: authType });
}

/**
 * Record authentication failure
 */
function recordAuthenticationFailure(authType, reason) {
  authenticationFailure.inc({ auth_type: authType, reason });
}

/**
 * Get metrics endpoint
 */
function getMetricsEndpoint(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
}

/**
 * Middleware to track HTTP requests
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  // Increment active connections
  activeConnectionsCount++;
  updateActiveConnections(activeConnectionsCount);
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    recordHttpRequest(req.method, req.path, res.statusCode, duration);
    
    // Decrement active connections
    activeConnectionsCount = Math.max(0, activeConnectionsCount - 1);
    updateActiveConnections(activeConnectionsCount);
  });
  
  next();
}

/**
 * Reset all metrics (useful for testing)
 */
function resetMetrics() {
  register.resetMetrics();
  logger.info('Gateway metrics reset');
}

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  httpErrorsTotal,
  proxyRequestDuration,
  proxyRequestTotal,
  proxyErrorsTotal,
  circuitBreakerState,
  circuitBreakerFailures,
  rateLimitHits,
  activeConnections,
  activeConnectionsCount,
  authenticationSuccess,
  authenticationFailure,
  recordHttpRequest,
  recordProxyRequest,
  recordProxyError,
  updateCircuitBreakerState,
  recordCircuitBreakerFailure,
  recordRateLimitHit,
  updateActiveConnections,
  recordAuthenticationSuccess,
  recordAuthenticationFailure,
  getMetricsEndpoint,
  metricsMiddleware,
  resetMetrics
};
