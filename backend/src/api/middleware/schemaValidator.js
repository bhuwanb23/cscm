/**
 * Schema validation middleware using AJV
 * Validates request bodies against JSON schemas to prevent injection and mass assignment
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const logger = require('../../utils/logger');

// Initialize AJV with formats
const ajv = new Ajv({ 
  allErrors: true, 
  strict: false,
  coerceTypes: true 
});
addFormats(ajv);

// JSON schemas for API endpoints
const schemas = {
  // Registration schema
  register: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      email: {
        type: 'string',
        format: 'email'
      },
      password: {
        type: 'string',
        minLength: 12
      }
    },
    additionalProperties: false
  },

  // Login schema
  login: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: {
        type: 'string',
        minLength: 1
      },
      password: {
        type: 'string',
        minLength: 1
      }
    },
    additionalProperties: false
  },

  // Order creation schema
  createOrder: {
    type: 'object',
    required: ['storeId', 'productId', 'quantity'],
    properties: {
      storeId: {
        type: 'string'
      },
      productId: {
        type: 'string'
      },
      quantity: {
        type: 'number',
        minimum: 1,
        maximum: 10000
      },
      notes: {
        type: 'string',
        maxLength: 500
      }
    },
    additionalProperties: false
  },

  // Shipment creation schema
  createShipment: {
    type: 'object',
    required: ['orderId', 'origin', 'destination'],
    properties: {
      orderId: {
        type: 'string'
      },
      origin: {
        type: 'object',
        required: ['address', 'city', 'state', 'zipCode'],
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' }
        },
        additionalProperties: false
      },
      destination: {
        type: 'object',
        required: ['address', 'city', 'state', 'zipCode'],
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' }
        },
        additionalProperties: false
      },
      carrier: {
        type: 'string'
      },
      trackingNumber: {
        type: 'string'
      }
    },
    additionalProperties: false
  },

  // Shipment update schema
  updateShipment: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'in_transit', 'delivered', 'cancelled']
      },
      carrier: {
        type: 'string'
      },
      trackingNumber: {
        type: 'string'
      },
      estimatedDelivery: {
        type: 'string',
        format: 'date-time'
      }
    },
    additionalProperties: false
  },

  // Order status update schema
  updateOrder: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
      }
    },
    additionalProperties: false
  }
};

// Compile validators
const validators = {};
for (const [name, schema] of Object.entries(schemas)) {
  validators[name] = ajv.compile(schema);
}

/**
 * Schema validation middleware factory
 * @param {string} schemaName - Name of the schema to use
 * @returns {Function} Express middleware
 */
function validateSchema(schemaName) {
  const validate = validators[schemaName];
  
  if (!validate) {
    logger.error(`Schema '${schemaName}' not found`);
    return (req, res, next) => {
      res.status(500).json({
        success: false,
        error: 'Validation configuration error'
      });
    };
  }

  return (req, res, next) => {
    // Only validate POST, PUT, PATCH requests with bodies
    if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !req.body) {
      return next();
    }

    const valid = validate(req.body);

    if (!valid) {
      const errors = validate.errors.map(err => ({
        field: err.instancePath || err.schemaPath,
        message: err.message,
        value: err.data
      }));

      logger.warn(`Schema validation failed for ${schemaName}:`, errors);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
}

module.exports = {
  validateSchema,
  schemas
};
