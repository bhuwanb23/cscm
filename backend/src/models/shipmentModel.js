/**
 * Shipment Model
 * 
 * This module defines the shipment data model and provides methods for
 * interacting with shipment data.
 */

const sqliteDatabase = require('../storage/sqliteDatabase');

class ShipmentModel {
  /**
   * Create a new shipment
   * @param {Object} shipmentData - Shipment data
   */
  static async create(shipmentData) {
    try {
      // Validate required fields
      if (!shipmentData.shipment_id || !shipmentData.from_location || !shipmentData.to_location) {
        throw new Error('Shipment ID, From Location, and To Location are required');
      }

      // Set defaults for optional fields
      const data = {
        shipment_id: shipmentData.shipment_id,
        order_id: shipmentData.order_id || null,
        from_location: shipmentData.from_location,
        to_location: shipmentData.to_location,
        status: shipmentData.status || 'pending',
        carrier: shipmentData.carrier || null,
        tracking_number: shipmentData.tracking_number || null,
        estimated_delivery: shipmentData.estimated_delivery || null
      };

      // Insert shipment in database
      const id = await sqliteDatabase.createShipment(data);
      
      // If shipment items are provided, add them
      if (shipmentData.items && Array.isArray(shipmentData.items)) {
        for (const item of shipmentData.items) {
          await this.addShipmentItem({
            shipment_id: data.shipment_id,
            ...item
          });
        }
      }

      return { id, ...data };
    } catch (error) {
      throw new Error(`Failed to create shipment: ${error.message}`);
    }
  }

  /**
   * Add an item to a shipment
   * @param {Object} itemData - Shipment item data
   */
  static async addShipmentItem(itemData) {
    try {
      // Validate required fields
      if (!itemData.shipment_id || !itemData.product_id) {
        throw new Error('Shipment ID and Product ID are required');
      }

      // Set defaults for optional fields
      const data = {
        shipment_id: itemData.shipment_id,
        product_id: itemData.product_id,
        quantity: itemData.quantity || 1
      };

      // Insert shipment item in database
      const id = await sqliteDatabase.addShipmentItem(data);
      return { id, ...data };
    } catch (error) {
      throw new Error(`Failed to add shipment item: ${error.message}`);
    }
  }

  /**
   * Get a shipment by ID
   * @param {string} shipmentId - Shipment ID
   */
  static async getById(shipmentId) {
    try {
      if (!shipmentId) {
        throw new Error('Shipment ID is required');
      }

      // This would require querying the database
      // For now, we'll just return a placeholder
      return { shipment_id: shipmentId }; // Placeholder
    } catch (error) {
      throw new Error(`Failed to get shipment: ${error.message}`);
    }
  }

  /**
   * Update shipment status
   * @param {string} shipmentId - Shipment ID
   * @param {string} status - New status
   * @param {Object} additionalFields - Additional fields to update
   */
  static async updateStatus(shipmentId, status, additionalFields = {}) {
    try {
      if (!shipmentId) {
        throw new Error('Shipment ID is required');
      }

      if (!status) {
        throw new Error('Status is required');
      }

      // Update shipment status in database
      const changes = await sqliteDatabase.updateShipmentStatus(shipmentId, status, additionalFields);
      return { shipment_id: shipmentId, status, changes };
    } catch (error) {
      throw new Error(`Failed to update shipment status: ${error.message}`);
    }
  }

  /**
   * Get shipments by status
   * @param {string} status - Shipment status
   */
  static async getByStatus(status) {
    try {
      if (!status) {
        throw new Error('Status is required');
      }

      const shipments = await sqliteDatabase.getShipmentsByStatus(status);
      return shipments;
    } catch (error) {
      throw new Error(`Failed to get shipments by status: ${error.message}`);
    }
  }

  /**
   * Get shipments by location
   * @param {string} location - Location (from or to)
   */
  static async getByLocation(location) {
    try {
      if (!location) {
        throw new Error('Location is required');
      }

      // This would require querying the database
      // For now, we'll just return a placeholder
      return []; // Placeholder
    } catch (error) {
      throw new Error(`Failed to get shipments by location: ${error.message}`);
    }
  }
}

module.exports = ShipmentModel;