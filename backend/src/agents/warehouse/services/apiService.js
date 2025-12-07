const axios = require('axios');

/**
 * Base API Service for Warehouse Agent
 * 
 * This service provides methods to communicate with the AI/ML API endpoints.
 */
class WarehouseApiService {
  constructor() {
    // AI/ML API base URL - this should be configurable
    this.baseUrl = process.env.AI_ML_API_URL || 'http://localhost:8000';
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
   * Call routing optimization API
   * @param {Object} data - Routing data
   * @returns {Promise<Object>} Routing optimization results
   */
  async routingOptimization(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/routing/optimize`, data);
      return response.data;
    } catch (error) {
      console.error('Routing optimization API call failed:', error.message);
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

module.exports = WarehouseApiService;