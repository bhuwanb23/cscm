// Event schemas for CSCM messaging system
const Ajv = require('ajv');
const logger = require('../utils/logger');

// Initialize AJV validator
const ajv = new Ajv({
  allErrors: true,
  strict: false
});

// Add format support
ajv.addFormat('date-time', true);

// Telemetry event schema
const telemetryEventSchema = {
  type: 'object',
  properties: {
    sourceId: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    eventType: { type: 'string' },
    payload: { type: 'object' }
  },
  required: ['sourceId', 'timestamp', 'eventType'],
  additionalProperties: true
};

// Order event schema
const orderEventSchema = {
  type: 'object',
  properties: {
    orderId: { type: 'string' },
    customerId: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'number' },
          price: { type: 'number' }
        },
        required: ['productId', 'quantity', 'price']
      }
    },
    totalAmount: { type: 'number' },
    status: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' }
  },
  required: ['orderId', 'customerId', 'items', 'totalAmount', 'status', 'timestamp'],
  additionalProperties: false
};

// Inventory event schema
const inventoryEventSchema = {
  type: 'object',
  properties: {
    productId: { type: 'string' },
    storeId: { type: 'string' },
    quantity: { type: 'number' },
    eventType: { 
      type: 'string',
      enum: ['STOCK_UPDATE', 'LOW_STOCK_ALERT', 'OUT_OF_STOCK', 'RESTOCK']
    },
    timestamp: { type: 'string', format: 'date-time' }
  },
  required: ['productId', 'storeId', 'quantity', 'eventType', 'timestamp'],
  additionalProperties: false
};

// Agent action event schema
const agentActionEventSchema = {
  type: 'object',
  properties: {
    agentId: { type: 'string' },
    actionType: { type: 'string' },
    payload: { type: 'object' },
    timestamp: { type: 'string', format: 'date-time' },
    result: { type: 'object' }
  },
  required: ['agentId', 'actionType', 'payload', 'timestamp'],
  additionalProperties: false
};

// Compile schemas for validation
const validateTelemetryEvent = ajv.compile(telemetryEventSchema);
const validateOrderEvent = ajv.compile(orderEventSchema);
const validateInventoryEvent = ajv.compile(inventoryEventSchema);
const validateAgentActionEvent = ajv.compile(agentActionEventSchema);

// Validation function
function validateEvent(event, schemaType) {
  let validator;
  
  switch (schemaType) {
    case 'telemetry':
      validator = validateTelemetryEvent;
      break;
    case 'order':
      validator = validateOrderEvent;
      break;
    case 'inventory':
      validator = validateInventoryEvent;
      break;
    case 'agent':
      validator = validateAgentActionEvent;
      break;
    default:
      throw new Error(`Unknown schema type: ${schemaType}`);
  }
  
  const isValid = validator(event);
  
  if (!isValid) {
    logger.warn(`Event validation failed for ${schemaType}:`, validator.errors);
    return {
      isValid: false,
      errors: validator.errors
    };
  }
  
  return {
    isValid: true,
    errors: null
  };
}

module.exports = {
  telemetryEventSchema,
  orderEventSchema,
  inventoryEventSchema,
  agentActionEventSchema,
  validateEvent
};