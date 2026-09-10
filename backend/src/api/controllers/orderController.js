const OrderModel = require('../../models/orderModel');
const logger = require('../../utils/logger');

/**
 * Create a new order
 * @route POST /api/v1/orders
 * @group Orders
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Create a new order with items
 * @body {string} order_id.required - Unique order identifier
 * @body {string} store_id.required - Store ID where order is placed
 * @body {string} customer_id - Customer ID
 * @body {number} total_amount - Total order amount
 * @body {string} status - Order status (pending, processing, shipped, delivered, cancelled)
 * @body {Array} items - Array of order items
 * @response {201} Order created successfully
 * @response {400} Order ID and Store ID are required
 * @response {500} Failed to create order
 */
async function create(req, res) {
  try {
    const { order_id, store_id, customer_id, total_amount, status, items } = req.body;
    if (!order_id || !store_id) {
      return res.status(400).json({ success: false, error: 'Order ID and Store ID are required' });
    }
    const result = await OrderModel.create({ order_id, store_id, customer_id, total_amount, status, items });
    logger.info(`Order created: ${order_id}`);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to create order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
}

/**
 * Get order by ID
 * @route GET /api/v1/orders/:orderId
 * @group Orders
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Retrieve a specific order by its ID
 * @param {string} orderId.path.required - Order ID
 * @response {200} Order retrieved successfully
 * @response {400} Order ID is required
 * @response {404} Order not found
 * @response {500} Failed to get order
 */
async function getById(req, res) {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }
    const order = await OrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Failed to get order:', error);
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
}

/**
 * Update order status
 * @route PATCH /api/v1/orders/:orderId/status
 * @group Orders
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Update the status of an existing order
 * @param {string} orderId.path.required - Order ID
 * @body {string} status.required - New order status
 * @response {200} Order status updated successfully
 * @response {400} Order ID and status are required
 * @response {500} Failed to update order status
 */
async function updateStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ success: false, error: 'Order ID and status are required' });
    }
    const result = await OrderModel.updateStatus(orderId, status);
    logger.info(`Order status updated: ${orderId} -> ${status}`);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to update order status:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
}

/**
 * Get orders by store
 * @route GET /api/v1/orders/store/:storeId
 * @group Orders
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Retrieve all orders for a specific store, optionally filtered by status
 * @param {string} storeId.path.required - Store ID
 * @param {string} status.query - Filter by order status
 * @response {200} Orders retrieved successfully
 * @response {400} Store ID is required
 * @response {500} Failed to get orders by store
 */
async function getByStore(req, res) {
  try {
    const { storeId } = req.params;
    const { status } = req.query;
    if (!storeId) {
      return res.status(400).json({ success: false, error: 'Store ID is required' });
    }
    const orders = await OrderModel.getByStore(storeId, status || null);
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Failed to get orders by store:', error);
    res.status(500).json({ success: false, error: 'Failed to get orders by store' });
  }
}

module.exports = { create, getById, updateStatus, getByStore };
