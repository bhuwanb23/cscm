/**
 * Data Access Layer
 * 
 * This module provides a unified interface for accessing data models.
 * It abstracts the underlying data storage implementation.
 */

const InventoryModel = require('../models/inventoryModel');
const OrderModel = require('../models/orderModel');
const ShipmentModel = require('../models/shipmentModel');
const sqliteDatabase = require('./sqliteDatabase');

class DataAccessLayer {
  /**
   * Initialize the data access layer
   */
  static async initialize() {
    try {
      await sqliteDatabase.initialize();
    } catch (error) {
      throw new Error(`Failed to initialize data access layer: ${error.message}`);
    }
  }

  /**
   * Close the data access layer
   */
  static async close() {
    try {
      await sqliteDatabase.close();
    } catch (error) {
      throw new Error(`Failed to close data access layer: ${error.message}`);
    }
  }

  // Inventory methods
  static async upsertInventory(inventoryData) {
    return await InventoryModel.upsert(inventoryData);
  }

  static async getInventoryByStore(storeId) {
    return await InventoryModel.getByStore(storeId);
  }

  static async getInventoryItem(productId, storeId) {
    return await InventoryModel.get(productId, storeId);
  }

  static async updateInventoryQuantity(productId, storeId, quantity) {
    return await InventoryModel.updateQuantity(productId, storeId, quantity);
  }

  static async reserveInventoryQuantity(productId, storeId, quantity) {
    return await InventoryModel.reserveQuantity(productId, storeId, quantity);
  }

  static async releaseReservedInventoryQuantity(productId, storeId, quantity) {
    return await InventoryModel.releaseReservedQuantity(productId, storeId, quantity);
  }

  // Order methods
  static async createOrder(orderData) {
    return await OrderModel.create(orderData);
  }

  static async addOrderItem(itemData) {
    return await OrderModel.addOrderItem(itemData);
  }

  static async getOrderById(orderId) {
    return await OrderModel.getById(orderId);
  }

  static async updateOrderStatus(orderId, status) {
    return await OrderModel.updateStatus(orderId, status);
  }

  static async getOrdersByStore(storeId, status = null) {
    return await OrderModel.getByStore(storeId, status);
  }

  // Shipment methods
  static async createShipment(shipmentData) {
    return await ShipmentModel.create(shipmentData);
  }

  static async addShipmentItem(itemData) {
    return await ShipmentModel.addShipmentItem(itemData);
  }

  static async getShipmentById(shipmentId) {
    return await ShipmentModel.getById(shipmentId);
  }

  static async updateShipmentStatus(shipmentId, status, additionalFields = {}) {
    return await ShipmentModel.updateStatus(shipmentId, status, additionalFields);
  }

  static async getShipmentsByStatus(status) {
    return await ShipmentModel.getByStatus(status);
  }

  static async getShipmentsByLocation(location) {
    return await ShipmentModel.getByLocation(location);
  }
}

module.exports = DataAccessLayer;