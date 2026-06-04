const RiskAssessor = require('../../../../agents/supplier/sub-agents/RiskAssessor');

describe('RiskAssessor', () => {
  let apiService;
  let assessor;
  const supplierId = 'SUP-001';

  beforeEach(() => {
    apiService = {
      supplierRiskAssessment: jest.fn(),
      supplierSurvival: jest.fn()
    };
    assessor = new RiskAssessor(supplierId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(assessor.name).toBe('RiskAssessor');
      expect(assessor.parentId).toBe(`Supplier-${supplierId}`);
      expect(assessor.apiService).toBe(apiService);
    });

    it('should set supplierId', () => {
      expect(assessor.supplierId).toBe(supplierId);
    });
  });

  describe('assess', () => {
    const historicalPerformance = [
      { quality_score: 0.9, delivery_date: '2024-01-10', promised_date: '2024-01-08' },
      { quality_score: 0.8, delivery_date: '2024-02-10', promised_date: '2024-02-10' }
    ];
    const financialHealth = { revenue: 1000000, debt_ratio: 0.3 };
    const geographicRisk = { region: 'APAC', stability_score: 0.8 };

    it('should return API result on success', async () => {
      const apiResult = { risk_score: 25, risk_level: 'low', factors: ['quality'] };
      apiService.supplierRiskAssessment.mockResolvedValue(apiResult);

      const result = await assessor.assess(historicalPerformance, financialHealth, geographicRisk);

      expect(apiService.supplierRiskAssessment).toHaveBeenCalledWith({
        supplier_id: supplierId,
        historical_performance: historicalPerformance,
        financial_health: financialHealth,
        geographic_risk: geographicRisk
      });
      expect(result).toEqual(apiResult);
    });

    it('should call fallback when API throws', async () => {
      apiService.supplierRiskAssessment.mockRejectedValue(new Error('API down'));

      const result = await assessor.assess(historicalPerformance, financialHealth, geographicRisk);

      expect(result).toHaveProperty('risk_score');
      expect(result).toHaveProperty('risk_level');
      expect(result).toHaveProperty('model_version', 'fallback');
    });

    it('should fallback with medium risk and insufficient_data when performance is empty', async () => {
      apiService.supplierRiskAssessment.mockRejectedValue(new Error('API down'));

      const result = await assessor.assess([], financialHealth, geographicRisk);

      expect(result).toEqual({ risk_score: 50, risk_level: 'medium', factors: ['insufficient_data'] });
    });
  });

  describe('survivalAnalysis', () => {
    const data = { supplier_id: 'SUP-001', market_conditions: {} };

    it('should return API result on success', async () => {
      const apiResult = { survival_probability: 0.92, risk_factors: ['market'], model_version: 'v2' };
      apiService.supplierSurvival.mockResolvedValue(apiResult);

      const result = await assessor.survivalAnalysis(data);

      expect(apiService.supplierSurvival).toHaveBeenCalledWith(data);
      expect(result).toEqual(apiResult);
    });

    it('should return fallback object when API throws', async () => {
      apiService.supplierSurvival.mockRejectedValue(new Error('API down'));

      const result = await assessor.survivalAnalysis(data);

      expect(result).toEqual({ survival_probability: 0.85, risk_factors: [], model_version: 'fallback' });
    });
  });

  describe('_fallbackAssessment', () => {
    it('should return medium risk for empty historical performance', () => {
      const result = assessor._fallbackAssessment([]);

      expect(result).toEqual({ risk_score: 50, risk_level: 'medium', factors: ['insufficient_data'] });
    });

    it('should return null/undefined guard', () => {
      const result = assessor._fallbackAssessment(null);

      expect(result).toEqual({ risk_score: 50, risk_level: 'medium', factors: ['insufficient_data'] });
    });

    it('should compute low risk for high quality on-time performance', () => {
      const perf = [
        { quality_score: 0.95, delivery_date: '2024-01-10', promised_date: '2024-01-10' },
        { quality_score: 0.98, delivery_date: '2024-02-10', promised_date: '2024-02-10' }
      ];

      const result = assessor._fallbackAssessment(perf);

      expect(result.risk_level).toBe('low');
      expect(result.risk_score).toBeLessThanOrEqual(40);
      expect(result.factors).toEqual(['quality', 'timeliness']);
      expect(result.model_version).toBe('fallback');
    });

    it('should compute high risk for poor quality and late deliveries', () => {
      const perf = [
        { quality_score: 0.3, delivery_date: '2024-01-15', promised_date: '2024-01-08' },
        { quality_score: 0.2, delivery_date: '2024-02-20', promised_date: '2024-02-10' }
      ];

      const result = assessor._fallbackAssessment(perf);

      expect(result.risk_level).toBe('high');
      expect(result.risk_score).toBeGreaterThan(70);
    });

    it('should treat missing quality_score as 1.0', () => {
      const perf = [
        { delivery_date: '2024-01-10', promised_date: '2024-01-10' }
      ];

      const result = assessor._fallbackAssessment(perf);

      expect(result.risk_score).toBe(0);
    });
  });
});
