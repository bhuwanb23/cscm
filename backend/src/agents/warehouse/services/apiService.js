const BaseApiService = require('../../../services/BaseApiService');

class WarehouseApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/inventory/optimize') {
      return {
        sku_id: (data && data.sku_id) || '', store_id: (data && data.store_id) || '',
        reorder_quantity: 50, safety_stock: 25,
        recommendations: [{ action: 'maintain', confidence: 0.5 }],
        model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/routing/optimize') {
      return { routes: [{ waypoints: [], total_distance_km: 0 }], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/anomaly/detect') {
      return { anomalies: [], alerts: [], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/inventory/batch-optimize') {
      const skus = (data && data.skus) || (data && data.pairs) || [];
      return {
        recommendations: skus.map(s => ({
          sku_id: typeof s === 'string' ? s : s.sku,
          reorder_quantity: 50,
          safety_stock: 25
        })),
        results: (data && data.pairs ? data.pairs : []).map(p => ({
          sku_id: p.sku,
          store_id: p.store,
          reorder_quantity: 50
        })),
        total_savings: 0,
        model_version: 'fallback_v1'
      };
    }
    if (path === '/api/v1/vision/analyze') {
      return {
        detections: [],
        inventory_estimate: {},
        quality_issues: [],
        issues: [],
        score: 0.5,
        model_version: 'fallback_v1'
      };
    }
    return null;
  }

  async inventoryOptimization(data) {
    return this.call('post', '/api/v1/inventory/optimize', data, { allowFallback: true });
  }

  async routingOptimization(data) {
    return this.call('post', '/api/v1/routing/optimize', data, { allowFallback: true });
  }

  async anomalyDetection(data) {
    return this.call('post', '/api/v1/anomaly/detect', data, { allowFallback: true });
  }

  async batchOptimize(data) {
    return this.call('post', '/api/v1/inventory/batch-optimize', data, { allowFallback: true });
  }

  async visionAnalyze(data) {
    return this.call('post', '/api/v1/vision/analyze', data, { allowFallback: true });
  }
}

module.exports = WarehouseApiService;
