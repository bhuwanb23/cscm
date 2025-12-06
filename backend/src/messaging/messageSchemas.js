/**
 * Message Schemas
 * 
 * This module defines the schema structures for different message types
 * used in the CSCM messaging system.
 */

// Schema for inventory update messages
const INVENTORY_UPDATE_SCHEMA = {
  type: 'object',
  properties: {
    productId: { type: 'string' },
    storeId: { type: 'string' },
    quantity: { type: 'number' },
    timestamp: { type: 'string', format: 'date-time' },
    source: { type: 'string' },
    reason: { type: 'string' }
  },
  required: ['productId', 'storeId', 'quantity', 'timestamp'],
  additionalProperties: true
};

// Schema for demand forecast messages
const DEMAND_FORECAST_SCHEMA = {
  type: 'object',
  properties: {
    productId: { type: 'string' },
    storeId: { type: 'string' },
    forecast: {
      type: 'object',
      properties: {
        expectedDemand: { type: 'number' },
        safetyStock: { type: 'number' },
        confidence: { type: 'number' },
        period: { type: 'string' }
      },
      required: ['expectedDemand', 'safetyStock', 'confidence', 'period']
    },
    timestamp: { type: 'string', format: 'date-time' },
    source: { type: 'string' }
  },
  required: ['productId', 'storeId', 'forecast', 'timestamp'],
  additionalProperties: true
};

// Schema for shipment status messages
const SHIPMENT_STATUS_SCHEMA = {
  type: 'object',
  properties: {
    shipmentId: { type: 'string' },
    status: { type: 'string' },
    location: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' }
      }
    },
    estimatedDelivery: { type: 'string', format: 'date-time' },
    timestamp: { type: 'string', format: 'date-time' },
    source: { type: 'string' }
  },
  required: ['shipmentId', 'status', 'timestamp'],
  additionalProperties: true
};

// Schema for alert messages
const ALERT_SCHEMA = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    severity: { type: 'string' },
    title: { type: 'string' },
    message: { type: 'string' },
    entityId: { type: 'string' },
    entityType: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    source: { type: 'string' }
  },
  required: ['type', 'severity', 'message', 'timestamp'],
  additionalProperties: true
};

// Schema for decision messages
const DECISION_SCHEMA = {
  type: 'object',
  properties: {
    decisionId: { type: 'string' },
    type: { type: 'string' },
    entityId: { type: 'string' },
    entitytype: { type: 'string' },
    recommendation: { type: 'string' },
    confidence: { type: 'number' },
    factors: {
      type: 'array',
      items: { type: 'string' }
    },
    timestamp: { type: 'string', format: 'date-time' },
    source: { type: 'string' }
  },
  required: ['decisionId', 'type', 'recommendation', 'confidence', 'timestamp'],
  additionalProperties: true
};

// Export all schemas
module.exports = {
  INVENTORY_UPDATE_SCHEMA,
  DEMAND_FORECAST_SCHEMA,
  SHIPMENT_STATUS_SCHEMA,
  ALERT_SCHEMA,
  DECISION_SCHEMA
};