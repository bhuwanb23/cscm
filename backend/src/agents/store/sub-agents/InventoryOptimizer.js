const SubAgent = require('../../_base/SubAgent');

class InventoryOptimizer extends SubAgent {
  constructor(storeId, apiService) {
    super('InventoryOptimizer', `Store-${storeId}`, apiService);
    this.storeId = storeId;
  }

  async optimize(productId, currentStock, forecast, productAttributes = {}, suppliers = {}) {
    this.log(`Optimizing inventory for product ${productId} (stock: ${currentStock})`);

    if (!productId) throw new Error('productId is required');
    if (currentStock === undefined || currentStock === null) throw new Error('currentStock is required');

    const optimizationData = {
      product_id: productId,
      store_id: this.storeId,
      current_stock: currentStock,
      forecast,
      product_attributes: productAttributes,
      suppliers
    };

    try {
      const result = await this.apiService.inventoryOptimization(optimizationData);
      this.log(`Optimization for ${productId}: reorder=${result.reorder_point}, orderQty=${result.order_quantity}`);
      return result;
    } catch (err) {
      this.error(`Optimization failed for ${productId}:`, err.message);
      throw err;
    }
  }

  needsRestock(currentStock, reorderPoint) {
    return currentStock < reorderPoint;
  }

  urgencyLevel(currentStock, reorderPoint) {
    if (currentStock < reorderPoint / 2) return 'high';
    if (currentStock < reorderPoint) return 'normal';
    return 'none';
  }
}

module.exports = InventoryOptimizer;
