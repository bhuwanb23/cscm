const EventGenerator = require('../../../../agents/simulation/sub-agents/EventGenerator');

describe('EventGenerator', () => {
  const mockApiService = {
    demandForecast: jest.fn(),
    inventoryOptimization: jest.fn()
  };
  const agentId = 'SIM-001';
  let generator;

  beforeEach(() => {
    generator = new EventGenerator(agentId, mockApiService);
    jest.clearAllMocks();
  });

  test('should set name, parentId, and apiService on construction', () => {
    expect(generator.name).toBe('EventGenerator');
    expect(generator.parentId).toBe(agentId);
    expect(generator.apiService).toBe(mockApiService);
  });

  describe('generateDemandSpike', () => {
    const meta = { storeId: 'STORE-001', productId: 'PROD-001', magnitude: 0.5, durationDays: 7 };
    const apiResult = { expected_demand: 250, confidence: 0.9 };

    test('should return mapped demand spike on success', async () => {
      mockApiService.demandForecast.mockResolvedValue(apiResult);

      const result = await generator.generateDemandSpike(meta);

      expect(mockApiService.demandForecast).toHaveBeenCalledWith({
        event_type: 'demand_spike',
        store_id: 'STORE-001',
        product_id: 'PROD-001',
        magnitude: 0.5,
        duration_days: 7
      });
      expect(result).toEqual({
        eventType: 'demand_spike',
        storeId: 'STORE-001',
        expectedImpact: 250,
        forecast: apiResult,
        timestamp: expect.any(String)
      });
    });

    test('should use defaults when meta is empty', async () => {
      mockApiService.demandForecast.mockResolvedValue({ expected_demand: 100 });

      const result = await generator.generateDemandSpike({});

      expect(mockApiService.demandForecast).toHaveBeenCalledWith({
        event_type: 'demand_spike',
        store_id: undefined,
        product_id: 'PROD-001',
        magnitude: 0.3,
        duration_days: 3
      });
      expect(result.eventType).toBe('demand_spike');
    });

    test('should return fallback when API fails', async () => {
      mockApiService.demandForecast.mockRejectedValue(new Error('API error'));

      const result = await generator.generateDemandSpike(meta);

      expect(result.eventType).toBe('demand_spike');
      expect(result.storeId).toBe('STORE-001');
      expect(result.fallback).toBe(true);
      expect(result.expectedImpact).toBeGreaterThanOrEqual(100);
    });
  });

  describe('generateInventoryUpdate', () => {
    const meta = { storeId: 'STORE-001', productId: 'PROD-002', currentStock: 80 };
    const apiResult = { order_quantity: 120, reorder_point: 30 };

    test('should return mapped inventory update on success', async () => {
      mockApiService.inventoryOptimization.mockResolvedValue(apiResult);

      const result = await generator.generateInventoryUpdate(meta);

      expect(mockApiService.inventoryOptimization).toHaveBeenCalledWith({
        event_type: 'inventory_update',
        store_id: 'STORE-001',
        product_id: 'PROD-002',
        current_stock: 80
      });
      expect(result).toEqual({
        eventType: 'inventory_update',
        storeId: 'STORE-001',
        optimalQuantity: 120,
        reorderPoint: 30,
        timestamp: expect.any(String)
      });
    });

    test('should use defaults when meta is empty', async () => {
      mockApiService.inventoryOptimization.mockResolvedValue({ order_quantity: 50, reorder_point: 20 });

      await generator.generateInventoryUpdate({});

      expect(mockApiService.inventoryOptimization).toHaveBeenCalledWith({
        event_type: 'inventory_update',
        store_id: undefined,
        product_id: 'PROD-001',
        current_stock: 100
      });
    });

    test('should return fallback when API fails', async () => {
      mockApiService.inventoryOptimization.mockRejectedValue(new Error('API error'));

      const result = await generator.generateInventoryUpdate(meta);

      expect(result.eventType).toBe('inventory_update');
      expect(result.fallback).toBe(true);
      expect(result.optimalQuantity).toBe(50);
      expect(result.reorderPoint).toBe(20);
    });
  });

  describe('generateGenericEvent', () => {
    test('should return event with type and payload', () => {
      const result = generator.generateGenericEvent('alert', { severity: 'high' });
      expect(result.eventType).toBe('alert');
      expect(result.severity).toBe('high');
      expect(result.timestamp).toEqual(expect.any(String));
    });

    test('should work with only event type', () => {
      const result = generator.generateGenericEvent('test');
      expect(result.eventType).toBe('test');
      expect(result.timestamp).toEqual(expect.any(String));
    });
  });
});
