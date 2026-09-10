/**
 * Request Validation Middleware for Backend API
 * Provides centralized request validation using AJV schemas
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const logger = require('../../utils/logger');

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Request/response schemas
const schemas = {
  // Inventory schemas
  inventoryItem: {
    type: 'object',
    required: ['product_id', 'store_id', 'quantity'],
    properties: {
      product_id: { type: 'string', minLength: 1 },
      store_id: { type: 'string', minLength: 1 },
      quantity: { type: 'integer', minimum: 0 },
      reserved_quantity: { type: 'integer', minimum: 0 },
      min_stock_level: { type: 'integer', minimum: 0 },
      max_stock_level: { type: 'integer', minimum: 0 },
      unit_cost: { type: 'number', minimum: 0 },
      selling_price: { type: 'number', minimum: 0 }
    }
  },

  // Order schemas
  order: {
    type: 'object',
    required: ['order_id', 'store_id'],
    properties: {
      order_id: { type: 'string', minLength: 1 },
      store_id: { type: 'string', minLength: 1 },
      customer_id: { type: 'string' },
      total_amount: { type: 'number', minimum: 0 },
      status: { 
        type: 'string', 
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['product_id', 'quantity'],
          properties: {
            product_id: { type: 'string', minLength: 1 },
            quantity: { type: 'integer', minimum: 1 },
            unit_price: { type: 'number', minimum: 0 }
          }
        }
      }
    }
  },

  // Shipment schemas
  shipment: {
    type: 'object',
    required: ['order_id', 'tracking_number'],
    properties: {
      order_id: { type: 'string', minLength: 1 },
      tracking_number: { type: 'string', minLength: 1 },
      carrier: { type: 'string', minLength: 1 },
      status: { 
        type: 'string', 
        enum: ['pending', 'in_transit', 'delivered', 'cancelled']
      },
      origin: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' }
        }
      },
      destination: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' }
        }
      },
      estimated_delivery: { type: 'string', format: 'date-time' },
      actual_delivery: { type: 'string', format: 'date-time' }
    }
  },

  // Event schemas
  event: {
    type: 'object',
    required: ['event_type', 'source'],
    properties: {
      event_type: { type: 'string', minLength: 1 },
      source: { type: 'string', minLength: 1 },
      data: { type: 'object' },
      user_id: { type: 'string' }
    }
  },

  // Auth schemas
  login: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 }
    }
  },

  register: {
    type: 'object',
    required: ['email', 'password', 'role'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      role: { 
        type: 'string', 
        enum: ['shopkeeper', 'transporter', 'wholesaler']
      },
      name: { type: 'string', minLength: 1 }
    }
  }
};

// Compile schemas
const compiledSchemas = {};
for (const [name, schema] of Object.entries(schemas)) {
  compiledSchemas[name] = ajv.compile(schema);
}

/**
 * Sanitize request data
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove potential XSS attempts
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate request against schema
 */
function validateRequest(schemaName) {
  const validate = compiledSchemas[schemaName];
  
  if (!validate) {
    logger.error(`Schema ${schemaName} not found`);
    return (req, res, next) => {
      logger.error(`Validation schema ${schemaName} not found`);
      next();
    };
  }

  return (req, res, next) => {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeData(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeData(req.query);
    }

    // Validate request body
    const isValid = validate(req.body);
    
    if (!isValid) {
      const errors = validate.errors.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message,
        params: error.params
      }));

      logger.warn(`Validation failed for ${schemaName}:`, errors);
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errors
      });
    }

    next();
  };
}

/**
 * Validate query parameters
 */
function validateQuery(schemaName) {
  const validate = compiledSchemas[schemaName];
  
  if (!validate) {
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeData(req.query);
    }

    // Validate query parameters
    const isValid = validate(req.query);
    
    if (!isValid) {
      const errors = validate.errors.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Query parameter validation failed',
        details: errors
      });
    }

    next();
  };
}

/**
 * Validate path parameters
 */
function validateParams(schemaName) {
  const validate = compiledSchemas[schemaName];
  
  if (!validate) {
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    // Sanitize path parameters
    if (req.params) {
      req.params = sanitizeData(req.params);
    }

    // Validate path parameters
    const isValid = validate(req.params);
    
    if (!isValid) {
      const errors = validate.errors.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Path parameter validation failed',
        details: errors
      });
    }

    next();
  };
}

/**
 * Add custom schema
 */
function addSchema(name, schema) {
  try {
    compiledSchemas[name] = ajv.compile(schema);
    logger.info(`Added custom schema: ${name}`);
  } catch (error) {
    logger.error(`Failed to add schema ${name}:`, error);
  }
}

/**
 * Get schema validation errors
 */
function getValidationErrors(schemaName, data) {
  const validate = compiledSchemas[schemaName];
  if (!validate) {
    return null;
  }

  const isValid = validate(data);
  if (isValid) {
    return null;
  }

  return validate.errors.map(error => ({
    field: error.instancePath || error.schemaPath,
    message: error.message,
    params: error.params
  }));
}

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  addSchema,
  getValidationErrors,
  sanitizeData,
  schemas,
  compiledSchemas
};
