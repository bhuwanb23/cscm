const PickingOptimizer = require('../../../../backend/src/agents/warehouse/sub-agents/PickingOptimizer');

const mockApiService = {
  routingOptimization: jest.fn()
};

describe('PickingOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new PickingOptimizer('WH-01', mockApiService);
  });

  describe('constructor', () => {
    it('should set warehouseId and call super with correct args', () => {
      expect(optimizer.name).toBe('PickingOptimizer');
      expect(optimizer.parentId).toBe('Warehouse-WH-01');
      expect(optimizer.apiService).toBe(mockApiService);
      expect(optimizer.warehouseId).toBe('WH-01');
    });
  });

  describe('optimizePickingQueue', () => {
    const pickingQueue = [
      { id: 1, priority: 'low' },
      { id: 2, priority: 'high' },
      { id: 3, priority: 'normal' }
    ];
    const warehouseLayout = { zones: {} };
    const inventory = {};

    it('should return optimized sequence from API on success', async () => {
      mockApiService.routingOptimization.mockResolvedValue({
        optimized_picking_sequence: [{ id: 2 }, { id: 3 }, { id: 1 }]
      });

      const result = await optimizer.optimizePickingQueue(pickingQueue, warehouseLayout, inventory);

      expect(mockApiService.routingOptimization).toHaveBeenCalledWith({
        warehouse_id: 'WH-01',
        picking_queue: pickingQueue,
        warehouse_layout: warehouseLayout,
        inventory
      });
      expect(result).toEqual([{ id: 2 }, { id: 3 }, { id: 1 }]);
    });

    it('should return fallback sorted queue when API rejects', async () => {
      mockApiService.routingOptimization.mockRejectedValue(new Error('API timeout'));

      const result = await optimizer.optimizePickingQueue(pickingQueue, warehouseLayout, inventory);

      expect(result).toEqual([
        { id: 2, priority: 'high' },
        { id: 3, priority: 'normal' },
        { id: 1, priority: 'low' }
      ]);
    });

    it('should return empty array for null queue', async () => {
      const result = await optimizer.optimizePickingQueue(null, warehouseLayout, inventory);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty queue', async () => {
      const result = await optimizer.optimizePickingQueue([], warehouseLayout, inventory);
      expect(result).toEqual([]);
    });
  });

  describe('generateRoute', () => {
    const pickingTask = { id: 'T1' };
    const warehouseLayout = { zones: {} };

    it('should return route from API on success', async () => {
      mockApiService.routingOptimization.mockResolvedValue({
        picking_route: ['A1', 'B2', 'C3']
      });

      const result = await optimizer.generateRoute(pickingTask, warehouseLayout);

      expect(mockApiService.routingOptimization).toHaveBeenCalledWith({
        warehouse_id: 'WH-01',
        picking_task: pickingTask,
        warehouse_layout: warehouseLayout
      });
      expect(result).toEqual(['A1', 'B2', 'C3']);
    });

    it('should return null when API rejects', async () => {
      mockApiService.routingOptimization.mockRejectedValue(new Error('Route error'));

      const result = await optimizer.generateRoute(pickingTask, warehouseLayout);

      expect(result).toBeNull();
    });
  });

  describe('_fallbackOptimize', () => {
    it('should sort queue by priority (high, normal, low)', () => {
      const queue = [
        { id: 1, priority: 'low' },
        { id: 2, priority: 'high' },
        { id: 3, priority: 'normal' },
        { id: 4 }
      ];

      const result = optimizer._fallbackOptimize(queue);

      expect(result.map(i => i.id)).toEqual([2, 3, 1, 4]);
    });
  });

  describe('estimatePickTime', () => {
    it('should return 60 for null locationInfo', () => {
      expect(optimizer.estimatePickTime(null)).toBe(60);
    });

    it('should compute time based on distance', () => {
      expect(optimizer.estimatePickTime({ distanceFromStart: 10 })).toBe(50);
    });

    it('should use base time when no distance', () => {
      expect(optimizer.estimatePickTime({})).toBe(30);
    });
  });

  describe('getItemLocation', () => {
    const layout = {
      zones: {
        zoneA: {
          name: 'Zone A',
          aisles: {
            aisle1: {
              name: 'Aisle 1',
              products: { 'PROD-1': { shelf: 'B3', distanceFromStart: 5 } }
            }
          }
        }
      }
    };

    it('should return location when product is found', () => {
      const result = optimizer.getItemLocation('PROD-1', layout);
      expect(result).toEqual({
        zone: 'Zone A',
        aisle: 'Aisle 1',
        shelf: 'B3',
        distanceFromStart: 5
      });
    });

    it('should return unknown location when product is not found', () => {
      const result = optimizer.getItemLocation('INVALID', layout);
      expect(result).toEqual({
        zone: 'unknown',
        aisle: 'unknown',
        distanceFromStart: 50
      });
    });

    it('should handle empty layout gracefully', () => {
      const result = optimizer.getItemLocation('PROD-1', { zones: {} });
      expect(result).toEqual({
        zone: 'unknown',
        aisle: 'unknown',
        distanceFromStart: 50
      });
    });
  });
});
