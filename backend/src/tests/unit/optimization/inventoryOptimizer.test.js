/**
 * Unit tests for inventory optimizer.
 */
const InventoryOptimizer = require('../../../optimization/inventoryOptimizer');

describe('InventoryOptimizer', () => {
  describe('calculateEOQ', () => {
    it('should calculate EOQ correctly', () => {
      // EOQ = sqrt(2 * 1000 * 50 / 2) = sqrt(50000) ≈ 224
      const eoq = InventoryOptimizer.calculateEOQ(1000, 50, 2);
      expect(eoq).toBe(224);
    });

    it('should return 0 for negative params', () => {
      expect(InventoryOptimizer.calculateEOQ(-100, 50, 2)).toBe(0);
      expect(InventoryOptimizer.calculateEOQ(100, -50, 2)).toBe(0);
      expect(InventoryOptimizer.calculateEOQ(100, 50, -2)).toBe(0);
    });
  });

  describe('calculateReorderPoint', () => {
    it('should calculate reorder point', () => {
      // ROP = (10 * 7) + 20 = 90
      const rop = InventoryOptimizer.calculateReorderPoint(10, 7, 20);
      expect(rop).toBe(90);
    });

    it('should handle zero safety stock', () => {
      const rop = InventoryOptimizer.calculateReorderPoint(10, 7, 0);
      expect(rop).toBe(70);
    });
  });

  describe('calculateSafetyStock', () => {
    it('should calculate safety stock', () => {
      const ss = InventoryOptimizer.calculateSafetyStock(10, 3, 7, 1, 0.95);
      expect(ss).toBeGreaterThan(0);
    });

    it('should return 0 for invalid params', () => {
      expect(InventoryOptimizer.calculateSafetyStock(-1, 3, 7, 1, 0.95)).toBe(0);
    });
  });

  describe('getZScore', () => {
    it('should return correct z-scores', () => {
      expect(InventoryOptimizer.getZScore(0.95)).toBe(1.645);
      expect(InventoryOptimizer.getZScore(0.99)).toBe(2.33);
      expect(InventoryOptimizer.getZScore(0.90)).toBe(1.28);
    });

    it('should default to 1.645 for unknown', () => {
      expect(InventoryOptimizer.getZScore(0.5)).toBe(1.645);
    });
  });

  describe('optimizeInventoryLevels', () => {
    it('should generate recommendations', () => {
      const products = [{
        productId: 'P1',
        annualDemand: 1000,
        dailyDemand: 3,
        orderingCost: 50,
        holdingCost: 2,
        leadTime: 7,
        currentStock: 10,
      }];
      const recs = InventoryOptimizer.optimizeInventoryLevels(products);
      expect(recs.length).toBe(1);
      expect(recs[0].productId).toBe('P1');
      expect(recs[0].eoq).toBeGreaterThan(0);
      expect(recs[0].action).toBeDefined();
    });
  });
});
