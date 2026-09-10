const logger = require('./logger');

/**
 * Validation Utilities
 * Shared validation functions for consistent data validation across the application
 */

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} Validation result with isValid and errors
 */
function validateRequiredFields(data, requiredFields) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
function validatePhone(phone) {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone);
}

/**
 * Validate numeric value within range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} True if value is within range
 */
function validateRange(value, min, max) {
  const numValue = Number(value);
  return !isNaN(numValue) && numValue >= min && numValue <= max;
}

/**
 * Validate positive number
 * @param {number} value - Value to validate
 * @returns {boolean} True if value is positive
 */
function validatePositiveNumber(value) {
  const numValue = Number(value);
  return !isNaN(numValue) && numValue > 0;
}

/**
 * Validate non-negative number
 * @param {number} value - Value to validate
 * @returns {boolean} True if value is non-negative
 */
function validateNonNegativeNumber(value) {
  const numValue = Number(value);
  return !isNaN(numValue) && numValue >= 0;
}

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date format
 */
function validateDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID format
 */
function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if string length is within range
 */
function validateStringLength(str, min, max) {
  if (typeof str !== 'string') return false;
  return str.length >= min && str.length <= max;
}

/**
 * Validate enum value
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @returns {boolean} True if value is in allowed values
 */
function validateEnum(value, allowedValues) {
  return allowedValues.includes(value);
}

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Validate and sanitize object
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result with isValid, errors, and sanitized data
 */
function validateObject(obj, schema) {
  const errors = [];
  const sanitized = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];
    
    // Check if required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip validation if not required and value is missing
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
      continue;
    }
    
    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors.push(`${field} is invalid`);
      continue;
    }
    
    // Sanitization
    if (rules.type === 'string') {
      sanitized[field] = rules.sanitize ? sanitizeString(value) : value;
    } else {
      sanitized[field] = value;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validated pagination parameters
 */
function validatePagination(params) {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * Validate sort parameters
 * @param {Object} params - Sort parameters
 * @param {Array<string>} allowedFields - Allowed sort fields
 * @returns {Object} Validated sort parameters
 */
function validateSort(params, allowedFields) {
  const sortBy = params.sortBy || 'id';
  const sortOrder = (params.sortOrder || 'asc').toLowerCase();
  
  if (!allowedFields.includes(sortBy)) {
    return { sortBy: 'id', sortOrder: 'asc' };
  }
  
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    return { sortBy, sortOrder: 'asc' };
  }
  
  return { sortBy, sortOrder };
}

module.exports = {
  validateRequiredFields,
  validateEmail,
  validatePhone,
  validateRange,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateDate,
  validateUUID,
  validateStringLength,
  validateEnum,
  sanitizeString,
  validateObject,
  validatePagination,
  validateSort
};