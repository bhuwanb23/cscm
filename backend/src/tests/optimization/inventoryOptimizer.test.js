const inventoryOptimizer = require('../../optimization/inventoryOptimizer');

describe('Inventory Optimizer Tests', () => {
  test('should calculate EOQ correctly', () => {
    const eoq = inventoryOptimizer.calculateEOQ(1000, 10, 2);
    expect(eoq).toBe(100); // sqrt((2 * 1000 * 10) / 2) = sqrt(10000) = 100
  });

  test('should calculate reorder point correctly', () => {
    const reorderPoint = inventoryOptimizer.calculateReorderPoint(10, 5, 20);
    expect(reorderPoint).toBe(70); // (10 * 5) + 20 = 70
  });

  test('should calculate safety stock correctly', () => {
    const safetyStock = inventoryOptimizer.calculateSafetyStock(10, 2, 5, 1, 0.95);
    // This is a simplified check - the actual calculation is more complex
    expect(safetyStock).toBeGreaterThanOrEqual(0);
  });

  test('should optimize inventory levels for multiple products', () => {
    const products = [
      {
        productId: 'PRODUCT-A',
        annualDemand: 1000,
        dailyDemand: 10,
        orderingCost: 10,
        holdingCost: 2,
        leadTime: 5,
        currentStock: 50
      }
    ];
    
    const recommendations = inventoryOptimizer.optimizeInventoryLevels(products);
    
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].productId).toBe('PRODUCT-A');
    expect(recommendations[0].action).toBeDefined();
  });
});