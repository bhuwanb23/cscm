/**
 * Lightweight ML Models for Decision Making
 * 
 * Provides simple machine learning models for local decision making.
 * These are lightweight implementations suitable for local development.
 */

class DecisionModels {
  /**
   * Simple demand forecasting model
   * @param {Array} historicalData - Historical demand data
   * @param {number} periods - Number of periods to forecast
   * @returns {Array} - Forecasted demand
   */
  simpleForecast(historicalData, periods = 1) {
    try {
      if (!historicalData || historicalData.length === 0) {
        return Array(periods).fill(0);
      }
      
      // Simple moving average forecast
      const sum = historicalData.reduce((acc, val) => acc + val, 0);
      const average = sum / historicalData.length;
      
      // Add some randomness to make it more realistic
      const forecasts = [];
      for (let i = 0; i < periods; i++) {
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        forecasts.push(Math.max(0, Math.round(average * (1 + variation))));
      }
      
      return forecasts;
    } catch (error) {
      console.error('Decision Models: Failed to generate forecast:', error.message);
      return Array(periods).fill(0);
    }
  }

  /**
   * Simple classification model for risk assessment
   * @param {Object} features - Input features
   * @returns {string} - Risk level (low, medium, high)
   */
  assessRisk(features) {
    try {
      const { inventoryLevel, demandRate, leadTime, supplierReliability } = features;
      
      // Simple rule-based risk assessment
      let riskScore = 0;
      
      // Low inventory increases risk
      if (inventoryLevel < 10) riskScore += 3;
      else if (inventoryLevel < 30) riskScore += 1;
      
      // High demand increases risk
      if (demandRate > 100) riskScore += 2;
      else if (demandRate > 50) riskScore += 1;
      
      // Long lead time increases risk
      if (leadTime > 10) riskScore += 2;
      else if (leadTime > 5) riskScore += 1;
      
      // Poor supplier reliability increases risk
      if (supplierReliability < 0.8) riskScore += 3;
      else if (supplierReliability < 0.9) riskScore += 1;
      
      // Determine risk level based on score
      if (riskScore >= 6) return 'high';
      if (riskScore >= 3) return 'medium';
      return 'low';
    } catch (error) {
      console.error('Decision Models: Failed to assess risk:', error.message);
      return 'medium'; // Default to medium risk
    }
  }

  /**
   * Simple regression model for price optimization
   * @param {number} basePrice - Base product price
   * @param {number} demandElasticity - Price elasticity of demand
   * @param {number} competitorPrice - Competitor's price
   * @returns {number} - Optimal price
   */
  optimizePrice(basePrice, demandElasticity, competitorPrice) {
    try {
      // Simple price optimization model
      // This is a simplified version - in reality, this would be much more complex
      
      // If we're significantly cheaper than competitors, we can increase price
      if (basePrice < competitorPrice * 0.8) {
        return Math.min(basePrice * 1.1, competitorPrice * 0.95);
      }
      
      // If we're significantly more expensive, we should decrease price
      if (basePrice > competitorPrice * 1.2) {
        return Math.max(basePrice * 0.9, competitorPrice * 1.05);
      }
      
      // Otherwise, keep price stable
      return basePrice;
    } catch (error) {
      console.error('Decision Models: Failed to optimize price:', error.message);
      return basePrice; // Return base price if optimization fails
    }
  }

  /**
   * Simple clustering model for customer segmentation
   * @param {Array} customers - Array of customer data
   * @returns {Array} - Segmented customers
   */
  segmentCustomers(customers) {
    try {
      // Simple customer segmentation based on purchase frequency and value
      return customers.map(customer => {
        const { purchaseFrequency, averagePurchaseValue } = customer;
        
        let segment = 'bronze';
        
        if (purchaseFrequency > 10 && averagePurchaseValue > 100) {
          segment = 'platinum';
        } else if (purchaseFrequency > 5 && averagePurchaseValue > 50) {
          segment = 'gold';
        } else if (purchaseFrequency > 2 && averagePurchaseValue > 20) {
          segment = 'silver';
        }
        
        return {
          ...customer,
          segment
        };
      });
    } catch (error) {
      console.error('Decision Models: Failed to segment customers:', error.message);
      return customers; // Return original customers if segmentation fails
    }
  }

  /**
   * Simple anomaly detection model
   * @param {Array} data - Time series data
   * @returns {Array} - Anomalies detected
   */
  detectAnomalies(data) {
    try {
      if (!data || data.length < 3) {
        return [];
      }
      
      // Simple statistical anomaly detection
      const sum = data.reduce((acc, val) => acc + val, 0);
      const mean = sum / data.length;
      
      // Calculate standard deviation
      const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
      const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
      const stdDev = Math.sqrt(avgSquaredDiff);
      
      // Detect anomalies (values more than 2 standard deviations from mean)
      const anomalies = [];
      data.forEach((value, index) => {
        if (Math.abs(value - mean) > 2 * stdDev) {
          anomalies.push({
            index,
            value,
            deviation: Math.abs(value - mean) / stdDev
          });
        }
      });
      
      return anomalies;
    } catch (error) {
      console.error('Decision Models: Failed to detect anomalies:', error.message);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new DecisionModels();