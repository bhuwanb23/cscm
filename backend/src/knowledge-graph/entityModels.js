/**
 * Entity Relationship Models
 * 
 * This module defines the entity relationship models for the knowledge graph,
 * specifically for SKU-store-supplier relationships.
 */

const knowledgeGraph = require('./graphStructure');
const logger = require('../utils/logger');

class EntityModels {
  /**
   * Create SKU entity
   * @param {string} skuId - SKU identifier
   * @param {Object} attributes - SKU attributes
   */
  static createSKU(skuId, attributes = {}) {
    try {
      knowledgeGraph.addEntity(skuId, 'sku', {
        name: attributes.name || skuId,
        category: attributes.category || 'unknown',
        price: attributes.price || 0,
        ...attributes
      });
      
      logger.debug(`Created SKU entity: ${skuId}`);
    } catch (error) {
      logger.error(`Failed to create SKU entity ${skuId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create Store entity
   * @param {string} storeId - Store identifier
   * @param {Object} attributes - Store attributes
   */
  static createStore(storeId, attributes = {}) {
    try {
      knowledgeGraph.addEntity(storeId, 'store', {
        name: attributes.name || storeId,
        location: attributes.location || 'unknown',
        capacity: attributes.capacity || 0,
        ...attributes
      });
      
      logger.debug(`Created Store entity: ${storeId}`);
    } catch (error) {
      logger.error(`Failed to create Store entity ${storeId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create Supplier entity
   * @param {string} supplierId - Supplier identifier
   * @param {Object} attributes - Supplier attributes
   */
  static createSupplier(supplierId, attributes = {}) {
    try {
      knowledgeGraph.addEntity(supplierId, 'supplier', {
        name: attributes.name || supplierId,
        contact: attributes.contact || 'unknown',
        leadTime: attributes.leadTime || 0,
        ...attributes
      });
      
      logger.debug(`Created Supplier entity: ${supplierId}`);
    } catch (error) {
      logger.error(`Failed to create Supplier entity ${supplierId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create relationship between SKU and Store (inventory)
   * @param {string} skuId - SKU identifier
   * @param {string} storeId - Store identifier
   * @param {Object} attributes - Relationship attributes
   */
  static createSKUStoreRelationship(skuId, storeId, attributes = {}) {
    try {
      // Add relationship: SKU is stocked at Store
      knowledgeGraph.addRelationship(skuId, storeId, 'stocked_at', {
        quantity: attributes.quantity || 0,
        minStock: attributes.minStock || 0,
        maxStock: attributes.maxStock || 0,
        lastRestocked: attributes.lastRestocked || null
      });
      
      logger.debug(`Created SKU-Store relationship: ${skuId} -> ${storeId}`);
    } catch (error) {
      logger.error(`Failed to create SKU-Store relationship ${skuId} -> ${storeId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create relationship between Store and Supplier (procurement)
   * @param {string} storeId - Store identifier
   * @param {string} supplierId - Supplier identifier
   * @param {Object} attributes - Relationship attributes
   */
  static createStoreSupplierRelationship(storeId, supplierId, attributes = {}) {
    try {
      // Add relationship: Store procures from Supplier
      knowledgeGraph.addRelationship(storeId, supplierId, 'procures_from', {
        contractStart: attributes.contractStart || null,
        contractEnd: attributes.contractEnd || null,
        preferred: attributes.preferred || false
      });
      
      logger.debug(`Created Store-Supplier relationship: ${storeId} -> ${supplierId}`);
    } catch (error) {
      logger.error(`Failed to create Store-Supplier relationship ${storeId} -> ${supplierId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create relationship between SKU and Supplier (supply)
   * @param {string} skuId - SKU identifier
   * @param {string} supplierId - Supplier identifier
   * @param {Object} attributes - Relationship attributes
   */
  static createSKUSupplierRelationship(skuId, supplierId, attributes = {}) {
    try {
      // Add relationship: SKU is supplied by Supplier
      knowledgeGraph.addRelationship(skuId, supplierId, 'supplied_by', {
        cost: attributes.cost || 0,
        moq: attributes.moq || 1, // Minimum order quantity
        leadTime: attributes.leadTime || 0
      });
      
      logger.debug(`Created SKU-Supplier relationship: ${skuId} -> ${supplierId}`);
    } catch (error) {
      logger.error(`Failed to create SKU-Supplier relationship ${skuId} -> ${supplierId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all SKUs stocked at a store
   * @param {string} storeId - Store identifier
   * @returns {Array} Array of SKU entities
   */
  static getSKUsAtStore(storeId) {
    try {
      // We need to find SKUs that have a 'stocked_at' relationship to this store
      const skus = [];
      
      // Get all entities from the knowledge graph
      const allEntities = Array.from(knowledgeGraph.entityMetadata.keys());
      
      // For each entity, check if it has a 'stocked_at' relationship to this store
      for (const entityId of allEntities) {
        const relationships = knowledgeGraph.getRelationships(entityId);
        for (const rel of relationships) {
          if (rel.to === storeId && rel.type === 'stocked_at') {
            const sku = knowledgeGraph.getEntity(entityId);
            if (sku && sku.type === 'sku') {
              skus.push(sku);
            }
          }
        }
      }
      
      return skus;
    } catch (error) {
      logger.error(`Failed to get SKUs at store ${storeId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all stores that stock a SKU
   * @param {string} skuId - SKU identifier
   * @returns {Array} Array of Store entities
   */
  static getStoresWithSKU(skuId) {
    try {
      const relationships = knowledgeGraph.getRelationships(skuId);
      const stores = [];
      
      // Find outgoing 'stocked_at' relationships (stores where this SKU is stocked)
      relationships.forEach(rel => {
        if (rel.from === skuId && rel.type === 'stocked_at') {
          const store = knowledgeGraph.getEntity(rel.to);
          if (store && store.type === 'store') {
            stores.push(store);
          }
        }
      });
      
      return stores;
    } catch (error) {
      logger.error(`Failed to get stores with SKU ${skuId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get suppliers for a store
   * @param {string} storeId - Store identifier
   * @returns {Array} Array of Supplier entities
   */
  static getSuppliersForStore(storeId) {
    try {
      const relationships = knowledgeGraph.getRelationships(storeId);
      const suppliers = [];
      
      // Find outgoing 'procures_from' relationships (suppliers this store procures from)
      relationships.forEach(rel => {
        if (rel.from === storeId && rel.type === 'procures_from') {
          const supplier = knowledgeGraph.getEntity(rel.to);
          if (supplier && supplier.type === 'supplier') {
            suppliers.push(supplier);
          }
        }
      });
      
      return suppliers;
    } catch (error) {
      logger.error(`Failed to get suppliers for store ${storeId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get suppliers for a SKU
   * @param {string} skuId - SKU identifier
   * @returns {Array} Array of Supplier entities
   */
  static getSuppliersForSKU(skuId) {
    try {
      const relationships = knowledgeGraph.getRelationships(skuId);
      const suppliers = [];
      
      // Find outgoing 'supplied_by' relationships (suppliers that supply this SKU)
      relationships.forEach(rel => {
        if (rel.from === skuId && rel.type === 'supplied_by') {
          const supplier = knowledgeGraph.getEntity(rel.to);
          if (supplier && supplier.type === 'supplier') {
            suppliers.push(supplier);
          }
        }
      });
      
      return suppliers;
    } catch (error) {
      logger.error(`Failed to get suppliers for SKU ${skuId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get SKUs supplied by a supplier
   * @param {string} supplierId - Supplier identifier
   * @returns {Array} Array of SKU entities
   */
  static getSKUsFromSupplier(supplierId) {
    try {
      // We need to find SKUs that have a 'supplied_by' relationship to this supplier
      const skus = [];
      
      // Get all entities from the knowledge graph
      const allEntities = Array.from(knowledgeGraph.entityMetadata.keys());
      
      // For each entity, check if it has a 'supplied_by' relationship to this supplier
      for (const entityId of allEntities) {
        const relationships = knowledgeGraph.getRelationships(entityId);
        for (const rel of relationships) {
          if (rel.to === supplierId && rel.type === 'supplied_by') {
            const sku = knowledgeGraph.getEntity(entityId);
            if (sku && sku.type === 'sku') {
              skus.push(sku);
            }
          }
        }
      }
      
      return skus;
    } catch (error) {
      logger.error(`Failed to get SKUs from supplier ${supplierId}:`, error.message);
      throw error;
    }
  }

  /**
   * Find supply chain path from SKU to Store
   * @param {string} skuId - SKU identifier
   * @param {string} storeId - Store identifier
   * @returns {Array|null} Path from SKU to Store or null if no path exists
   */
  static findSupplyChainPath(skuId, storeId) {
    try {
      // Find shortest path in the knowledge graph
      const path = knowledgeGraph.findShortestPath(skuId, storeId);
      return path;
    } catch (error) {
      logger.error(`Failed to find supply chain path from ${skuId} to ${storeId}:`, error.message);
      throw error;
    }
  }
}

module.exports = EntityModels;