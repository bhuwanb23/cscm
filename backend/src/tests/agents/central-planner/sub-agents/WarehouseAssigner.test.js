const WarehouseAssigner = require('../../../../agents/central-planner/sub-agents/WarehouseAssigner');

describe('WarehouseAssigner', () => {
  const mockApiService = {
    routingOptimization: jest.fn()
  };
  const agentId = 'CP-001';
  let assigner;

  beforeEach(() => {
    assigner = new WarehouseAssigner(agentId, mockApiService);
    jest.clearAllMocks();
  });

  test('should set name, parentId, and apiService on construction', () => {
    expect(assigner.name).toBe('WarehouseAssigner');
    expect(assigner.parentId).toBe(agentId);
    expect(assigner.apiService).toBe(mockApiService);
  });

  describe('assign', () => {
    const storeId = 'STORE-001';
    const inventory = { 'PROD-001': { quantity: 50 } };
    const demand = 30;
    const apiResult = { assignment: { warehouseId: 'WH-1', distance: 12, availableStock: 50 } };

    test('should return mapped assignment on success', async () => {
      mockApiService.routingOptimization.mockResolvedValue(apiResult);

      const result = await assigner.assign(storeId, inventory, demand);

      expect(mockApiService.routingOptimization).toHaveBeenCalledWith({
        store_id: storeId,
        inventory,
        demand
      });
      expect(result).toEqual(apiResult.assignment);
    });

    test('should throw when storeId is missing', async () => {
      await expect(assigner.assign(null, inventory)).rejects.toThrow('storeId is required');
      expect(mockApiService.routingOptimization).not.toHaveBeenCalled();
    });

    test('should throw when inventory is missing', async () => {
      await expect(assigner.assign(storeId, null)).rejects.toThrow('inventory is required');
      expect(mockApiService.routingOptimization).not.toHaveBeenCalled();
    });

    test('should return fallback assignment when API fails', async () => {
      mockApiService.routingOptimization.mockRejectedValue(new Error('API error'));

      const result = await assigner.assign(storeId, inventory, demand);

      expect(result).toEqual({
        warehouseId: 'WAREHOUSE-1',
        distance: 0,
        availableStock: 50,
        fallback: true
      });
    });

    test('should return fallback when API returns no assignment', async () => {
      mockApiService.routingOptimization.mockResolvedValue({});

      const result = await assigner.assign(storeId, inventory, demand);

      expect(result.fallback).toBe(true);
    });
  });

  describe('findNearestWarehouse', () => {
    const storeLoc = { lat: 40.7128, lng: -74.006 };
    const warehouses = [
      { id: 'WH-1', location: { lat: 40.7282, lng: -73.7949 } },
      { id: 'WH-2', location: { lat: 34.0522, lng: -118.2437 } }
    ];

    test('should return nearest warehouse by haversine distance', () => {
      const result = assigner.findNearestWarehouse(storeLoc, warehouses);
      expect(result.id).toBe('WH-1');
    });

    test('should return null when warehouse list is empty', () => {
      expect(assigner.findNearestWarehouse(storeLoc, [])).toBeNull();
    });

    test('should return null when warehouses is null', () => {
      expect(assigner.findNearestWarehouse(storeLoc, null)).toBeNull();
    });

    test('should skip warehouses without location', () => {
      const partial = [...warehouses, { id: 'WH-3' }];
      const result = assigner.findNearestWarehouse(storeLoc, partial);
      expect(result.id).toBe('WH-1');
    });
  });

  describe('_haversine', () => {
    test('should return correct distance between NYC and LA', () => {
      const nyc = { lat: 40.7128, lng: -74.006 };
      const la = { lat: 34.0522, lng: -118.2437 };
      const dist = assigner._haversine(nyc, la);
      expect(dist).toBeGreaterThan(3900);
      expect(dist).toBeLessThan(4000);
    });

    test('should return 0 for same point', () => {
      const p = { lat: 40.7128, lng: -74.006 };
      expect(assigner._haversine(p, p)).toBe(0);
    });

    test('should return Infinity for null points', () => {
      expect(assigner._haversine(null, { lat: 0, lng: 0 })).toBe(Infinity);
      expect(assigner._haversine({ lat: 0, lng: 0 }, null)).toBe(Infinity);
    });
  });

  describe('_fallbackAssignment', () => {
    test('should return fallback with computed stock', () => {
      const inventory = { 'PROD-001': { quantity: 30 }, 'PROD-002': { quantity: 20 } };
      const result = assigner._fallbackAssignment(inventory);
      expect(result).toEqual({
        warehouseId: 'WAREHOUSE-1',
        distance: 0,
        availableStock: 50,
        fallback: true
      });
    });

    test('should handle empty inventory', () => {
      const result = assigner._fallbackAssignment({});
      expect(result.availableStock).toBe(0);
    });

    test('should handle null inventory', () => {
      const result = assigner._fallbackAssignment(null);
      expect(result.availableStock).toBe(0);
    });
  });
});
