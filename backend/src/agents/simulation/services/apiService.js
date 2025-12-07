const axios = require('axios');

/**
 * Base API Service for Simulation Agent
 * 
 * This service provides methods to communicate with the AI/ML API endpoints.
 */
class SimulationApiService {
  constructor() {
    // AI/ML API base URL - this should be configurable
    this.baseUrl = process.env.AI_ML_API_URL || 'http://localhost:8000';
  }

  /**
   * Call digital twin simulation API
   * @param {Object} data - Simulation data
   * @returns {Promise<Object>} Simulation results
   */
  async digitalTwinSimulation(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/digital-twin/simulate`, data);
      return response.data;
    } catch (error) {
      console.error('Digital twin simulation API call failed:', error.message);
      throw error;
    }
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
}

module.exports = SimulationApiService;