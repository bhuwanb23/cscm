/**
 * Resilience Module
 * Exports all resilience patterns: circuit breakers, fallbacks, retry logic, degradation strategies
 */

const {
  aiMlCircuitBreaker,
  redisCircuitBreaker,
  databaseCircuitBreaker,
  executeWithCircuitBreaker,
  getCircuitBreakerMetrics,
  getCircuitBreakerStatus,
  forceCircuitBreakerState,
  circuitBreakerOptions,
} = require('./circuitBreaker');

const {
  aiMlFallbacks,
  databaseFallbacks,
  redisFallbacks,
  getFallbackResponse,
  cacheFallbackResponse,
  getCachedFallbackResponse,
  clearFallbackCache,
  configureFallback,
  fallbackConfig,
} = require('./fallbacks');

const {
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
  retryableNetworkErrors,
} = require('./retry');

const {
  DegradationLevel,
  setDegradationLevel,
  getDegradationState,
  isServiceDegraded,
  markServiceDegraded,
  markServiceRecovered,
  shouldFeatureBeEnabled,
  getDegradedResponse,
  getDegradationEvents,
  startAutoRecovery,
  stopAutoRecovery,
  determineDegradationLevel,
  serviceDependencies,
} = require('./degradation');

module.exports = {
  // Circuit Breakers
  aiMlCircuitBreaker,
  redisCircuitBreaker,
  databaseCircuitBreaker,
  executeWithCircuitBreaker,
  getCircuitBreakerMetrics,
  getCircuitBreakerStatus,
  forceCircuitBreakerState,
  circuitBreakerOptions,

  // Fallbacks
  aiMlFallbacks,
  databaseFallbacks,
  redisFallbacks,
  getFallbackResponse,
  cacheFallbackResponse,
  getCachedFallbackResponse,
  clearFallbackCache,
  configureFallback,
  fallbackConfig,

  // Retry
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
  retryableNetworkErrors,

  // Degradation
  DegradationLevel,
  setDegradationLevel,
  getDegradationState,
  isServiceDegraded,
  markServiceDegraded,
  markServiceRecovered,
  shouldFeatureBeEnabled,
  getDegradedResponse,
  getDegradationEvents,
  startAutoRecovery,
  stopAutoRecovery,
  determineDegradationLevel,
  serviceDependencies,
};
