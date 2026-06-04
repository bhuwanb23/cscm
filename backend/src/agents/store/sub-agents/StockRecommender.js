const SubAgent = require('../../_base/SubAgent');

class StockRecommender extends SubAgent {
  constructor(storeId, apiService) {
    super('StockRecommender', `Store-${storeId}`, apiService);
    this.storeId = storeId;
  }

  async recommend(productId, optimalQuantity, reorderPoint, forecast, productAttrs = {}, suppliers = {}) {
    this.log(`Generating restock recommendation for product ${productId}`);

    const supplierId = productAttrs.supplierId;
    const supplierInfo = supplierId ? suppliers[supplierId] : null;

    const supplierAnalysis = this._analyzeSupplier(supplierInfo);
    const adjustedQuantity = this._adjustQuantity(optimalQuantity, supplierAnalysis.riskLevel);
    const orderTiming = this._calculateTiming(forecast, productAttrs, supplierInfo);
    const riskAssessment = this._assessRisk(forecast, orderTiming.daysUntilStockout, supplierInfo);
    const costAnalysis = this._analyzeCosts(adjustedQuantity, productAttrs, forecast);

    return {
      supplierAnalysis: supplierAnalysis.recommendation,
      adjustedQuantity,
      orderTiming,
      riskAssessment,
      costAnalysis
    };
  }

  _analyzeSupplier(supplierInfo) {
    if (!supplierInfo) {
      return { riskLevel: 'medium', recommendation: 'Standard supplier' };
    }
    const rate = supplierInfo.onTimeDeliveryRate || 0.9;
    if (rate < 0.8) {
      return { riskLevel: 'high', recommendation: `High-risk supplier (${Math.round(rate * 100)}% on-time)` };
    }
    if (rate > 0.95) {
      return { riskLevel: 'low', recommendation: `Reliable supplier (${Math.round(rate * 100)}% on-time)` };
    }
    return { riskLevel: 'medium', recommendation: `Standard supplier (${Math.round(rate * 100)}% on-time)` };
  }

  _adjustQuantity(optimalQuantity, riskLevel) {
    if (riskLevel === 'high') return Math.ceil(optimalQuantity * 1.2);
    if (riskLevel === 'low') return Math.ceil(optimalQuantity * 0.95);
    return optimalQuantity;
  }

  _calculateTiming(forecast, productAttrs, supplierInfo) {
    const leadTimeDays = (supplierInfo && supplierInfo.leadTimeDays) || 3;
    const currentStock = forecast.currentStock || 0;
    const dailyDemand = (forecast.expectedDemand || 100) / 7;
    const daysUntilStockout = dailyDemand > 0 ? Math.floor(currentStock / dailyDemand) : 0;

    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() + 1);
    const deliveryDate = new Date();
    deliveryDate.setDate(orderDate.getDate() + leadTimeDays);

    return {
      recommendedOrderDate: orderDate.toISOString().split('T')[0],
      expectedDeliveryDate: deliveryDate.toISOString().split('T')[0],
      daysUntilStockout,
      leadTimeDays
    };
  }

  _assessRisk(forecast, daysUntilStockout, supplierInfo) {
    const leadTime = (supplierInfo && supplierInfo.leadTimeDays) || 3;
    return {
      supplierRisk: 'medium',
      stockoutRisk: daysUntilStockout < leadTime ? 'high' : 'low'
    };
  }

  _analyzeCosts(adjustedQuantity, productAttrs, forecast) {
    return {
      estimatedHoldingCost: adjustedQuantity * (productAttrs.holdingCost || 0.5),
      estimatedShortageCost: Math.max(0, ((forecast.expectedDemand || 100) - (forecast.currentStock || 0) - adjustedQuantity)) * (productAttrs.shortageCost || 2.0)
    };
  }
}

module.exports = StockRecommender;
