const SubAgent = require('../../_base/SubAgent');

class BatchOptimizer extends SubAgent {
  constructor(warehouseId, apiService) {
    super('BatchOptimizer', `Warehouse-${warehouseId}`, apiService);
    this.warehouseId = warehouseId;
  }

  async optimizeBatch(skus) {
    this.log(`Optimizing batch of ${(skus || []).length} SKUs`);

    if (!skus || skus.length === 0) {
      this.warn('Empty SKUs list for batch optimization');
      return { recommendations: [], total_savings: 0, model_version: 'fallback' };
    }

    const data = { skus };

    try {
      const result = await this.apiService.batchOptimize(data);
      return {
        recommendations: result.recommendations || [],
        total_savings: result.total_savings || 0,
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Batch optimization failed:', err.message);
      return this._fallbackBatch(skus);
    }
  }

  async optimizeBatchByStore(skuStorePairs) {
    this.log(`Optimizing batch across ${(skuStorePairs || []).length} sku-store pairs`);

    if (!skuStorePairs || skuStorePairs.length === 0) {
      this.warn('Empty sku-store pairs for batch optimization');
      return { results: [], total_processed: 0, model_version: 'fallback' };
    }

    const data = { pairs: skuStorePairs };

    try {
      const result = await this.apiService.batchOptimize(data);
      return {
        results: result.results || result.recommendations || [],
        total_processed: (result.results || result.recommendations || []).length
      };
    } catch (err) {
      this.error('Batch-by-store optimization failed:', err.message);
      return this._fallbackBatchByStore(skuStorePairs);
    }
  }

  _fallbackBatch(skus) {
    return {
      recommendations: skus.map(s => ({
        sku_id: s,
        reorder_quantity: 50,
        safety_stock: 25
      })),
      total_savings: 0,
      model_version: 'fallback'
    };
  }

  _fallbackBatchByStore(pairs) {
    return {
      results: pairs.map(p => ({
        sku_id: p.sku,
        store_id: p.store,
        reorder_quantity: 50
      })),
      total_processed: pairs.length,
      model_version: 'fallback'
    };
  }
}

module.exports = BatchOptimizer;
