const StockRecommender = require('../../../../agents/store/sub-agents/StockRecommender');

describe('StockRecommender', () => {
  const mockApiService = {};
  const storeId = 'STORE-001';
  let recommender;

  beforeEach(() => {
    recommender = new StockRecommender(storeId, mockApiService);
  });

  test('should set storeId and name on construction', () => {
    expect(recommender.storeId).toBe(storeId);
    expect(recommender.name).toBe('StockRecommender');
    expect(recommender.parentId).toBe('Store-STORE-001');
    expect(recommender.apiService).toBe(mockApiService);
  });

  describe('recommend', () => {
    const forecast = { expectedDemand: 140, currentStock: 60 };
    const productAttrs = { holdingCost: 0.5, shortageCost: 2.0, supplierId: 'SUP-001' };
    const suppliers = {
      'SUP-001': { onTimeDeliveryRate: 0.98, leadTimeDays: 5 }
    };

    test('should return a recommendation with all sections', async () => {
      const result = await recommender.recommend('PROD-001', 100, 40, forecast, productAttrs, suppliers);

      expect(result).toHaveProperty('supplierAnalysis');
      expect(result).toHaveProperty('adjustedQuantity');
      expect(result).toHaveProperty('orderTiming');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('costAnalysis');
    });

    test('should adjust quantity down for low-risk supplier', async () => {
      const result = await recommender.recommend('PROD-001', 100, 40, forecast, productAttrs, suppliers);
      expect(result.adjustedQuantity).toBe(95);
    });

    test('should adjust quantity up for high-risk supplier', async () => {
      const highRiskSuppliers = {
        'SUP-001': { onTimeDeliveryRate: 0.7, leadTimeDays: 10 }
      };
      const result = await recommender.recommend('PROD-001', 100, 40, forecast, productAttrs, highRiskSuppliers);
      expect(result.adjustedQuantity).toBe(120);
    });

    test('should not adjust quantity for medium-risk supplier', async () => {
      const medRiskSuppliers = {
        'SUP-001': { onTimeDeliveryRate: 0.9, leadTimeDays: 3 }
      };
      const result = await recommender.recommend('PROD-001', 100, 40, forecast, productAttrs, medRiskSuppliers);
      expect(result.adjustedQuantity).toBe(100);
    });
  });

  describe('_analyzeSupplier', () => {
    test('should return medium risk with no supplier info', () => {
      const result = recommender._analyzeSupplier(null);
      expect(result).toEqual({ riskLevel: 'medium', recommendation: 'Standard supplier' });
    });

    test('should return high risk for on-time rate below 0.8', () => {
      const result = recommender._analyzeSupplier({ onTimeDeliveryRate: 0.75 });
      expect(result.riskLevel).toBe('high');
      expect(result.recommendation).toContain('High-risk supplier');
    });

    test('should return low risk for on-time rate above 0.95', () => {
      const result = recommender._analyzeSupplier({ onTimeDeliveryRate: 0.98 });
      expect(result.riskLevel).toBe('low');
      expect(result.recommendation).toContain('Reliable supplier');
    });

    test('should return medium risk for on-time rate between 0.8 and 0.95', () => {
      const result = recommender._analyzeSupplier({ onTimeDeliveryRate: 0.9 });
      expect(result.riskLevel).toBe('medium');
      expect(result.recommendation).toContain('Standard supplier');
    });

    test('should default to 0.9 when onTimeDeliveryRate is missing', () => {
      const result = recommender._analyzeSupplier({});
      expect(result.riskLevel).toBe('medium');
    });
  });

  describe('_adjustQuantity', () => {
    test('should increase by 20% for high risk', () => {
      expect(recommender._adjustQuantity(100, 'high')).toBe(120);
    });

    test('should decrease by 5% for low risk', () => {
      expect(recommender._adjustQuantity(100, 'low')).toBe(95);
    });

    test('should not change for medium risk', () => {
      expect(recommender._adjustQuantity(100, 'medium')).toBe(100);
    });
  });

  describe('_calculateTiming', () => {
    test('should use provided supplier lead time and forecast stock', () => {
      const forecast = { expectedDemand: 140, currentStock: 60 };
      const supplierInfo = { leadTimeDays: 5 };
      const result = recommender._calculateTiming(forecast, {}, supplierInfo);

      expect(result.leadTimeDays).toBe(5);
      expect(result.daysUntilStockout).toBe(3);
      expect(result).toHaveProperty('recommendedOrderDate');
      expect(result).toHaveProperty('expectedDeliveryDate');
    });

    test('should default lead time to 3 when supplier info missing', () => {
      const forecast = { expectedDemand: 140, currentStock: 60 };
      const result = recommender._calculateTiming(forecast, {}, null);

      expect(result.leadTimeDays).toBe(3);
    });
  });

  describe('_assessRisk', () => {
    test('should return high stockout risk when daysUntilStockout is less than leadTime', () => {
      const result = recommender._assessRisk({}, 2, { leadTimeDays: 5 });
      expect(result.stockoutRisk).toBe('high');
    });

    test('should return low stockout risk when daysUntilStockout is greater than leadTime', () => {
      const result = recommender._assessRisk({}, 10, { leadTimeDays: 5 });
      expect(result.stockoutRisk).toBe('low');
    });

    test('should always return medium supplierRisk', () => {
      const result = recommender._assessRisk({}, 5, {});
      expect(result.supplierRisk).toBe('medium');
    });

    test('should default leadTime to 3 when supplierInfo is missing', () => {
      const result = recommender._assessRisk({}, 2, null);
      expect(result.stockoutRisk).toBe('high');
    });
  });

  describe('_analyzeCosts', () => {
    test('should calculate holding and shortage costs', () => {
      const result = recommender._analyzeCosts(100, { holdingCost: 1.0, shortageCost: 3.0 }, { expectedDemand: 200, currentStock: 50 });
      expect(result.estimatedHoldingCost).toBe(100);
      expect(result.estimatedShortageCost).toBe(150);
    });

    test('should use default costs when not provided', () => {
      const result = recommender._analyzeCosts(100, {}, { expectedDemand: 200, currentStock: 50 });
      expect(result.estimatedHoldingCost).toBe(50);
      expect(result.estimatedShortageCost).toBe(100);
    });

    test('should return zero shortage cost when stock covers demand', () => {
      const result = recommender._analyzeCosts(30, {}, { expectedDemand: 100, currentStock: 100 });
      expect(result.estimatedShortageCost).toBe(0);
    });
  });
});
