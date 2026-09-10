/**
 * Response Formatter Utilities
 * Shared response formatting functions for consistent API responses
 */

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Formatted success response
 */
function successResponse(data, message = 'Success', metadata = {}) {
  return {
    success: true,
    message,
    data,
    ...metadata
  };
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} Formatted error response
 */
function errorResponse(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
  return {
    success: false,
    error: {
      message,
      code,
      statusCode,
      ...details
    }
  };
}

/**
 * Format validation error response
 * @param {Array<string>} errors - Validation errors
 * @returns {Object} Formatted validation error response
 */
function validationErrorResponse(errors) {
  return {
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: { errors }
    }
  };
}

/**
 * Format not found error response
 * @param {string} resource - Resource name
 * @param {string} identifier - Resource identifier
 * @returns {Object} Formatted not found error response
 */
function notFoundResponse(resource, identifier) {
  return {
    success: false,
    error: {
      message: `${resource} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
      details: { resource, identifier }
    }
  };
}

/**
 * Format unauthorized error response
 * @param {string} message - Error message
 * @returns {Object} Formatted unauthorized error response
 */
function unauthorizedResponse(message = 'Unauthorized access') {
  return {
    success: false,
    error: {
      message,
      code: 'UNAUTHORIZED',
      statusCode: 401
    }
  };
}

/**
 * Format forbidden error response
 * @param {string} message - Error message
 * @returns {Object} Formatted forbidden error response
 */
function forbiddenResponse(message = 'Access forbidden') {
  return {
    success: false,
    error: {
      message,
      code: 'FORBIDDEN',
      statusCode: 403
    }
  };
}

/**
 * Format conflict error response
 * @param {string} message - Error message
 * @returns {Object} Formatted conflict error response
 */
function conflictResponse(message = 'Resource conflict') {
  return {
    success: false,
    error: {
      message,
      code: 'CONFLICT',
      statusCode: 409
    }
  };
}

/**
 * Format paginated response
 * @param {Array} data - Data array
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} Formatted paginated response
 */
function paginatedResponse(data, pagination) {
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  };
}

/**
 * Format created response
 * @param {*} data - Created resource data
 * @param {string} resource - Resource name
 * @returns {Object} Formatted created response
 */
function createdResponse(data, resource = 'Resource') {
  return {
    success: true,
    message: `${resource} created successfully`,
    data
  };
}

/**
 * Format updated response
 * @param {*} data - Updated resource data
 * @param {string} resource - Resource name
 * @returns {Object} Formatted updated response
 */
function updatedResponse(data, resource = 'Resource') {
  return {
    success: true,
    message: `${resource} updated successfully`,
    data
  };
}

/**
 * Format deleted response
 * @param {string} resource - Resource name
 * @returns {Object} Formatted deleted response
 */
function deletedResponse(resource = 'Resource') {
  return {
    success: true,
    message: `${resource} deleted successfully`
  };
}

/**
 * Format rate limit exceeded response
 * @param {number} retryAfter - Seconds to wait before retry
 * @returns {Object} Formatted rate limit response
 */
function rateLimitResponse(retryAfter) {
  return {
    success: false,
    error: {
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      details: { retryAfter }
    }
  };
}

/**
 * Format service unavailable response
 * @param {string} service - Service name
 * @returns {Object} Formatted service unavailable response
 */
function serviceUnavailableResponse(service = 'Service') {
  return {
    success: false,
    error: {
      message: `${service} unavailable`,
      code: 'SERVICE_UNAVAILABLE',
      statusCode: 503
    }
  };
}

/**
 * Format degraded response
 * @param {*} data - Degraded data
 * @param {string} level - Degradation level
 * @returns {Object} Formatted degraded response
 */
function degradedResponse(data, level = 'partial') {
  return {
    success: true,
    data,
    degradation: true,
    level,
    message: `Service operating in ${level} degradation mode`
  };
}

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  paginatedResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  rateLimitResponse,
  serviceUnavailableResponse,
  degradedResponse
};