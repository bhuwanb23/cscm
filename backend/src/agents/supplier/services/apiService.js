const axios = require('axios');

/**
 * Base API Service for Supplier Agent
 * 
 * This service provides methods to communicate with the AI/ML API endpoints.
 */
class SupplierApiService {
  constructor() {
    // AI/ML API base URL - this should be configurable
    this.baseUrl = process.env.AI_ML_API_URL || 'http://localhost:8000';
  }

  /**
   * Call supplier risk assessment API
   * @param {Object} data - Supplier data
   * @returns {Promise<Object>} Risk assessment results
   */
  async supplierRiskAssessment(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/supplier/risk`, data);
      return response.data;
    } catch (error) {
      console.error('Supplier risk assessment API call failed:', error.message);
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

module.exports = SupplierApiService;