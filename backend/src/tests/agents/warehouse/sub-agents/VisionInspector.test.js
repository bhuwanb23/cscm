const VisionInspector = require('../../../../agents/warehouse/sub-agents/VisionInspector');

describe('VisionInspector', () => {
  let apiService;
  let inspector;
  const warehouseId = 'WH-001';
  const imageData = 'base64-encoded-image-data';

  beforeEach(() => {
    apiService = {
      visionAnalyze: jest.fn()
    };
    inspector = new VisionInspector(warehouseId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(inspector.name).toBe('VisionInspector');
      expect(inspector.parentId).toBe(`Warehouse-${warehouseId}`);
      expect(inspector.apiService).toBe(apiService);
    });

    it('should set warehouseId', () => {
      expect(inspector.warehouseId).toBe(warehouseId);
    });
  });

  describe('inspectWarehouseImage', () => {
    it('should return API result on success', async () => {
      const apiResult = {
        detections: [
          { label: 'pallet', confidence: 0.95, bbox: [10, 20, 100, 200] },
          { label: 'box', confidence: 0.87, bbox: [50, 60, 150, 250] }
        ],
        inventory_estimate: { pallet: 5, box: 12 },
        quality_issues: ['low_light'],
        model_version: 'v3.0'
      };
      apiService.visionAnalyze.mockResolvedValue(apiResult);

      const result = await inspector.inspectWarehouseImage(imageData, { mode: 'full' });

      expect(apiService.visionAnalyze).toHaveBeenCalledWith({
        image: imageData,
        warehouse_id: warehouseId,
        mode: 'full'
      });
      expect(result.detections).toEqual(apiResult.detections);
      expect(result.inventory_estimate).toEqual({ pallet: 5, box: 12 });
      expect(result.quality_issues).toEqual(['low_light']);
      expect(result.model_version).toBe('v3.0');
    });

    it('should default missing fields on success', async () => {
      apiService.visionAnalyze.mockResolvedValue({});

      const result = await inspector.inspectWarehouseImage(imageData);

      expect(result.detections).toEqual([]);
      expect(result.inventory_estimate).toEqual({});
      expect(result.quality_issues).toEqual([]);
      expect(result.model_version).toBe('unknown');
    });

    it('should return fallback when API throws', async () => {
      apiService.visionAnalyze.mockRejectedValue(new Error('API down'));

      const result = await inspector.inspectWarehouseImage(imageData);

      expect(result).toEqual({
        detections: [],
        inventory_estimate: {},
        quality_issues: [],
        model_version: 'fallback'
      });
    });

    it('should return fallback when imageData is null', async () => {
      const result = await inspector.inspectWarehouseImage(null);

      expect(result).toEqual({
        detections: [],
        inventory_estimate: {},
        quality_issues: [],
        model_version: 'fallback'
      });
      expect(apiService.visionAnalyze).not.toHaveBeenCalled();
    });

    it('should not require options argument', async () => {
      apiService.visionAnalyze.mockResolvedValue({ detections: [] });

      await inspector.inspectWarehouseImage(imageData);

      expect(apiService.visionAnalyze).toHaveBeenCalledWith({
        image: imageData,
        warehouse_id: warehouseId
      });
    });
  });

  describe('detectObjects', () => {
    const objectTypes = ['pallet', 'box', 'forklift'];

    it('should return API result on success', async () => {
      const apiResult = {
        detections: [{ label: 'pallet', confidence: 0.9, bbox: [0, 0, 50, 50] }],
        model_version: 'v3.0'
      };
      apiService.visionAnalyze.mockResolvedValue(apiResult);

      const result = await inspector.detectObjects(imageData, objectTypes);

      expect(apiService.visionAnalyze).toHaveBeenCalledWith({
        image: imageData,
        target_objects: objectTypes
      });
      expect(result.detections).toEqual(apiResult.detections);
      expect(result.model_version).toBe('v3.0');
    });

    it('should return fallback when API throws', async () => {
      apiService.visionAnalyze.mockRejectedValue(new Error('API down'));

      const result = await inspector.detectObjects(imageData, objectTypes);

      expect(result).toEqual({ detections: [], model_version: 'fallback' });
    });

    it('should return fallback when imageData is null', async () => {
      const result = await inspector.detectObjects(null, objectTypes);

      expect(result).toEqual({ detections: [], model_version: 'fallback' });
      expect(apiService.visionAnalyze).not.toHaveBeenCalled();
    });
  });

  describe('assessQuality', () => {
    const criteria = { min_brightness: 0.4, max_blur: 0.1 };

    it('should return API result on success', async () => {
      const apiResult = {
        score: 0.82,
        issues: ['minor_blur'],
        model_version: 'v3.0'
      };
      apiService.visionAnalyze.mockResolvedValue(apiResult);

      const result = await inspector.assessQuality(imageData, criteria);

      expect(apiService.visionAnalyze).toHaveBeenCalledWith({
        image: imageData,
        quality_criteria: criteria
      });
      expect(result.score).toBe(0.82);
      expect(result.issues).toEqual(['minor_blur']);
      expect(result.model_version).toBe('v3.0');
    });

    it('should return fallback when API throws', async () => {
      apiService.visionAnalyze.mockRejectedValue(new Error('API down'));

      const result = await inspector.assessQuality(imageData, criteria);

      expect(result).toEqual({ score: 0.5, issues: [], model_version: 'fallback' });
    });

    it('should return fallback when imageData is null', async () => {
      const result = await inspector.assessQuality(null, criteria);

      expect(result).toEqual({ score: 0.5, issues: [], model_version: 'fallback' });
      expect(apiService.visionAnalyze).not.toHaveBeenCalled();
    });
  });
});
