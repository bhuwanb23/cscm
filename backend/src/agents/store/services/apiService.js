const axios = require('axios');

/**
 * Base API Service for Store Agent
 *
 * Communicates with the AI/ML API endpoints with timeout, retry, and
 * graceful fallback when the service is unavailable.
 */
class StoreApiService {
  constructor(options = {}) {
    this.baseUrl = process.env.AI_ML_API_URL || options.baseUrl || 'http://localhost:8000';
    this.timeout = options.timeout || parseInt(process.env.AI_ML_API_TIMEOUT_MS, 10) || 10000;
    this.maxRetries = options.maxRetries || 2;
  }

  _buildClient() {
    return axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    });
  }

  async _request(method, path, data = null, attempt = 0) {
    const client = this._buildClient();
    try {
      const config = { method, url: path };
      if (data) config.data = data;
      const response = await client(config);
      return response.data;
    } catch (error) {
      const isNetworkOrTimeout = !error.response
        || error.code === 'ECONNABORTED'
        || error.code === 'ECONNREFUSED'
        || error.code === 'ETIMEDOUT';

      if (isNetworkOrTimeout && attempt < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._request(method, path, data, attempt + 1);
      }
      throw error;
    }
  }

  _fallbackForecast(skuId, storeId, horizon = 7) {
    const now = new Date();
    const dates = [];
    const values = [];
    for (let i = 0; i < horizon; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i + 1);
      dates.push(d.toISOString().slice(0, 10));
      values.push(100 + Math.round((Math.random() - 0.5) * 20));
    }
    return {
      sku_id: skuId, store_id: storeId,
      forecast_dates: dates, forecast_values: values,
      confidence_intervals: values.map(v => ({ lower: v - 15, upper: v + 15 })),
      model_version: 'fallback_v1',
      timestamp: now.toISOString(),
    };
  }

  async demandForecast(data, allowFallback = true) {
    try {
      return await this._request('post', '/api/v1/demand/forecast', data);
    } catch (error) {
      console.error(`Demand forecast API call failed: ${error.message}`);
      if (allowFallback) {
        console.warn('Using fallback forecast');
        return this._fallbackForecast(data.sku_id, data.store_id, data.forecast_horizon || 7);
      }
      throw error;
    }
  }

  async batchDemandForecast(data) {
    return this._request('post', '/api/v1/demand/batch-forecast', data);
  }

  async getBatchForecastJobStatus(jobId) {
    return this._request('get', `/api/v1/demand/forecast-job/${jobId}`);
  }

  async inventoryOptimization(data, allowFallback = true) {
    try {
      return await this._request('post', '/api/v1/inventory/optimize', data);
    } catch (error) {
      console.error(`Inventory optimization API call failed: ${error.message}`);
      if (allowFallback) {
        console.warn('Using fallback inventory recommendation');
        return {
          sku_id: data.sku_id, store_id: data.store_id,
          reorder_quantity: Math.round((data.current_stock || 100) * 0.5),
          safety_stock: Math.round((data.current_stock || 100) * 0.25),
          recommendations: [{ action: 'maintain', confidence: 0.5 }],
          model_version: 'fallback_v1',
        };
      }
      throw error;
    }
  }

  async anomalyDetection(data, allowFallback = true) {
    try {
      return await this._request('post', '/api/v1/anomaly/detect', data);
    } catch (error) {
      console.error(`Anomaly detection API call failed: ${error.message}`);
      if (allowFallback) {
        console.warn('Using fallback anomaly detection');
        return { anomalies: [], alerts: [], model_version: 'fallback_v1' };
      }
      throw error;
    }
  }
}

module.exports = StoreApiService;