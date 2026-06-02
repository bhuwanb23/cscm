const BaseApiService = require('../../../services/BaseApiService');

class CentralPlannerApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/demand/forecast') {
      return {
        forecast_values: [100], forecast_dates: [new Date().toISOString().slice(0, 10)],
        model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/inventory/optimize') {
      return { reorder_quantity: 50, safety_stock: 25, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/routing/optimize') {
      return { routes: [{ waypoints: [], total_distance_km: 0 }], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/supplier/risk') {
      return { risk_score: 0.5, risk_level: 'medium', model_version: 'fallback_v1' };
    }
    return null;
  }

  async demandForecast(data) {
    return this.call('post', '/api/v1/demand/forecast', data, { allowFallback: true });
  }

  async inventoryOptimization(data) {
    return this.call('post', '/api/v1/inventory/optimize', data, { allowFallback: true });
  }

  async routingOptimization(data) {
    return this.call('post', '/api/v1/routing/optimize', data, { allowFallback: true });
  }

  async supplierRiskAssessment(data) {
    return this.call('post', '/api/v1/supplier/risk', data, { allowFallback: true });
  }
}

module.exports = CentralPlannerApiService;
