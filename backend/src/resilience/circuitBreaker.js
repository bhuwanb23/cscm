const CircuitBreaker = require('opossum');
const logger = require('../utils/logger');

/**
 * Circuit Breaker Configuration
 * Defines timeout, error thresholds, and reset timeout for circuit breakers
 */
const circuitBreakerOptions = {
  timeout: 3000, // 3 seconds timeout
  errorThresholdPercentage: 50, // Open circuit after 50% failures
  resetTimeout: 60000, // Reset after 60 seconds
  rollingCountTimeout: 10000, // Consider last 10 seconds
  rollingCountBuckets: 10
};

/**
 * Circuit Breaker States
 * CLOSED: Normal operation, requests pass through
 * OPEN: Circuit is open, requests fail fast
 * HALF_OPEN: Testing if service has recovered
 */

/**
 * AI/ML Service Circuit Breaker
 * Protects against failures in the Python AI/ML service
 */
const aiMlCircuitBreaker = new CircuitBreaker({
  ...circuitBreakerOptions,
  name: 'AI/ML Service Circuit Breaker',
  fallback: async () => {
    logger.warn('AI/ML service circuit breaker - using fallback');
    return {
      success: false,
      error: 'AI/ML service unavailable',
      fallback: true,
      data: null
    };
  }
});

/**
 * Redis Circuit Breaker
 * Protects against Redis connection failures
 */
const redisCircuitBreaker = new CircuitBreaker({
  ...circuitBreakerOptions,
  name: 'Redis Circuit Breaker',
  fallback: async () => {
    logger.warn('Redis circuit breaker - using fallback');
    return {
      success: false,
      error: 'Redis service unavailable',
      fallback: true,
      data: null
    };
  }
});

/**
 * Database Circuit Breaker
 * Protects against database connection failures
 */
const databaseCircuitBreaker = new CircuitBreaker({
  ...circuitBreakerOptions,
  name: 'Database Circuit Breaker',
  fallback: async () => {
    logger.warn('Database circuit breaker - using fallback');
    return {
      success: false,
      error: 'Database service unavailable',
      fallback: true,
      data: null
    };
  }
});

/**
 * Circuit Breaker Event Handlers
 * Monitor circuit state changes and emit metrics
 */
function setupCircuitBreakerEvents(circuitBreaker, serviceName) {
  circuitBreaker.on('open', () => {
    logger.error(`Circuit breaker OPEN for ${serviceName} - failing fast`);
    // Emit metric for circuit state change
    emitCircuitBreakerMetric(serviceName, 'open');
  });

  circuitBreaker.on('halfOpen', () => {
    logger.warn(`Circuit breaker HALF-OPEN for ${serviceName} - testing recovery`);
    emitCircuitBreakerMetric(serviceName, 'half-open');
  });

  circuitBreaker.on('close', () => {
    logger.info(`Circuit breaker CLOSED for ${serviceName} - normal operation`);
    emitCircuitBreakerMetric(serviceName, 'closed');
  });

  circuitBreaker.on('fallback', (result) => {
    logger.warn(`Circuit breaker fallback for ${serviceName}:`, result);
    emitCircuitBreakerMetric(serviceName, 'fallback');
  });

  circuitBreaker.on('success', (result) => {
    logger.debug(`Circuit breaker success for ${serviceName}`);
    emitCircuitBreakerMetric(serviceName, 'success');
  });

  circuitBreaker.on('failure', (error) => {
    logger.error(`Circuit breaker failure for ${serviceName}:`, error.message);
    emitCircuitBreakerMetric(serviceName, 'failure');
  });
}

/**
 * Emit Circuit Breaker Metrics
 * Send circuit breaker state metrics to monitoring system
 */
function emitCircuitBreakerMetric(serviceName, state) {
  try {
    // This would integrate with Prometheus or other monitoring systems
    // For now, we'll log the metric
    const metric = {
      service: serviceName,
      state: state,
      timestamp: new Date().toISOString()
    };
    
    // Store metric for monitoring endpoint
    if (!global.circuitBreakerMetrics) {
      global.circuitBreakerMetrics = [];
    }
    global.circuitBreakerMetrics.push(metric);
    
    // Keep only last 100 metrics
    if (global.circuitBreakerMetrics.length > 100) {
      global.circuitBreakerMetrics = global.circuitBreakerMetrics.slice(-100);
    }
    
    logger.debug(`Circuit breaker metric: ${JSON.stringify(metric)}`);
  } catch (error) {
    logger.error('Failed to emit circuit breaker metric:', error);
  }
}

/**
 * Get Circuit Breaker Metrics
 * Returns current circuit breaker metrics for monitoring
 */
function getCircuitBreakerMetrics() {
  return global.circuitBreakerMetrics || [];
}

/**
 * Get Circuit Breaker Status
 * Returns the current status of all circuit breakers
 */
function getCircuitBreakerStatus() {
  return {
    aiMl: {
      state: aiMlCircuitBreaker.opened ? 'open' : (aiMlCircuitBreaker.halfOpen ? 'half-open' : 'closed'),
      stats: aiMlCircuitBreaker.stats
    },
    redis: {
      state: redisCircuitBreaker.opened ? 'open' : (redisCircuitBreaker.halfOpen ? 'half-open' : 'closed'),
      stats: redisCircuitBreaker.stats
    },
    database: {
      state: databaseCircuitBreaker.opened ? 'open' : (databaseCircuitBreaker.halfOpen ? 'half-open' : 'closed'),
      stats: databaseCircuitBreaker.stats
    }
  };
}

/**
 * Execute Function with Circuit Breaker Protection
 * Generic wrapper to execute any function with circuit breaker protection
 */
async function executeWithCircuitBreaker(circuitBreaker, fn, context = 'unknown') {
  try {
    const result = await circuitBreaker.fire(fn);
    return result;
  } catch (error) {
    logger.error(`Circuit breaker error in ${context}:`, error);
    throw error;
  }
}

/**
 * Force Circuit Breaker State (for testing/manual control)
 * Allows manual control of circuit breaker state
 */
function forceCircuitBreakerState(circuitBreaker, state) {
  switch (state) {
    case 'open':
      circuitBreaker.open();
      logger.warn(`Manually opened circuit breaker`);
      break;
    case 'close':
      circuitBreaker.close();
      logger.info(`Manually closed circuit breaker`);
      break;
    case 'halfOpen':
      circuitBreaker.halfOpen();
      logger.warn(`Manually set circuit breaker to half-open`);
      break;
    default:
      throw new Error(`Invalid circuit breaker state: ${state}`);
  }
}

// Setup event handlers for all circuit breakers
setupCircuitBreakerEvents(aiMlCircuitBreaker, 'AI/ML Service');
setupCircuitBreakerEvents(redisCircuitBreaker, 'Redis');
setupCircuitBreakerEvents(databaseCircuitBreaker, 'Database');

module.exports = {
  aiMlCircuitBreaker,
  redisCircuitBreaker,
  databaseCircuitBreaker,
  executeWithCircuitBreaker,
  getCircuitBreakerMetrics,
  getCircuitBreakerStatus,
  forceCircuitBreakerState,
  circuitBreakerOptions
};