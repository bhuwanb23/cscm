const axios = require('axios');

/**
 * Base API Service for Customer Demand Agent
 * 
 * This service provides methods to communicate with the AI/ML API endpoints.
 */
class CustomerDemandApiService {
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
   * Call causal inference API
   * @param {Object} data - Causal inference data
   * @returns {Promise<Object>} Causal inference results
   */
  async causalInference(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/causal/infer`, data);
      return response.data;
    } catch (error) {
      console.error('Causal inference API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Call natural language processing API
   * @param {Object} data - NLP data
   * @returns {Promise<Object>} NLP results
   */
  async naturalLanguageProcessing(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/nlp/process`, data);
      return response.data;
    } catch (error) {
      console.error('Natural language processing API call failed:', error.message);
      throw error;
    }
  }
}

module.exports = CustomerDemandApiService;