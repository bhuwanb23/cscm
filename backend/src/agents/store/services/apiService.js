const BaseApiService = require('../../../services/BaseApiService');

class StoreApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/demand/forecast') {
      const now = new Date();
      const horizon = (data && data.forecast_horizon) || 7;
      const dates = [];
      const values = [];
      for (let i = 0; i < horizon; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i + 1);
        dates.push(d.toISOString().slice(0, 10));
        values.push(100);
      }
      return {
        sku_id: (data && data.sku_id) || '',
        store_id: (data && data.store_id) || '',
        forecast_dates: dates, forecast_values: values,
        confidence_intervals: values.map(v => ({ lower: v - 15, upper: v + 15 })),
        model_version: 'fallback_v1',
        timestamp: now.toISOString(),
      };
    }
    if (path === '/api/v1/inventory/optimize') {
      const currentStock = (data && data.current_stock) || 100;
      return {
        sku_id: (data && data.sku_id) || '',
        store_id: (data && data.store_id) || '',
        reorder_quantity: Math.round(currentStock * 0.5),
        safety_stock: Math.round(currentStock * 0.25),
        recommendations: [{ action: 'maintain', confidence: 0.5 }],
        model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/anomaly/detect') {
      return { anomalies: [], alerts: [], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/learning/strategic-update') {
      return {
        model_version: 'fallback_v1',
        training_metrics: { loss: 0, accuracy: 0, samples_seen: 0 },
        updated_at: new Date().toISOString()
      };
    }
    return null;
  }

  async demandForecast(data, allowFallback = true) {
    return this.call('post', '/api/v1/demand/forecast', data, { allowFallback });
  }

  async batchDemandForecast(data) {
    return this.call('post', '/api/v1/demand/batch-forecast', data, { allowFallback: false });
  }

  async getBatchForecastJobStatus(jobId) {
    return this.call('get', `/api/v1/demand/forecast-job/${jobId}`, null, { allowFallback: false });
  }

  async inventoryOptimization(data, allowFallback = true) {
    return this.call('post', '/api/v1/inventory/optimize', data, { allowFallback });
  }

  async anomalyDetection(data, allowFallback = true) {
    return this.call('post', '/api/v1/anomaly/detect', data, { allowFallback });
  }

  async strategicUpdate(data) {
    return this.call('post', '/api/v1/learning/strategic-update', data, { allowFallback: true });
  }
}

module.exports = StoreApiService;
