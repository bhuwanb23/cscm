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
  // NOTE: fields mirror orderController.create which reads
  // { order_id, store_id, customer_id, total_amount, status, items }.
  createOrder: {
    type: 'object',
    required: ['order_id', 'store_id'],
    properties: {
      order_id: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      store_id: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      customer_id: {
        type: 'string',
        maxLength: 100
      },
      total_amount: {
        type: 'number',
        minimum: 0
      },
      status: {
        type: 'string',
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
      },
      items: {
        type: 'array',
        maxItems: 500,
        items: {
          type: 'object',
          properties: {
            product_id: { type: 'string' },
            quantity: { type: 'number', minimum: 1 },
            unit_price: { type: 'number', minimum: 0 }
          }
        }
      }
    },
    additionalProperties: false
  },

  // Shipment creation schema
  // NOTE: fields mirror shipmentController.create which reads
  // { shipment_id, order_id, from_location, to_location, status, carrier,
  //   tracking_number, estimated_delivery, items }.
  createShipment: {
    type: 'object',
    required: ['shipment_id', 'from_location', 'to_location'],
    properties: {
      shipment_id: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      order_id: {
        type: 'string',
        maxLength: 100
      },
      from_location: {
        type: 'string',
        minLength: 1,
        maxLength: 200
      },
      to_location: {
        type: 'string',
        minLength: 1,
        maxLength: 200
      },
      status: {
        type: 'string',
        enum: ['pending', 'in_transit', 'delivered', 'cancelled']
      },
      carrier: {
        type: 'string',
        maxLength: 100
      },
      tracking_number: {
        type: 'string',
        maxLength: 100
      },
      estimated_delivery: {
        type: 'string'
      },
      items: {
        type: 'array',
        maxItems: 500,
        items: {
          type: 'object'
        }
      }
    },
    additionalProperties: false
  },

  // Shipment update schema (mirrors shipmentController.updateStatus fields)
  updateShipment: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'in_transit', 'delivered', 'cancelled']
      },
      carrier: {
        type: 'string',
        maxLength: 100
      },
      tracking_number: {
        type: 'string',
        maxLength: 100
      },
      estimated_delivery: {
        type: 'string'
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
