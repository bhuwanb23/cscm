const SegmentManager = require('../../../../agents/customer-demand/sub-agents/SegmentManager');

describe('SegmentManager', () => {
  let apiService;
  let manager;
  const agentId = 'DEMAND-001';

  beforeEach(() => {
    apiService = {
      naturalLanguageProcessing: jest.fn(),
      segmentSimilarity: jest.fn(),
      causalInference: jest.fn()
    };
    manager = new SegmentManager(agentId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(manager.name).toBe('SegmentManager');
      expect(manager.parentId).toBe(agentId);
      expect(manager.apiService).toBe(apiService);
    });
  });

  describe('segment', () => {
    const customers = [
      { id: 1, totalSpending: 1500 },
      { id: 2, totalSpending: 700 },
      { id: 3, totalSpending: 200 },
      { id: 4, totalSpending: 500 }
    ];

    it('should return API result segments when present', async () => {
      const apiResult = { segments: { premium: [1], standard: [2], budget: [3, 4] } };
      apiService.naturalLanguageProcessing.mockResolvedValue(apiResult);

      const result = await manager.segment(customers);

      expect(apiService.naturalLanguageProcessing).toHaveBeenCalledWith({ customers });
      expect(result).toEqual(apiResult.segments);
    });

    it('should fallback when API result has no segments property', async () => {
      apiService.naturalLanguageProcessing.mockResolvedValue({});

      const result = await manager.segment(customers);

      expect(result).toHaveProperty('premium');
      expect(result).toHaveProperty('standard');
      expect(result).toHaveProperty('budget');
    });

    it('should fallback when API throws', async () => {
      apiService.naturalLanguageProcessing.mockRejectedValue(new Error('API down'));

      const result = await manager.segment(customers);

      expect(result).toHaveProperty('premium');
      expect(result).toHaveProperty('standard');
      expect(result).toHaveProperty('budget');
    });

    it('should throw if customers is empty', async () => {
      await expect(manager.segment([])).rejects.toThrow('customers is required');
    });

    it('should throw if customers is null', async () => {
      await expect(manager.segment(null)).rejects.toThrow(TypeError);
    });
  });

  describe('compareSegments', () => {
    const segmentA = ['cust-1', 'cust-2'];
    const segmentB = ['cust-3', 'cust-4'];

    it('should return API result on success', async () => {
      const apiResult = { similarity: 0.75, shared_characteristics: ['age', 'region'] };
      apiService.segmentSimilarity.mockResolvedValue(apiResult);

      const result = await manager.compareSegments(segmentA, segmentB);

      expect(apiService.segmentSimilarity).toHaveBeenCalledWith({
        segment_a: segmentA,
        segment_b: segmentB
      });
      expect(result).toEqual(apiResult);
    });

    it('should return fallback when API throws', async () => {
      apiService.segmentSimilarity.mockRejectedValue(new Error('API down'));

      const result = await manager.compareSegments(segmentA, segmentB);

      expect(result).toEqual({ similarity: 0.5, shared_characteristics: [], fallback: true });
    });
  });

  describe('analyzePromotionalImpact', () => {
    const promotionData = { promotion_id: 'PROMO-1', discount: 0.2, segments: ['premium'] };

    it('should return API result on success', async () => {
      const apiResult = { impact: 12.5, confidence: 0.85, segments_affected: ['premium'] };
      apiService.causalInference.mockResolvedValue(apiResult);

      const result = await manager.analyzePromotionalImpact(promotionData);

      expect(apiService.causalInference).toHaveBeenCalledWith(promotionData);
      expect(result).toEqual(apiResult);
    });

    it('should return fallback when API throws', async () => {
      apiService.causalInference.mockRejectedValue(new Error('API down'));

      const result = await manager.analyzePromotionalImpact(promotionData);

      expect(result).toEqual({ impact: 0, confidence: 0, segments_affected: [], fallback: true });
    });
  });

  describe('_fallbackSegmentation', () => {
    it('should segment customers by spending thresholds', () => {
      const customers = [
        { id: 1, totalSpending: 1500 },
        { id: 2, totalSpending: 700 },
        { id: 3, totalSpending: 200 }
      ];

      const result = manager._fallbackSegmentation(customers);

      expect(result).toEqual({
        premium: [1],
        standard: [2],
        budget: [3]
      });
    });

    it('should use spending field when totalSpending is missing', () => {
      const customers = [
        { customerId: 'C1', spending: 1200 },
        { customerId: 'C2', spending: 400 }
      ];

      const result = manager._fallbackSegmentation(customers);

      expect(result).toEqual({
        premium: ['C1'],
        budget: ['C2']
      });
    });

    it('should handle edge case spending values', () => {
      const customers = [
        { id: 1, totalSpending: 1001 },
        { id: 2, totalSpending: 500 },
        { id: 3, totalSpending: 0 }
      ];

      const result = manager._fallbackSegmentation(customers);

      expect(result).toEqual({
        premium: [1],
        budget: [2, 3]
      });
    });

    it('should fall back to id or customerId', () => {
      const customers = [
        { id: 'A', totalSpending: 2000 },
        { customerId: 'B', totalSpending: 600 }
      ];

      const result = manager._fallbackSegmentation(customers);

      expect(result).toEqual({
        premium: ['A'],
        standard: ['B']
      });
    });
  });
});
