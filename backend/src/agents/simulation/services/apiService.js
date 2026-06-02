const BaseApiService = require('../../../services/BaseApiService');

class SimulationApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/digital-twin/simulate') {
      return { simulation_id: 'fallback', status: 'completed', results: {}, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/demand/forecast') {
      return {
        forecast_values: [100], forecast_dates: [new Date().toISOString().slice(0, 10)],
        model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/inventory/optimize') {
      return { reorder_quantity: 50, safety_stock: 25, model_version: 'fallback_v1' };
    }
    return null;
  }

  async digitalTwinSimulation(data) {
    return this.call('post', '/api/v1/digital-twin/simulate', data, { allowFallback: true });
  }

  async demandForecast(data) {
    return this.call('post', '/api/v1/demand/forecast', data, { allowFallback: true });
  }

  async inventoryOptimization(data) {
    return this.call('post', '/api/v1/inventory/optimize', data, { allowFallback: true });
  }
}

module.exports = SimulationApiService;
