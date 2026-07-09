const InventoryOptimizer = require('../../../../agents/store/sub-agents/InventoryOptimizer');

describe('InventoryOptimizer', () => {
  const mockApiService = {
    inventoryOptimization: jest.fn()
  };
  const storeId = 'STORE-001';
  let optimizer;

  beforeEach(() => {
    optimizer = new InventoryOptimizer(storeId, mockApiService);
    jest.clearAllMocks();
  });

  test('should set storeId and name on construction', () => {
    expect(optimizer.storeId).toBe(storeId);
    expect(optimizer.name).toBe('InventoryOptimizer');
    expect(optimizer.parentId).toBe('Store-STORE-001');
    expect(optimizer.apiService).toBe(mockApiService);
  });

  describe('optimize', () => {
    const productId = 'PROD-001';
    const currentStock = 50;
    const forecast = { expectedDemand: 100, dailyForecasts: [15, 14, 15, 13, 14, 15, 14] };
    const apiResponse = {
      reorder_point: 30,
      order_quantity: 80,
      safety_stock: 15,
      recommendations: [{ action: 'reorder', confidence: 0.8 }]
    };

    test('should return optimization result on success', async () => {
      mockApiService.inventoryOptimization.mockResolvedValue(apiResponse);

      const result = await optimizer.optimize(productId, currentStock, forecast);

      expect(mockApiService.inventoryOptimization).toHaveBeenCalledWith({
        product_id: productId,
        store_id: storeId,
        current_stock: currentStock,
        forecast,
        product_attributes: {},
        suppliers: {}
      });
      expect(result).toBe(apiResponse);
    });

    test('should pass productAttributes and suppliers when provided', async () => {
      mockApiService.inventoryOptimization.mockResolvedValue(apiResponse);
      const attrs = { category: 'electronics' };
      const suppliers = { 'SUP-001': { name: 'Test Supplier' } };

      await optimizer.optimize(productId, currentStock, forecast, attrs, suppliers);

      expect(mockApiService.inventoryOptimization).toHaveBeenCalledWith(
        expect.objectContaining({ product_attributes: attrs, suppliers })
      );
    });

    test('should throw when productId is missing', async () => {
      await expect(optimizer.optimize(null, currentStock, forecast)).rejects.toThrow('productId is required');
      expect(mockApiService.inventoryOptimization).not.toHaveBeenCalled();
    });

    test('should throw when currentStock is missing', async () => {
      await expect(optimizer.optimize(productId, undefined, forecast)).rejects.toThrow('currentStock is required');
      expect(mockApiService.inventoryOptimization).not.toHaveBeenCalled();
    });

    test('should throw when currentStock is null', async () => {
      await expect(optimizer.optimize(productId, null, forecast)).rejects.toThrow('currentStock is required');
      expect(mockApiService.inventoryOptimization).not.toHaveBeenCalled();
    });

    test('should throw when API call fails', async () => {
      mockApiService.inventoryOptimization.mockRejectedValue(new Error('Service unavailable'));
      await expect(optimizer.optimize(productId, currentStock, forecast)).rejects.toThrow('Service unavailable');
    });
  });

  describe('needsRestock', () => {
    test('should return true when current stock is below reorder point', () => {
      expect(optimizer.needsRestock(20, 30)).toBe(true);
    });

    test('should return false when current stock is above reorder point', () => {
      expect(optimizer.needsRestock(40, 30)).toBe(false);
    });

    test('should return false when current stock equals reorder point', () => {
      expect(optimizer.needsRestock(30, 30)).toBe(false);
    });
  });

  describe('urgencyLevel', () => {
    test('should return high when stock is below half of reorder point', () => {
      expect(optimizer.urgencyLevel(10, 30)).toBe('high');
    });

    test('should return normal when stock is below reorder point but above half', () => {
      expect(optimizer.urgencyLevel(20, 30)).toBe('normal');
    });

    test('should return none when stock is above reorder point', () => {
      expect(optimizer.urgencyLevel(40, 30)).toBe('none');
    });
  });
});
