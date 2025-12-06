/**
 * Order Model
 * 
 * This module defines the order data model and provides methods for
 * interacting with order data.
 */

const sqliteDatabase = require('../storage/sqliteDatabase');

class OrderModel {
  /**
   * Create a new order
   * @param {Object} orderData - Order data
   */
  static async create(orderData) {
    try {
      // Validate required fields
      if (!orderData.order_id || !orderData.store_id) {
        throw new Error('Order ID and Store ID are required');
      }

      // Set defaults for optional fields
      const data = {
        order_id: orderData.order_id,
        store_id: orderData.store_id,
        customer_id: orderData.customer_id || null,
        total_amount: orderData.total_amount || 0.0,
        status: orderData.status || 'pending'
      };

      // Insert order in database
      const id = await sqliteDatabase.createOrder(data);
      
      // If order items are provided, add them
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          await this.addOrderItem({
            order_id: data.order_id,
            ...item
          });
        }
      }

      return { id, ...data };
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Add an item to an order
   * @param {Object} itemData - Order item data
   */
  static async addOrderItem(itemData) {
    try {
      // Validate required fields
      if (!itemData.order_id || !itemData.product_id) {
        throw new Error('Order ID and Product ID are required');
      }

      // Set defaults for optional fields
      const data = {
        order_id: itemData.order_id,
        product_id: itemData.product_id,
        quantity: itemData.quantity || 1,
        unit_price: itemData.unit_price || 0.0,
        total_price: itemData.total_price || (itemData.quantity || 1) * (itemData.unit_price || 0.0)
      };

      // Insert order item in database
      const id = await sqliteDatabase.addOrderItem(data);
      return { id, ...data };
    } catch (error) {
      throw new Error(`Failed to add order item: ${error.message}`);
    }
  }

  /**
   * Get an order by ID
   * @param {string} orderId - Order ID
   */
  static async getById(orderId) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // This would require a join with order_items table
      // For simplicity, we'll just return the order data
      // In a real implementation, we'd fetch the items as well
      return { order_id: orderId }; // Placeholder
    } catch (error) {
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   */
  static async updateStatus(orderId, status) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      if (!status) {
        throw new Error('Status is required');
      }

      // Update order status in database
      // This would require implementing the update method in sqliteDatabase
      // For now, we'll just return a placeholder
      return { order_id: orderId, status };
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  /**
   * Get orders by store
   * @param {string} storeId - Store ID
   * @param {string} status - Optional status filter
   */
  static async getByStore(storeId, status = null) {
    try {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      // This would require querying the database
      // For now, we'll just return a placeholder
      return []; // Placeholder
    } catch (error) {
      throw new Error(`Failed to get orders by store: ${error.message}`);
    }
  }
}

module.exports = OrderModel;