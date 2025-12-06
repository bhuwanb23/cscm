const logger = require('../../utils/logger');
const messagingLayer = require('../../messaging');
const { validateEvent } = require('../../messaging/eventSchemas');

/**
 * Controller for handling event-related operations
 */

/**
 * Publish a telemetry event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function publishTelemetryEvent(req, res) {
  try {
    const { sourceId, eventType, payload } = req.body;
    
    // Validate required fields
    if (!sourceId || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'sourceId and eventType are required'
      });
    }
    
    // Validate event schema
    const validationResult = validateEvent(req.body, 'telemetry');
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event format',
        details: validationResult.errors
      });
    }
    
    // Create event object
    const event = {
      sourceId,
      eventType,
      payload,
      timestamp: new Date().toISOString()
    };
    
    // Send to messaging layer
    await messagingLayer.publishMessage('telemetry.events', event);
    
    logger.info(`Telemetry event published for source ${sourceId}`);
    
    res.status(201).json({
      success: true,
      message: 'Telemetry event published successfully',
      data: event
    });
  } catch (error) {
    logger.error('Failed to publish telemetry event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish telemetry event'
    });
  }
}

/**
 * Publish an inventory event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function publishInventoryEvent(req, res) {
  try {
    const { productId, storeId, quantity, eventType } = req.body;
    
    // Validate required fields
    if (!productId || !storeId || quantity === undefined || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'productId, storeId, quantity, and eventType are required'
      });
    }
    
    // Validate event schema
    const validationResult = validateEvent(req.body, 'inventory');
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event format',
        details: validationResult.errors
      });
    }
    
    // Create event object
    const event = {
      productId,
      storeId,
      quantity,
      eventType,
      timestamp: new Date().toISOString()
    };
    
    // Send to messaging layer
    await messagingLayer.publishMessage('inventory.events', event);
    
    logger.info(`Inventory event published for product ${productId} at store ${storeId}`);
    
    res.status(201).json({
      success: true,
      message: 'Inventory event published successfully',
      data: event
    });
  } catch (error) {
    logger.error('Failed to publish inventory event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish inventory event'
    });
  }
}

/**
 * Publish an order event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function publishOrderEvent(req, res) {
  try {
    const { orderId, customerId, items, totalAmount, status } = req.body;
    
    // Validate required fields
    if (!orderId || !customerId || !items || !totalAmount || !status) {
      return res.status(400).json({
        success: false,
        error: 'orderId, customerId, items, totalAmount, and status are required'
      });
    }
    
    // Validate event schema
    const validationResult = validateEvent(req.body, 'order');
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event format',
        details: validationResult.errors
      });
    }
    
    // Create event object
    const event = {
      orderId,
      customerId,
      items,
      totalAmount,
      status,
      timestamp: new Date().toISOString()
    };
    
    // Send to messaging layer
    await messagingLayer.publishMessage('orders.events', event);
    
    logger.info(`Order event published for order ${orderId}`);
    
    res.status(201).json({
      success: true,
      message: 'Order event published successfully',
      data: event
    });
  } catch (error) {
    logger.error('Failed to publish order event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish order event'
    });
  }
}

module.exports = {
  publishTelemetryEvent,
  publishInventoryEvent,
  publishOrderEvent
};