/**
 * Data Catalog Schema Module
 * Provides data catalog schema definition and metadata management
 */

const logger = require('../../utils/logger');

class DataCatalogSchema {
  constructor() {
    this.catalog = new Map();
    this.initializeCatalog();
  }

  /**
   * Initialize catalog with default entries
   */
  initializeCatalog() {
    // Add default data assets
    this.addAsset('orders', {
      name: 'Orders',
      type: 'table',
      description: 'Customer order records',
      source: 'sqlite',
      schema: {
        orderId: { type: 'string', required: true, description: 'Unique order identifier' },
        storeId: { type: 'string', required: true, description: 'Store identifier' },
        productId: { type: 'string', required: true, description: 'Product identifier' },
        quantity: { type: 'number', required: true, description: 'Order quantity' },
        orderDate: { type: 'datetime', required: true, description: 'Order date' },
        status: { type: 'string', required: true, description: 'Order status' }
      },
      sensitivity: 'medium',
      retention: '365 days',
      owner: 'data-team',
      tags: ['orders', 'transactions', 'customer']
    });

    this.addAsset('inventory', {
      name: 'Inventory',
      type: 'table',
      description: 'Product inventory levels',
      source: 'sqlite',
      schema: {
        id: { type: 'string', required: true, description: 'Unique inventory identifier' },
        productId: { type: 'string', required: true, description: 'Product identifier' },
        storeId: { type: 'string', required: true, description: 'Store identifier' },
        quantity: { type: 'number', required: true, description: 'Current quantity' },
        lastUpdated: { type: 'datetime', required: true, description: 'Last update timestamp' }
      },
      sensitivity: 'low',
      retention: '1825 days',
      owner: 'inventory-team',
      tags: ['inventory', 'products', 'stock']
    });

    this.addAsset('shipments', {
      name: 'Shipments',
      type: 'table',
      description: 'Shipment tracking records',
      source: 'sqlite',
      schema: {
        shipmentId: { type: 'string', required: true, description: 'Unique shipment identifier' },
        orderId: { type: 'string', required: true, description: 'Associated order' },
        transporterId: { type: 'string', required: true, description: 'Transporter identifier' },
        status: { type: 'string', required: true, description: 'Shipment status' },
        estimatedDelivery: { type: 'datetime', required: false, description: 'Estimated delivery date' }
      },
      sensitivity: 'medium',
      retention: '1825 days',
      owner: 'logistics-team',
      tags: ['shipments', 'logistics', 'delivery']
    });
  }

  /**
   * Add a data asset to the catalog
   */
  addAsset(assetId, assetData) {
    const asset = {
      assetId,
      name: assetData.name,
      type: assetData.type || 'table',
      description: assetData.description || '',
      source: assetData.source || 'unknown',
      schema: assetData.schema || {},
      sensitivity: assetData.sensitivity || 'low',
      retention: assetData.retention || 'indefinite',
      owner: assetData.owner || 'unassigned',
      tags: assetData.tags || [],
      lineage: assetData.lineage || [],
      quality: assetData.quality || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    this.catalog.set(assetId, asset);
    
    logger.info(`Data asset added to catalog: ${assetId}`);
    
    return asset;
  }

  /**
   * Get a data asset
   */
  getAsset(assetId) {
    return this.catalog.get(assetId);
  }

  /**
   * Update a data asset
   */
  updateAsset(assetId, updates) {
    const asset = this.catalog.get(assetId);
    
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    Object.assign(asset, updates);
    asset.updatedAt = new Date().toISOString();
    asset.version++;
    
    logger.info(`Data asset updated: ${assetId}`);
    
    return asset;
  }

  /**
   * Delete a data asset
   */
  deleteAsset(assetId) {
    const deleted = this.catalog.delete(assetId);
    
    if (deleted) {
      logger.info(`Data asset deleted: ${assetId}`);
    }
    
    return deleted;
  }

  /**
   * Search the catalog
   */
  search(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const asset of this.catalog.values()) {
      let matches = false;

      // Search in name
      if (asset.name.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }

      // Search in description
      if (asset.description.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }

      // Search in tags
      if (asset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        matches = true;
      }

      // Search in schema fields
      for (const [fieldName, field] of Object.entries(asset.schema)) {
        if (fieldName.toLowerCase().includes(lowerQuery) || 
            (field.description && field.description.toLowerCase().includes(lowerQuery))) {
          matches = true;
          break;
        }
      }

      if (matches) {
        results.push(asset);
      }
    }

    return results;
  }

  /**
   * Get assets by type
   */
  getAssetsByType(type) {
    return Array.from(this.catalog.values()).filter(asset => asset.type === type);
  }

  /**
   * Get assets by sensitivity
   */
  getAssetsBySensitivity(sensitivity) {
    return Array.from(this.catalog.values()).filter(asset => asset.sensitivity === sensitivity);
  }

  /**
   * Get assets by owner
   */
  getAssetsByOwner(owner) {
    return Array.from(this.catalog.values()).filter(asset => asset.owner === owner);
  }

  /**
   * Get assets by tag
   */
  getAssetsByTag(tag) {
    return Array.from(this.catalog.values()).filter(asset => 
      asset.tags.includes(tag)
    );
  }

  /**
   * Get all assets
   */
  getAllAssets() {
    return Array.from(this.catalog.values());
  }

  /**
   * Get catalog statistics
   */
  getStatistics() {
    const stats = {
      totalAssets: this.catalog.size,
      byType: {},
      bySensitivity: {},
      byOwner: {},
      byTag: {}
    };

    for (const asset of this.catalog.values()) {
      // Count by type
      if (!stats.byType[asset.type]) {
        stats.byType[asset.type] = 0;
      }
      stats.byType[asset.type]++;

      // Count by sensitivity
      if (!stats.bySensitivity[asset.sensitivity]) {
        stats.bySensitivity[asset.sensitivity] = 0;
      }
      stats.bySensitivity[asset.sensitivity]++;

      // Count by owner
      if (!stats.byOwner[asset.owner]) {
        stats.byOwner[asset.owner] = 0;
      }
      stats.byOwner[asset.owner]++;

      // Count by tag
      for (const tag of asset.tags) {
        if (!stats.byTag[tag]) {
          stats.byTag[tag] = 0;
        }
        stats.byTag[tag]++;
      }
    }

    return stats;
  }

  /**
   * Add lineage to an asset
   */
  addLineage(assetId, lineageData) {
    const asset = this.catalog.get(assetId);
    
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    asset.lineage.push({
      ...lineageData,
      addedAt: new Date().toISOString()
    });
    
    logger.info(`Lineage added to asset: ${assetId}`);
    
    return asset;
  }

  /**
   * Update quality score for an asset
   */
  updateQuality(assetId, qualityData) {
    const asset = this.catalog.get(assetId);
    
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    asset.quality = {
      ...qualityData,
      lastAssessed: new Date().toISOString()
    };
    
    logger.info(`Quality updated for asset: ${assetId}`);
    
    return asset;
  }

  /**
   * Export catalog for compliance
   */
  exportCatalog() {
    return {
      exportedAt: new Date().toISOString(),
      assets: Array.from(this.catalog.values()),
      statistics: this.getStatistics()
    };
  }

  /**
   * Generate data dictionary
   */
  generateDataDictionary() {
    const dictionary = {
      generatedAt: new Date().toISOString(),
      entries: []
    };

    for (const asset of this.catalog.values()) {
      for (const [fieldName, field] of Object.entries(asset.schema)) {
        dictionary.entries.push({
          assetId: asset.assetId,
          assetName: asset.name,
          fieldName,
          fieldType: field.type,
          required: field.required,
          description: field.description,
          sensitivity: asset.sensitivity
        });
      }
    }

    return dictionary;
  }
}

// Singleton instance
let dataCatalogSchemaInstance = null;

/**
 * Get the singleton data catalog schema instance
 */
function getDataCatalogSchema() {
  if (!dataCatalogSchemaInstance) {
    dataCatalogSchemaInstance = new DataCatalogSchema();
  }
  return dataCatalogSchemaInstance;
}

module.exports = {
  DataCatalogSchema,
  getDataCatalogSchema
};
