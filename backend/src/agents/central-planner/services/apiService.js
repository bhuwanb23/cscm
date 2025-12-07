const axios = require('axios');

/**
 * Base API Service for Central Planner Agent
 * 
 * This service provides methods to communicate with the AI/ML API endpoints.
 */
class CentralPlannerApiService {
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
}

module.exports = CentralPlannerApiService;