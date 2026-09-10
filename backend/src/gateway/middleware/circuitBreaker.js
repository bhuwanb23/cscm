/**
 * Circuit Breaker Middleware for Gateway
 * Implements circuit breaker pattern using opossum
 */

const CircuitBreaker = require('opossum');
const logger = require('../../utils/logger');

// Circuit breaker configurations
const CIRCUIT_BREAKER_CONFIGS = {
  // Backend API circuit breaker
  backend: {
    timeout: 3000, // 3 seconds
    errorThresholdPercentage: 50, // Open after 50% failures
    resetTimeout: 30000, // Try again after 30 seconds
    rollingCountTimeout: 10000, // Consider last 10 seconds
    rollingCountBuckets: 10,
  },
  
  // AI/ML service circuit breaker
  aiMl: {
    timeout: 5000, // 5 seconds (AI/ML can be slower)
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
  }
};

/**
 * Create circuit breaker
 */
function createCircuitBreaker(serviceName, config) {
  const options = {
    timeout: config.timeout,
    errorThresholdPercentage: config.errorThresholdPercentage,
    resetTimeout: config.resetTimeout,
    rollingCountTimeout: config.rollingCountTimeout,
    rollingCountBuckets: config.rollingCountBuckets,
    fallback: () => {
      logger.warn(`Circuit breaker OPEN for ${serviceName}, using fallback`);
      return {
        status: 'fallback',
        message: `Service ${serviceName} is currently unavailable`,
        service: serviceName
      };
    }
  };

  const breaker = new CircuitBreaker(options);

  // Event logging
  breaker.on('open', () => {
    logger.error(`Circuit breaker OPEN for ${serviceName}`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker HALF-OPEN for ${serviceName}`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker CLOSED for ${serviceName}`);
  });

  breaker.on('fallback', (result) => {
    logger.warn(`Fallback used for ${serviceName}:`, result);
  });

  breaker.on('reject', (error) => {
    logger.error(`Request rejected by circuit breaker for ${serviceName}:`, error.message);
  });

  breaker.on('timeout', (error) => {
    logger.error(`Request timed out for ${serviceName}:`, error.message);
  });

  return breaker;
}

/**
 * Create circuit breakers for services
 */
const backendBreaker = createCircuitBreaker('Backend API', CIRCUIT_BREAKER_CONFIGS.backend);
const aiMlBreaker = createCircuitBreaker('AI/ML Service', CIRCUIT_BREAKER_CONFIGS.aiMl);

/**
 * Circuit breaker middleware factory
 */
function circuitBreakerMiddleware(breaker, serviceName) {
  return async (req, res, next) => {
    try {
      const result = await breaker.fire(req);
      
      if (result && result.status === 'fallback') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: result.message,
          service: serviceName,
          circuitBreakerState: breaker.opened ? 'open' : 'closed'
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Circuit breaker error for ${serviceName}:`, error);
      return res.status(503).json({
        error: 'Service Unavailable',
        message: `Circuit breaker error for ${serviceName}`,
        service: serviceName
      });
    }
  };
}

/**
 * Backend circuit breaker middleware
 */
const backendCircuitBreaker = circuitBreakerMiddleware(backendBreaker, 'Backend API');

/**
 * AI/ML circuit breaker middleware
 */
const aiMlCircuitBreaker = circuitBreakerMiddleware(aiMlBreaker, 'AI/ML Service');

/**
 * Get circuit breaker state
 */
function getCircuitBreakerState(serviceName) {
  const breakers = {
    'Backend API': backendBreaker,
    'AI/ML Service': aiMlBreaker
  };

  const breaker = breakers[serviceName];
  if (!breaker) {
    return null;
  }

  return {
    serviceName,
    state: breaker.opened ? 'open' : (breaker.halfOpen ? 'half-open' : 'closed'),
    stats: breaker.stats
  };
}

/**
 * Get all circuit breaker states
 */
function getAllCircuitBreakerStates() {
  return {
    'Backend API': getCircuitBreakerState('Backend API'),
    'AI/ML Service': getCircuitBreakerState('AI/ML Service')
  };
}

/**
 * Reset circuit breaker
 */
function resetCircuitBreaker(serviceName) {
  const breakers = {
    'Backend API': backendBreaker,
    'AI/ML Service': aiMlBreaker
  };

  const breaker = breakers[serviceName];
  if (breaker) {
    breaker.reset();
    logger.info(`Circuit breaker reset for ${serviceName}`);
  }
}

/**
 * Circuit breaker state endpoint middleware
 */
function circuitBreakerState(req, res) {
  const states = getAllCircuitBreakerStates();
  res.json({
    circuitBreakers: states,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  backendCircuitBreaker,
  aiMlCircuitBreaker,
  circuitBreakerMiddleware,
  getCircuitBreakerState,
  getAllCircuitBreakerStates,
  resetCircuitBreaker,
  circuitBreakerState
};
