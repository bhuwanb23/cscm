const BatchOptimizer = require('../../../../agents/warehouse/sub-agents/BatchOptimizer');

describe('BatchOptimizer', () => {
  let apiService;
  let optimizer;
  const warehouseId = 'WH-001';

  beforeEach(() => {
    apiService = {
      batchOptimize: jest.fn()
    };
    optimizer = new BatchOptimizer(warehouseId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(optimizer.name).toBe('BatchOptimizer');
      expect(optimizer.parentId).toBe(`Warehouse-${warehouseId}`);
      expect(optimizer.apiService).toBe(apiService);
    });

    it('should set warehouseId', () => {
      expect(optimizer.warehouseId).toBe(warehouseId);
    });
  });

  describe('optimizeBatch', () => {
    const skus = ['SKU-A', 'SKU-B', 'SKU-C'];

    it('should return API result on success', async () => {
      const apiResult = {
        recommendations: [
          { sku_id: 'SKU-A', reorder_quantity: 100, safety_stock: 30 },
          { sku_id: 'SKU-B', reorder_quantity: 80, safety_stock: 20 }
        ],
        total_savings: 1500.50,
        model_version: 'v2.1'
      };
      apiService.batchOptimize.mockResolvedValue(apiResult);

      const result = await optimizer.optimizeBatch(skus);

      expect(apiService.batchOptimize).toHaveBeenCalledWith({ skus });
      expect(result.recommendations).toEqual(apiResult.recommendations);
      expect(result.total_savings).toBe(1500.50);
      expect(result.model_version).toBe('v2.1');
    });

    it('should default missing fields on success', async () => {
      apiService.batchOptimize.mockResolvedValue({ recommendations: [] });

      const result = await optimizer.optimizeBatch(skus);

      expect(result.recommendations).toEqual([]);
      expect(result.total_savings).toBe(0);
      expect(result.model_version).toBe('unknown');
    });

    it('should return fallback when API throws', async () => {
      apiService.batchOptimize.mockRejectedValue(new Error('API down'));

      const result = await optimizer.optimizeBatch(skus);

      expect(result.recommendations).toHaveLength(skus.length);
      expect(result.recommendations[0]).toEqual({
        sku_id: 'SKU-A',
        reorder_quantity: 50,
        safety_stock: 25
      });
      expect(result.total_savings).toBe(0);
      expect(result.model_version).toBe('fallback');
    });

    it('should return empty result for empty skus array', async () => {
      const result = await optimizer.optimizeBatch([]);

      expect(result).toEqual({ recommendations: [], total_savings: 0, model_version: 'fallback' });
      expect(apiService.batchOptimize).not.toHaveBeenCalled();
    });

    it('should return empty result for null skus', async () => {
      const result = await optimizer.optimizeBatch(null);

      expect(result).toEqual({ recommendations: [], total_savings: 0, model_version: 'fallback' });
      expect(apiService.batchOptimize).not.toHaveBeenCalled();
    });
  });

  describe('optimizeBatchByStore', () => {
    const pairs = [
      { sku: 'SKU-A', store: 'STORE-1' },
      { sku: 'SKU-B', store: 'STORE-2' }
    ];

    it('should return API result on success', async () => {
      const apiResult = {
        results: [
          { sku_id: 'SKU-A', store_id: 'STORE-1', reorder_quantity: 120 },
          { sku_id: 'SKU-B', store_id: 'STORE-2', reorder_quantity: 90 }
        ],
        total_processed: 2
      };
      apiService.batchOptimize.mockResolvedValue(apiResult);

      const result = await optimizer.optimizeBatchByStore(pairs);

      expect(apiService.batchOptimize).toHaveBeenCalledWith({ pairs });
      expect(result.results).toEqual(apiResult.results);
      expect(result.total_processed).toBe(2);
    });

    it('should return fallback when API throws', async () => {
      apiService.batchOptimize.mockRejectedValue(new Error('API down'));

      const result = await optimizer.optimizeBatchByStore(pairs);

      expect(result.results).toHaveLength(pairs.length);
      expect(result.results[0]).toEqual({
        sku_id: 'SKU-A',
        store_id: 'STORE-1',
        reorder_quantity: 50
      });
      expect(result.total_processed).toBe(pairs.length);
      expect(result.model_version).toBe('fallback');
    });

    it('should return empty result for empty pairs array', async () => {
      const result = await optimizer.optimizeBatchByStore([]);

      expect(result).toEqual({ results: [], total_processed: 0, model_version: 'fallback' });
      expect(apiService.batchOptimize).not.toHaveBeenCalled();
    });
  });

  describe('_fallbackBatch', () => {
    it('should map each sku to a recommendation with defaults', () => {
      const skus = ['SKU-X', 'SKU-Y'];
      const result = optimizer._fallbackBatch(skus);

      expect(result.recommendations).toEqual([
        { sku_id: 'SKU-X', reorder_quantity: 50, safety_stock: 25 },
        { sku_id: 'SKU-Y', reorder_quantity: 50, safety_stock: 25 }
      ]);
      expect(result.total_savings).toBe(0);
      expect(result.model_version).toBe('fallback');
    });
  });

  describe('_fallbackBatchByStore', () => {
    it('should map each pair to a result with defaults', () => {
      const pairs = [
        { sku: 'SKU-A', store: 'STORE-1' },
        { sku: 'SKU-B', store: 'STORE-2' }
      ];
      const result = optimizer._fallbackBatchByStore(pairs);

      expect(result.results).toEqual([
        { sku_id: 'SKU-A', store_id: 'STORE-1', reorder_quantity: 50 },
        { sku_id: 'SKU-B', store_id: 'STORE-2', reorder_quantity: 50 }
      ]);
      expect(result.total_processed).toBe(2);
      expect(result.model_version).toBe('fallback');
    });

    it('should return empty results for empty pairs', () => {
      const result = optimizer._fallbackBatchByStore([]);

      expect(result.results).toEqual([]);
      expect(result.total_processed).toBe(0);
      expect(result.model_version).toBe('fallback');
    });
  });
});
