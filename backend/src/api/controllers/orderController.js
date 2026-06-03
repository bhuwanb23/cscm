const OrderModel = require('../../models/orderModel');
const logger = require('../../utils/logger');

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
