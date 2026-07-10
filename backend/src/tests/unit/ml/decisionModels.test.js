/**
 * Unit tests for ML decision models.
 */
const DecisionModels = require('../../../ml/decisionModels');

describe('DecisionModels', () => {
  describe('simpleForecast', () => {
    it('should return forecasts', () => {
      const forecasts = DecisionModels.simpleForecast([10, 20, 30], 3);
      expect(forecasts.length).toBe(3);
      forecasts.forEach(f => expect(f).toBeGreaterThanOrEqual(0));
    });

    it('should handle empty data', () => {
      const forecasts = DecisionModels.simpleForecast([], 5);
      expect(forecasts).toEqual([0, 0, 0, 0, 0]);
    });

    it('should handle null data', () => {
      const forecasts = DecisionModels.simpleForecast(null, 3);
      expect(forecasts).toEqual([0, 0, 0]);
    });
  });

  describe('assessRisk', () => {
    it('should classify low risk', () => {
      const risk = DecisionModels.assessRisk({
        inventoryLevel: 100, demandRate: 10, leadTime: 2, supplierReliability: 0.99,
      });
      expect(risk).toBe('low');
    });

    it('should classify high risk', () => {
      const risk = DecisionModels.assessRisk({
        inventoryLevel: 5, demandRate: 150, leadTime: 15, supplierReliability: 0.5,
      });
      expect(risk).toBe('high');
    });

    it('should classify medium risk', () => {
      const risk = DecisionModels.assessRisk({
        inventoryLevel: 20, demandRate: 60, leadTime: 8, supplierReliability: 0.85,
      });
      expect(risk).toBe('medium');
    });
  });

  describe('optimizePrice', () => {
    it('should increase price when cheaper than competitor', () => {
      const price = DecisionModels.optimizePrice(70, -1.5, 100);
      expect(price).toBeGreaterThan(70);
    });

    it('should decrease price when more expensive', () => {
      const price = DecisionModels.optimizePrice(150, -1.5, 100);
      expect(price).toBeLessThan(150);
    });

    it('should keep price stable when competitive', () => {
      const price = DecisionModels.optimizePrice(100, -1.5, 100);
      expect(price).toBe(100);
    });
  });

  describe('segmentCustomers', () => {
    it('should segment customers', () => {
      const customers = [
        { purchaseFrequency: 15, averagePurchaseValue: 200 },
        { purchaseFrequency: 3, averagePurchaseValue: 30 },
        { purchaseFrequency: 1, averagePurchaseValue: 10 },
      ];
      const segmented = DecisionModels.segmentCustomers(customers);
      expect(segmented[0].segment).toBe('platinum');
      expect(segmented[1].segment).toBe('silver');
      expect(segmented[2].segment).toBe('bronze');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect outliers', () => {
      const data = [10, 10, 10, 10, 10, 10, 10, 100];
      const anomalies = DecisionModels.detectAnomalies(data);
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].value).toBe(100);
    });

    it('should handle small data', () => {
      const anomalies = DecisionModels.detectAnomalies([1, 2]);
      expect(anomalies).toEqual([]);
    });

    it('should handle null data', () => {
      const anomalies = DecisionModels.detectAnomalies(null);
      expect(anomalies).toEqual([]);
    });
  });
});
