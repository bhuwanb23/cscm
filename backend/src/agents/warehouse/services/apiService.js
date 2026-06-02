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
}

module.exports = WarehouseApiService;
