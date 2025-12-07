const axios = require('axios');

/**
 * Base API Service for Store Agent
 * 
 * This service provides methods to communicate with the AI/ML API endpoints.
 */
class StoreApiService {
  constructor() {
    // AI/ML API base URL - this should be configurable
    this.baseUrl = process.env.AI_ML_API_URL || 'http://localhost:8000';
  }

  /**
   * Call demand forecasting API
   * @param {Object} data - Forecasting data
   * @returns {Promise<Object>} Forecast results
   */
  async demandForecast(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/demand/forecast`, data);
      return response.data;
    } catch (error) {
      console.error('Demand forecast API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Call batch demand forecasting API
   * @param {Object} data - Batch forecasting data
   * @returns {Promise<Object>} Batch forecast job information
   */
  async batchDemandForecast(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/demand/batch-forecast`, data);
      return response.data;
    } catch (error) {
      console.error('Batch demand forecast API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Get batch forecast job status
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job status
   */
  async getBatchForecastJobStatus(jobId) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/demand/forecast-job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Get batch forecast job status API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Call inventory optimization API
   * @param {Object} data - Inventory data
   * @returns {Promise<Object>} Optimization results
   */
  async inventoryOptimization(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/inventory/optimize`, data);
      return response.data;
    } catch (error) {
      console.error('Inventory optimization API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Call anomaly detection API
   * @param {Object} data - Anomaly detection data
   * @returns {Promise<Object>} Anomaly detection results
   */
  async anomalyDetection(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/anomaly/detect`, data);
      return response.data;
    } catch (error) {
      console.error('Anomaly detection API call failed:', error.message);
      throw error;
    }
  }
}

module.exports = StoreApiService;