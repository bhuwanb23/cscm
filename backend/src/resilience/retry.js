const logger = require('../utils/logger');

/**
 * Retry Configuration
 * Defines retry policies for different scenarios
 */
const retryConfig = {
  default: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitter: true
  },
  network: {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 1.5,
    jitter: true
  },
  database: {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitter: false
  },
  aiMl: {
    maxAttempts: 2,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitter: true
  }
};

/**
 * Retryable HTTP Status Codes
 * HTTP status codes that should trigger a retry
 */
const retryableStatusCodes = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  499 // Client Closed Request
];

/**
 * Retryable Network Errors
 * Error codes that should trigger a retry
 */
const retryableNetworkErrors = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'EHOSTUNREACH'
];

/**
 * Calculate Delay with Exponential Backoff and Jitter
 * Implements exponential backoff with optional jitter to prevent thundering herd
 */
function calculateDelay(attempt, config) {
  const baseDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(baseDelay, config.maxDelayMs);
  
  if (config.jitter) {
    // Add random jitter (±25%)
    const jitterFactor = 0.25;
    const jitterAmount = cappedDelay * jitterFactor;
    const randomJitter = (Math.random() * 2 - 1) * jitterAmount;
    return Math.max(0, Math.round(cappedDelay + randomJitter));
  }
  
  return cappedDelay;
}

/**
 * Check if Error is Retryable
 * Determines if an error should trigger a retry based on type and status
 */
function isRetryableError(error, config) {
  // Check for network errors
  if (error.code && retryableNetworkErrors.includes(error.code)) {
    return true;
  }
  
  // Check for HTTP status codes
  if (error.response && error.response.status) {
    return retryableStatusCodes.includes(error.response.status);
  }
  
  // Check for timeout errors
  if (error.message && error.message.includes('timeout')) {
    return true;
  }
  
  // Check for ECONNRESET
  if (error.message && error.message.includes('ECONNRESET')) {
    return true;
  }
  
  return false;
}

/**
 * Retry Function with Exponential Backoff
 * Generic retry wrapper for any async function
 */
async function retry(fn, options = {}) {
  const config = options.config || retryConfig.default;
  const maxAttempts = options.maxAttempts || config.maxAttempts;
  const onRetry = options.onRetry || null;
  const onFinalFailure = options.onFinalFailure || null;
  const context = options.context || 'unknown';
  
  let lastError = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      logger.debug(`Retry attempt ${attempt + 1}/${maxAttempts} for ${context}`);
      const result = await fn();
      
      if (attempt > 0) {
        logger.info(`Retry succeeded for ${context} on attempt ${attempt + 1}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (!isRetryableError(error, config)) {
        logger.error(`Non-retryable error for ${context}:`, error.message);
        throw error;
      }
      
      // Check if we've exhausted retries
      if (attempt === maxAttempts - 1) {
        logger.error(`Max retries (${maxAttempts}) exhausted for ${context}`);
        if (onFinalFailure) {
          onFinalFailure(error, attempt + 1);
        }
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      logger.warn(`Retry ${attempt + 1}/${maxAttempts} for ${context} failed, retrying in ${delay}ms: ${error.message}`);
      
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      
      await sleep(delay);
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Retry HTTP Request
 * Retry wrapper specifically for HTTP requests using axios
 */
async function retryHttpRequest(axiosInstance, config, options = {}) {
  const retryOptions = {
    ...options,
    context: `HTTP ${config.method || 'GET'} ${config.url}`
  };
  
  return retry(async () => {
    return await axiosInstance(config);
  }, retryOptions);
}

/**
 * Retry Database Operation
 * Retry wrapper specifically for database operations
 */
async function retryDatabaseOperation(fn, options = {}) {
  const retryOptions = {
    ...options,
    config: retryConfig.database,
    context: 'database operation'
  };
  
  return retry(fn, retryOptions);
}

/**
 * Retry AI/ML Service Call
 * Retry wrapper specifically for AI/ML service calls
 */
async function retryAiMlCall(fn, options = {}) {
  const retryOptions = {
    ...options,
    config: retryConfig.aiMl,
    context: 'AI/ML service call'
  };
  
  return retry(fn, retryOptions);
}

/**
 * Sleep Utility
 * Helper function to pause execution
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get Retry Metrics
 * Returns metrics about retry operations
 */
const retryMetrics = {
  totalAttempts: 0,
  successfulRetries: 0,
  failedRetries: 0,
  totalDelayMs: 0
};

/**
 * Record Retry Metric
 * Records retry operation metrics
 */
function recordRetryMetric(attempt, success, delay) {
  retryMetrics.totalAttempts++;
  if (success) {
    retryMetrics.successfulRetries++;
  } else {
    retryMetrics.failedRetries++;
  }
  retryMetrics.totalDelayMs += delay;
}

/**
 * Get Retry Metrics
 * Returns current retry metrics
 */
function getRetryMetrics() {
  return {
    ...retryMetrics,
    averageDelayMs: retryMetrics.totalAttempts > 0 
      ? retryMetrics.totalDelayMs / retryMetrics.totalAttempts 
      : 0
  };
}

/**
 * Reset Retry Metrics
 * Resets retry metrics counters
 */
function resetRetryMetrics() {
  retryMetrics.totalAttempts = 0;
  retryMetrics.successfulRetries = 0;
  retryMetrics.failedRetries = 0;
  retryMetrics.totalDelayMs = 0;
  logger.info('Retry metrics reset');
}

/**
 * Retry with Idempotency Check
 * Retry wrapper that checks if operation is idempotent before retrying
 */
async function retryWithIdempotencyCheck(fn, isIdempotent, options = {}) {
  const config = options.config || retryConfig.default;
  
  if (!isIdempotent) {
    logger.warn('Operation is not idempotent, retrying once only');
    return retry(fn, { ...options, maxAttempts: 1 });
  }
  
  return retry(fn, options);
}

/**
 * Configurable Retry Policy
 * Allows runtime configuration of retry behavior
 */
function configureRetry(configName, customConfig) {
  if (retryConfig[configName]) {
    Object.assign(retryConfig[configName], customConfig);
    logger.info(`Retry configuration updated for ${configName}:`, retryConfig[configName]);
  } else {
    logger.warn(`Unknown retry configuration: ${configName}`);
  }
}

module.exports = {
  retry,
  retryHttpRequest,
  retryDatabaseOperation,
  retryAiMlCall,
  retryConfig,
  isRetryableError,
  calculateDelay,
  sleep,
  getRetryMetrics,
  resetRetryMetrics,
  retryWithIdempotencyCheck,
  configureRetry,
  retryableStatusCodes,
  retryableNetworkErrors
};