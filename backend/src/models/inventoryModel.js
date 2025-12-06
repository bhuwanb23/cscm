/**
 * Inventory Model
 * 
 * This module defines the inventory data model and provides methods for
 * interacting with inventory data.
 */

const sqliteDatabase = require('../storage/sqliteDatabase');

class InventoryModel {
  /**
   * Create or update an inventory item
   * @param {Object} inventoryData - Inventory item data
   */
  static async upsert(inventoryData) {
    try {
      // Validate required fields
      if (!inventoryData.product_id || !inventoryData.store_id) {
        throw new Error('Product ID and Store ID are required');
      }

      // Set defaults for optional fields
      const data = {
        product_id: inventoryData.product_id,
        store_id: inventoryData.store_id,
        quantity: inventoryData.quantity || 0,
        reserved_quantity: inventoryData.reserved_quantity || 0,
        min_stock_level: inventoryData.min_stock_level || 0,
        max_stock_level: inventoryData.max_stock_level || 0,
        unit_cost: inventoryData.unit_cost || 0.0,
        selling_price: inventoryData.selling_price || 0.0
      };

      // Insert or update in database
      const id = await sqliteDatabase.upsertInventory(data);
      return { id, ...data };
    } catch (error) {
      throw new Error(`Failed to upsert inventory item: ${error.message}`);
    }
  }

  /**
   * Get inventory items for a specific store
   * @param {string} storeId - Store ID
   */
  static async getByStore(storeId) {
    try {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const items = await sqliteDatabase.getInventoryByStore(storeId);
      return items;
    } catch (error) {
      throw new Error(`Failed to get inventory by store: ${error.message}`);
    }
  }

  /**
   * Get a specific inventory item
   * @param {string} productId - Product ID
   * @param {string} storeId - Store ID
   */
  static async get(productId, storeId) {
    try {
      if (!productId || !storeId) {
        throw new Error('Product ID and Store ID are required');
      }

      const items = await sqliteDatabase.getInventoryByStore(storeId);
      const item = items.find(i => i.product_id === productId);
      return item || null;
    } catch (error) {
      throw new Error(`Failed to get inventory item: ${error.message}`);
    }
  }

  /**
   * Update inventory quantity
   * @param {string} productId - Product ID
   * @param {string} storeId - Store ID
   * @param {number} quantity - New quantity
   */
  static async updateQuantity(productId, storeId, quantity) {
    try {
      if (!productId || !storeId) {
        throw new Error('Product ID and Store ID are required');
      }

      if (typeof quantity !== 'number') {
        throw new Error('Quantity must be a number');
      }

      // First get the existing item
      const existingItem = await this.get(productId, storeId);
      if (!existingItem) {
        throw new Error('Inventory item not found');
      }

      // Update the quantity
      const updatedData = {
        ...existingItem,
        quantity: quantity
      };

      const result = await this.upsert(updatedData);
      return result;
    } catch (error) {
      throw new Error(`Failed to update inventory quantity: ${error.message}`);
    }
  }

  /**
   * Reserve inventory quantity
   * @param {string} productId - Product ID
   * @param {string} storeId - Store ID
   * @param {number} quantity - Quantity to reserve
   */
  static async reserveQuantity(productId, storeId, quantity) {
    try {
      if (!productId || !storeId) {
        throw new Error('Product ID and Store ID are required');
      }

      if (typeof quantity !== 'number' || quantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }

      // First get the existing item
      const existingItem = await this.get(productId, storeId);
      if (!existingItem) {
        throw new Error('Inventory item not found');
      }

      // Check if enough quantity is available
      const availableQuantity = existingItem.quantity - existingItem.reserved_quantity;
      if (availableQuantity < quantity) {
        throw new Error(`Insufficient inventory. Available: ${availableQuantity}, Requested: ${quantity}`);
      }

      // Update the reserved quantity
      const updatedData = {
        ...existingItem,
        reserved_quantity: existingItem.reserved_quantity + quantity
      };

      const result = await this.upsert(updatedData);
      return result;
    } catch (error) {
      throw new Error(`Failed to reserve inventory quantity: ${error.message}`);
    }
  }

  /**
   * Release reserved inventory quantity
   * @param {string} productId - Product ID
   * @param {string} storeId - Store ID
   * @param {number} quantity - Quantity to release
   */
  static async releaseReservedQuantity(productId, storeId, quantity) {
    try {
      if (!productId || !storeId) {
        throw new Error('Product ID and Store ID are required');
      }

      if (typeof quantity !== 'number' || quantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }

      // First get the existing item
      const existingItem = await this.get(productId, storeId);
      if (!existingItem) {
        throw new Error('Inventory item not found');
      }

      // Check if enough quantity is reserved
      if (existingItem.reserved_quantity < quantity) {
        throw new Error(`Cannot release more than reserved. Reserved: ${existingItem.reserved_quantity}, Requested: ${quantity}`);
      }

      // Update the reserved quantity
      const updatedData = {
        ...existingItem,
        reserved_quantity: existingItem.reserved_quantity - quantity
      };

      const result = await this.upsert(updatedData);
      return result;
    } catch (error) {
      throw new Error(`Failed to release reserved inventory quantity: ${error.message}`);
    }
  }
}

module.exports = InventoryModel;