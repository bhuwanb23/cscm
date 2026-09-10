/**
 * Custom Error Classes
 * Standardized error classes for consistent error handling across the application
 */

/**
 * Base Application Error
 * All custom errors extend from this base class
 */
class AppError extends Error {
  constructor(message, code = 'APP_ERROR', statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation Error
 * Thrown when input validation fails
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Not Found Error
 * Thrown when a requested resource is not found
 */
class NotFoundError extends AppError {
  constructor(resource, identifier = null) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, identifier });
  }
}

/**
 * Unauthorized Error
 * Thrown when authentication fails or is missing
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * Forbidden Error
 * Thrown when user lacks permission to access a resource
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * Conflict Error
 * Thrown when a resource conflict occurs (e.g., duplicate entry)
 */
class ConflictError extends AppError {
  constructor(message, details = {}) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Rate Limit Error
 * Thrown when rate limit is exceeded
 */
class RateLimitError extends AppError {
  constructor(retryAfter, message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
  }
}

/**
 * Service Unavailable Error
 * Thrown when a dependent service is unavailable
 */
class ServiceUnavailableError extends AppError {
  constructor(service, message = null) {
    const msg = message || `${service} service unavailable`;
    super(msg, 'SERVICE_UNAVAILABLE', 503, { service });
  }
}

/**
 * Database Error
 * Thrown when database operations fail
 */
class DatabaseError extends AppError {
  constructor(message, details = {}) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * External Service Error
 * Thrown when external API calls fail
 */
class ExternalServiceError extends AppError {
  constructor(service, message = null, details = {}) {
    const msg = message || `External service '${service}' error`;
    super(msg, 'EXTERNAL_SERVICE_ERROR', 502, { service, ...details });
  }
}

/**
 * Configuration Error
 * Thrown when configuration is invalid or missing
 */
class ConfigurationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}

/**
 * Timeout Error
 * Thrown when an operation times out
 */
class TimeoutError extends AppError {
  constructor(operation, timeout) {
    const message = `Operation '${operation}' timed out after ${timeout}ms`;
    super(message, 'TIMEOUT_ERROR', 504, { operation, timeout });
  }
}

/**
 * Circuit Breaker Error
 * Thrown when circuit breaker is open
 */
class CircuitBreakerError extends AppError {
  constructor(service, message = null) {
    const msg = message || `Circuit breaker open for service '${service}'`;
    super(msg, 'CIRCUIT_BREAKER_OPEN', 503, { service });
  }
}

/**
 * Retry Exhausted Error
 * Thrown when retry attempts are exhausted
 */
class RetryExhaustedError extends AppError {
  constructor(operation, attempts, lastError) {
    const message = `Operation '${operation}' failed after ${attempts} retry attempts`;
    super(message, 'RETRY_EXHAUSTED', 503, { operation, attempts, lastError: lastError.message });
  }
}

/**
 * Degraded Service Error
 * Thrown when service is operating in degraded mode
 */
class DegradedServiceError extends AppError {
  constructor(service, level, message = null) {
    const msg = message || `Service '${service}' operating in ${level} degradation mode`;
    super(msg, 'DEGRADED_SERVICE', 503, { service, level });
  }
}

/**
 * Invalid State Error
 * Thrown when an operation is invalid for the current state
 */
class InvalidStateError extends AppError {
  constructor(message, currentState = null) {
    super(message, 'INVALID_STATE', 400, { currentState });
  }
}

/**
 * Parse Error
 * Thrown when data parsing fails
 */
class ParseError extends AppError {
  constructor(message, details = {}) {
    super(message, 'PARSE_ERROR', 400, details);
  }
}

/**
 * Authentication Error
 * Thrown when authentication credentials are invalid
 */
class AuthenticationError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

/**
 * Authorization Error
 * Thrown when user lacks required permissions
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

/**
 * Input Error
 * Thrown when input data is invalid
 */
class InputError extends AppError {
  constructor(message, field = null) {
    super(message, 'INPUT_ERROR', 400, { field });
  }
}

/**
 * Cache Error
 * Thrown when cache operations fail
 */
class CacheError extends AppError {
  constructor(message, details = {}) {
    super(message, 'CACHE_ERROR', 500, details);
  }
}

/**
 * Message Queue Error
 * Thrown when message queue operations fail
 */
class MessageQueueError extends AppError {
  constructor(message, details = {}) {
    super(message, 'MESSAGE_QUEUE_ERROR', 500, details);
  }
}

/**
 * Health Check Error
 * Thrown when health check fails
 */
class HealthCheckError extends AppError {
  constructor(service, message = null) {
    const msg = message || `Health check failed for service '${service}'`;
    super(msg, 'HEALTH_CHECK_ERROR', 503, { service });
  }
}

/**
 * Format error for API response
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error) {
  // If it's already an AppError, use its toJSON method
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.toJSON()
    };
  }
  
  // For standard JavaScript errors
  return {
    success: false,
    error: {
      name: error.name,
      message: error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Check if error is operational (expected) vs programming error
 * @param {Error} error - Error object
 * @returns {boolean} True if error is operational
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  
  // Consider certain built-in errors as operational
  const operationalErrors = [
    'ValidationError',
    'NotFoundError',
    'UnauthorizedError',
    'ForbiddenError',
    'ConflictError',
    'RateLimitError'
  ];
  
  return operationalErrors.includes(error.name);
}

/**
 * Get appropriate HTTP status code for error
 * @param {Error} error - Error object
 * @returns {number} HTTP status code
 */
function getErrorStatusCode(error) {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  
  // Default status codes for standard errors
  const statusCodeMap = {
    'ValidationError': 400,
    'NotFoundError': 404,
    'UnauthorizedError': 401,
    'ForbiddenError': 403,
    'ConflictError': 409,
    'RateLimitError': 429
  };
  
  return statusCodeMap[error.name] || 500;
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  ConfigurationError,
  TimeoutError,
  CircuitBreakerError,
  RetryExhaustedError,
  DegradedServiceError,
  InvalidStateError,
  ParseError,
  AuthenticationError,
  AuthorizationError,
  InputError,
  CacheError,
  MessageQueueError,
  HealthCheckError,
  formatErrorResponse,
  isOperationalError,
  getErrorStatusCode
};