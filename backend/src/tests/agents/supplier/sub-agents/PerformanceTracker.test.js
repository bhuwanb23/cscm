const PerformanceTracker = require('../../../../agents/supplier/sub-agents/PerformanceTracker');

describe('PerformanceTracker', () => {
  let apiService;
  let tracker;
  const supplierId = 'SUP-001';

  beforeEach(() => {
    apiService = {
      supplierRiskAssessment: jest.fn()
    };
    tracker = new PerformanceTracker(supplierId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(tracker.name).toBe('PerformanceTracker');
      expect(tracker.parentId).toBe(`Supplier-${supplierId}`);
      expect(tracker.apiService).toBe(apiService);
    });

    it('should set supplierId', () => {
      expect(tracker.supplierId).toBe(supplierId);
    });
  });

  describe('trackMetrics', () => {
    it('should initialize metrics array if not present', () => {
      tracker.state.metrics = undefined;

      tracker.trackMetrics({ onTimeDelivery: 0.95, qualityScore: 0.9, leadTimeDays: 5 });

      expect(Array.isArray(tracker.state.metrics)).toBe(true);
      expect(tracker.state.metrics.length).toBe(1);
    });

    it('should append new metrics with recordedAt timestamp', () => {
      const metrics = { onTimeDelivery: 0.95, qualityScore: 0.9, leadTimeDays: 5 };

      tracker.trackMetrics(metrics);

      expect(tracker.state.metrics.length).toBe(1);
      expect(tracker.state.metrics[0]).toMatchObject(metrics);
      expect(tracker.state.metrics[0].recordedAt).toBeDefined();
    });

    it('should accumulate multiple metric entries', () => {
      tracker.trackMetrics({ onTimeDelivery: 0.9 });
      tracker.trackMetrics({ onTimeDelivery: 0.8 });
      tracker.trackMetrics({ onTimeDelivery: 1.0 });

      expect(tracker.state.metrics.length).toBe(3);
    });

    it('should keep only the last 100 entries when overflow', () => {
      for (let i = 0; i < 110; i++) {
        tracker.trackMetrics({ onTimeDelivery: 0.9, qualityScore: 0.85, leadTimeDays: 3 });
      }

      expect(tracker.state.metrics.length).toBe(100);
    });

    it('should return the summary after tracking', () => {
      const result = tracker.trackMetrics({ onTimeDelivery: 0.95, qualityScore: 0.9, leadTimeDays: 5 });

      expect(result).toHaveProperty('onTimeDeliveryRate');
      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('averageLeadTime');
      expect(result).toHaveProperty('dataPoints');
    });
  });

  describe('summarize', () => {
    it('should return zeros when no metrics exist', () => {
      tracker.state.metrics = [];

      const result = tracker.summarize();

      expect(result).toEqual({
        onTimeDeliveryRate: 0,
        qualityScore: 0,
        averageLeadTime: 0,
        dataPoints: 0
      });
    });

    it('should return zeros when state.metrics is undefined', () => {
      tracker.state.metrics = undefined;

      const result = tracker.summarize();

      expect(result.dataPoints).toBe(0);
    });

    it('should compute averages from stored metrics', () => {
      tracker.state.metrics = [
        { onTimeDelivery: 0.9, qualityScore: 0.8, leadTimeDays: 5 },
        { onTimeDelivery: 1.0, qualityScore: 1.0, leadTimeDays: 3 }
      ];

      const result = tracker.summarize();

      expect(result.onTimeDeliveryRate).toBe(0.95);
      expect(result.qualityScore).toBe(0.9);
      expect(result.averageLeadTime).toBe(4);
      expect(result.dataPoints).toBe(2);
      expect(result.lastUpdated).toBeDefined();
    });

    it('should treat missing qualityScore as 1', () => {
      tracker.state.metrics = [
        { onTimeDelivery: 0.9, leadTimeDays: 5 }
      ];

      const result = tracker.summarize();

      expect(result.qualityScore).toBe(1);
    });

    it('should treat missing values as 0', () => {
      tracker.state.metrics = [
        {},
        {}
      ];

      const result = tracker.summarize();

      expect(result.onTimeDeliveryRate).toBe(0);
      expect(result.qualityScore).toBe(1);
      expect(result.averageLeadTime).toBe(0);
    });
  });

  describe('getHistoricalMetrics', () => {
    it('should return API result on success', async () => {
      const apiResult = { risk_score: 20, risk_level: 'low' };
      apiService.supplierRiskAssessment.mockResolvedValue(apiResult);

      const result = await tracker.getHistoricalMetrics({ days: 30 });

      expect(apiService.supplierRiskAssessment).toHaveBeenCalledWith({
        supplier_id: supplierId,
        days: 30
      });
      expect(result).toEqual(apiResult);
    });

    it('should use default 90 days when options are empty', async () => {
      apiService.supplierRiskAssessment.mockResolvedValue({});

      await tracker.getHistoricalMetrics({});

      expect(apiService.supplierRiskAssessment).toHaveBeenCalledWith({
        supplier_id: supplierId,
        days: 90
      });
    });

    it('should fallback to summarize() when API throws', async () => {
      tracker.state.metrics = [
        { onTimeDelivery: 0.95, qualityScore: 0.9, leadTimeDays: 4 }
      ];
      apiService.supplierRiskAssessment.mockRejectedValue(new Error('API down'));

      const result = await tracker.getHistoricalMetrics();

      expect(result).toHaveProperty('onTimeDeliveryRate', 0.95);
      expect(result).toHaveProperty('qualityScore', 0.9);
      expect(result).toHaveProperty('averageLeadTime', 4);
      expect(result).toHaveProperty('dataPoints', 1);
    });
  });
});
