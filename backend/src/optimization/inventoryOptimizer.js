/**
 * Inventory Optimizer
 * 
 * Provides simple inventory optimization algorithms for local development.
 * This includes basic reorder point calculation and economic order quantity.
 */

class InventoryOptimizer {
  /**
   * Calculate Economic Order Quantity (EOQ)
   * @param {number} annualDemand - Annual demand for the product
   * @param {number} orderingCost - Cost to place an order
   * @param {number} holdingCost - Annual holding cost per unit
   * @returns {number} - Optimal order quantity
   */
  calculateEOQ(annualDemand, orderingCost, holdingCost) {
    try {
      if (annualDemand <= 0 || orderingCost <= 0 || holdingCost <= 0) {
        throw new Error('All parameters must be positive');
      }
      
      const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
      return Math.round(eoq);
    } catch (error) {
      console.error('Inventory Optimizer: Failed to calculate EOQ:', error.message);
      return 0;
    }
  }

  /**
   * Calculate Reorder Point
   * @param {number} dailyDemand - Average daily demand
   * @param {number} leadTime - Lead time in days
   * @param {number} safetyStock - Safety stock level
   * @returns {number} - Reorder point
   */
  calculateReorderPoint(dailyDemand, leadTime, safetyStock = 0) {
    try {
      if (dailyDemand < 0 || leadTime < 0 || safetyStock < 0) {
        throw new Error('Parameters must be non-negative');
      }
      
      const reorderPoint = (dailyDemand * leadTime) + safetyStock;
      return Math.round(reorderPoint);
    } catch (error) {
      console.error('Inventory Optimizer: Failed to calculate reorder point:', error.message);
      return 0;
    }
  }

  /**
   * Calculate Safety Stock
   * @param {number} dailyDemand - Average daily demand
   * @param {number} demandStdDev - Standard deviation of daily demand
   * @param {number} leadTime - Lead time in days
   * @param {number} leadTimeStdDev - Standard deviation of lead time
   * @param {number} serviceLevel - Desired service level (0.0 - 1.0)
   * @returns {number} - Safety stock level
   */
  calculateSafetyStock(dailyDemand, demandStdDev, leadTime, leadTimeStdDev, serviceLevel = 0.95) {
    try {
      if (dailyDemand < 0 || demandStdDev < 0 || leadTime < 0 || leadTimeStdDev < 0 || serviceLevel < 0 || serviceLevel > 1) {
        throw new Error('Invalid parameters');
      }
      
      // Z-score for service level (approximation)
      const zScore = this.getZScore(serviceLevel);
      
      // Safety stock formula
      const term1 = Math.pow(zScore * demandStdDev * Math.sqrt(leadTime), 2);
      const term2 = Math.pow(zScore * dailyDemand * leadTimeStdDev, 2);
      const safetyStock = Math.sqrt(term1 + term2);
      
      return Math.round(safetyStock);
    } catch (error) {
      console.error('Inventory Optimizer: Failed to calculate safety stock:', error.message);
      return 0;
    }
  }

  /**
   * Get Z-score for a given service level
   * @param {number} serviceLevel - Service level (0.0 - 1.0)
   * @returns {number} - Z-score
   */
  getZScore(serviceLevel) {
    // Approximation for common service levels
    const zScores = {
      0.99: 2.33,
      0.95: 1.645,
      0.90: 1.28,
      0.85: 1.04,
      0.80: 0.84
    };
    
    return zScores[serviceLevel] || 1.645; // Default to 95%
  }

  /**
   * Optimize inventory levels for multiple products
   * @param {Array} products - Array of product data
   * @returns {Array} - Optimized inventory recommendations
   */
  optimizeInventoryLevels(products) {
    try {
      const recommendations = [];
      
      for (const product of products) {
        const {
          productId,
          annualDemand,
          dailyDemand,
          orderingCost,
          holdingCost,
          leadTime,
          demandStdDev = 0,
          leadTimeStdDev = 0,
          currentStock = 0
        } = product;
        
        // Calculate optimal values
        const eoq = this.calculateEOQ(annualDemand, orderingCost, holdingCost);
        const safetyStock = this.calculateSafetyStock(dailyDemand, demandStdDev, leadTime, leadTimeStdDev);
        const reorderPoint = this.calculateReorderPoint(dailyDemand, leadTime, safetyStock);
        
        // Determine action needed
        let action = 'none';
        let quantity = 0;
        
        if (currentStock <= reorderPoint) {
          action = 'order';
          quantity = eoq;
        } else if (currentStock > (reorderPoint + eoq * 2)) {
          action = 'reduce';
          quantity = currentStock - (reorderPoint + eoq);
        }
        
        recommendations.push({
          productId,
          eoq,
          safetyStock,
          reorderPoint,
          currentStock,
          action,
          quantity,
          timestamp: new Date().toISOString()
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Inventory Optimizer: Failed to optimize inventory levels:', error.message);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new InventoryOptimizer();