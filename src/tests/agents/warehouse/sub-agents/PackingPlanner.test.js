const PackingPlanner = require('../../../../backend/src/agents/warehouse/sub-agents/PackingPlanner');

const mockApiService = {
  inventoryOptimization: jest.fn()
};

describe('PackingPlanner', () => {
  let planner;

  beforeEach(() => {
    jest.clearAllMocks();
    planner = new PackingPlanner('WH-01', mockApiService);
  });

  describe('constructor', () => {
    it('should set warehouseId and call super with correct args', () => {
      expect(planner.name).toBe('PackingPlanner');
      expect(planner.parentId).toBe('Warehouse-WH-01');
      expect(planner.apiService).toBe(mockApiService);
      expect(planner.warehouseId).toBe('WH-01');
    });
  });

  describe('generatePlan', () => {
    const pickingTask = {
      id: 'P1',
      items: [
        { productId: 'A', quantity: 2 },
        { productId: 'B', quantity: 1 }
      ]
    };

    it('should return packing plan from API on success', async () => {
      const apiPlan = [{ productId: 'A', packagingType: 'fragile_box' }];
      mockApiService.inventoryOptimization.mockResolvedValue({
        packing_plan: apiPlan
      });

      const result = await planner.generatePlan(pickingTask);

      expect(mockApiService.inventoryOptimization).toHaveBeenCalledWith({
        warehouse_id: 'WH-01',
        picking_task: pickingTask,
        packing_configurations: {}
      });
      expect(result).toBe(apiPlan);
    });

    it('should fallback when API returns no packing_plan', async () => {
      mockApiService.inventoryOptimization.mockResolvedValue({});

      const result = await planner.generatePlan(pickingTask);

      expect(result).toEqual([
        { productId: 'A', quantity: 2, packagingType: 'standard_box', estimatedTime: 60, specialHandling: [] },
        { productId: 'B', quantity: 1, packagingType: 'standard_box', estimatedTime: 30, specialHandling: [] }
      ]);
    });

    it('should fallback when API rejects', async () => {
      mockApiService.inventoryOptimization.mockRejectedValue(new Error('API error'));

      const result = await planner.generatePlan(pickingTask);

      expect(result).toEqual([
        { productId: 'A', quantity: 2, packagingType: 'standard_box', estimatedTime: 60, specialHandling: [] },
        { productId: 'B', quantity: 1, packagingType: 'standard_box', estimatedTime: 30, specialHandling: [] }
      ]);
    });

    it('should use provided packingConfigurations in fallback', async () => {
      mockApiService.inventoryOptimization.mockRejectedValue(new Error('error'));

      const configs = {
        'A': { packagingType: 'fragile_box', estimatedTimePerUnit: 45, specialHandling: ['handle_with_care'] }
      };

      const result = await planner.generatePlan(pickingTask, configs);

      expect(result).toEqual([
        { productId: 'A', quantity: 2, packagingType: 'fragile_box', estimatedTime: 90, specialHandling: ['handle_with_care'] },
        { productId: 'B', quantity: 1, packagingType: 'standard_box', estimatedTime: 30, specialHandling: [] }
      ]);
    });

    it('should throw when pickingTask is missing', async () => {
      await expect(planner.generatePlan(null)).rejects.toThrow('pickingTask with items is required');
    });

    it('should throw when pickingTask has no items', async () => {
      await expect(planner.generatePlan({})).rejects.toThrow('pickingTask with items is required');
    });
  });

  describe('_fallbackPlan', () => {
    it('should return empty array for task with no items', () => {
      const result = planner._fallbackPlan({ items: [] }, {});
      expect(result).toEqual([]);
    });
  });

  describe('_getDefaultConfig', () => {
    it('should return matching config when productId exists in configurations', () => {
      const configs = { 'X': { packagingType: 'custom', estimatedTimePerUnit: 15, specialHandling: ['fragile'] } };
      const result = planner._getDefaultConfig('X', configs);
      expect(result).toEqual({ packagingType: 'custom', estimatedTimePerUnit: 15, specialHandling: ['fragile'] });
    });

    it('should return default config when productId not found', () => {
      const result = planner._getDefaultConfig('UNKNOWN', {});
      expect(result).toEqual({ packagingType: 'standard_box', estimatedTimePerUnit: 30, specialHandling: [] });
    });
  });

  describe('_estimateTime', () => {
    it('should compute base time from config', () => {
      const config = { estimatedTimePerUnit: 20 };
      expect(planner._estimateTime(config, 3)).toBe(60);
    });

    it('should default to 30 when config has no time', () => {
      expect(planner._estimateTime({}, 2)).toBe(60);
    });
  });
});
