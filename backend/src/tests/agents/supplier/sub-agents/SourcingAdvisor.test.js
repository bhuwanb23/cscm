const SourcingAdvisor = require('../../../../agents/supplier/sub-agents/SourcingAdvisor');

describe('SourcingAdvisor', () => {
  let apiService;
  let advisor;
  const supplierId = 'SUP-001';

  beforeEach(() => {
    apiService = {
      sourcingRecommendations: jest.fn(),
      supplierGraphRisk: jest.fn()
    };
    advisor = new SourcingAdvisor(supplierId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(advisor.name).toBe('SourcingAdvisor');
      expect(advisor.parentId).toBe(`Supplier-${supplierId}`);
      expect(advisor.apiService).toBe(apiService);
    });

    it('should set supplierId', () => {
      expect(advisor.supplierId).toBe(supplierId);
    });
  });

  describe('recommend', () => {
    const supplierData = {
      historical_performance: [
        { quality_score: 0.9 },
        { quality_score: 0.85 }
      ]
    };

    it('should return API result on success', async () => {
      const apiResult = { recommended: true, confidence: 0.9, reason: 'Good performance', alternatives: [] };
      apiService.sourcingRecommendations.mockResolvedValue(apiResult);

      const result = await advisor.recommend(supplierData);

      expect(apiService.sourcingRecommendations).toHaveBeenCalledWith(supplierData);
      expect(result).toEqual(apiResult);
    });

    it('should call fallback when API throws', async () => {
      apiService.sourcingRecommendations.mockRejectedValue(new Error('API down'));

      const result = await advisor.recommend(supplierData);

      expect(result).toHaveProperty('recommended');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reason');
    });
  });

  describe('graphRiskAnalysis', () => {
    const id = 'SUP-001';

    it('should return API result on success', async () => {
      const apiResult = { risk_score: 15, network_position: 'central', dependencies: ['DEP-A'] };
      apiService.supplierGraphRisk.mockResolvedValue(apiResult);

      const result = await advisor.graphRiskAnalysis(id);

      expect(apiService.supplierGraphRisk).toHaveBeenCalledWith({ supplier_id: id });
      expect(result).toEqual(apiResult);
    });

    it('should return fallback object when API throws', async () => {
      apiService.supplierGraphRisk.mockRejectedValue(new Error('API down'));

      const result = await advisor.graphRiskAnalysis(id);

      expect(result).toEqual({ risk_score: 30, network_position: 'unknown', dependencies: [] });
    });
  });

  describe('_fallbackRecommendation', () => {
    it('should return low confidence recommendation when performance is empty', () => {
      const result = advisor._fallbackRecommendation({ historical_performance: [] });

      expect(result).toEqual({ recommended: true, confidence: 0.5, reason: 'Insufficient data for evaluation' });
    });

    it('should return low confidence recommendation when performance is missing', () => {
      const result = advisor._fallbackRecommendation({});

      expect(result).toEqual({ recommended: true, confidence: 0.5, reason: 'Insufficient data for evaluation' });
    });

    it('should recommend when average quality is above 0.8', () => {
      const data = {
        historical_performance: [
          { quality_score: 0.9 },
          { quality_score: 0.85 },
          { quality_score: 0.95 }
        ]
      };

      const result = advisor._fallbackRecommendation(data);

      expect(result.recommended).toBe(true);
      expect(result.confidence).toBe(0.9);
      expect(result.reason).toBe('Consistent quality performance');
      expect(result.alternatives).toEqual([]);
    });

    it('should not recommend when average quality is 0.8 or below', () => {
      const data = {
        historical_performance: [
          { quality_score: 0.7 },
          { quality_score: 0.6 }
        ]
      };

      const result = advisor._fallbackRecommendation(data);

      expect(result.recommended).toBe(false);
      expect(result.confidence).toBeCloseTo(0.65, 2);
      expect(result.reason).toBe('Below average quality performance');
    });

    it('should treat missing quality_score as 1.0', () => {
      const data = {
        historical_performance: [
          { someField: 'value' },
          { someField: 'value2' }
        ]
      };

      const result = advisor._fallbackRecommendation(data);

      expect(result.recommended).toBe(true);
      expect(result.confidence).toBe(1);
    });
  });
});
