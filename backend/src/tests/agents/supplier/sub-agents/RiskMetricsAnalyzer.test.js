const RiskMetricsAnalyzer = require('../../../../agents/supplier/sub-agents/RiskMetricsAnalyzer');

describe('RiskMetricsAnalyzer', () => {
  let apiService;
  let analyzer;
  const supplierId = 'SUP-001';

  beforeEach(() => {
    apiService = {
      supplierRiskMetrics: jest.fn()
    };
    analyzer = new RiskMetricsAnalyzer(supplierId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(analyzer.name).toBe('RiskMetricsAnalyzer');
      expect(analyzer.parentId).toBe(`Supplier-${supplierId}`);
      expect(analyzer.apiService).toBe(apiService);
    });

    it('should set supplierId', () => {
      expect(analyzer.supplierId).toBe(supplierId);
    });
  });

  describe('getMetrics', () => {
    it('should return API result on success with default timeRange', async () => {
      const apiResult = {
        time_range: '30d',
        total_assessments: 200,
        avg_risk_score: 0.42,
        distribution: { low: 120, medium: 60, high: 20 },
        trends: [{ date: '2024-03-01', avg: 0.4 }],
        model_version: 'v2'
      };
      apiService.supplierRiskMetrics.mockResolvedValue(apiResult);

      const result = await analyzer.getMetrics();

      expect(apiService.supplierRiskMetrics).toHaveBeenCalledWith({ range: '30d' });
      expect(result).toEqual(apiResult);
    });

    it('should pass custom timeRange to apiService', async () => {
      apiService.supplierRiskMetrics.mockResolvedValue({});

      await analyzer.getMetrics('7d');

      expect(apiService.supplierRiskMetrics).toHaveBeenCalledWith({ range: '7d' });
    });

    it('should fallback when API throws', async () => {
      apiService.supplierRiskMetrics.mockRejectedValue(new Error('API down'));

      const result = await analyzer.getMetrics('14d');

      expect(result).toEqual({
        time_range: '14d',
        total_assessments: 0,
        avg_risk_score: 0,
        distribution: { low: 0, medium: 0, high: 0 },
        trends: [],
        model_version: 'fallback'
      });
    });
  });

  describe('getMetricsForSupplier', () => {
    it('should return API result on success and pass range + supplier_id', async () => {
      const apiResult = {
        time_range: '90d',
        total_assessments: 80,
        avg_risk_score: 0.35,
        distribution: { low: 50, medium: 25, high: 5 },
        trends: [],
        model_version: 'v2'
      };
      apiService.supplierRiskMetrics.mockResolvedValue(apiResult);

      const result = await analyzer.getMetricsForSupplier('SUP-200', '90d');

      expect(apiService.supplierRiskMetrics).toHaveBeenCalledWith({
        range: '90d',
        supplier_id: 'SUP-200'
      });
      expect(result).toEqual(apiResult);
    });

    it('should default timeRange to 30d when not provided', async () => {
      apiService.supplierRiskMetrics.mockResolvedValue({});

      await analyzer.getMetricsForSupplier('SUP-300');

      expect(apiService.supplierRiskMetrics).toHaveBeenCalledWith({
        range: '30d',
        supplier_id: 'SUP-300'
      });
    });

    it('should fallback when API throws', async () => {
      apiService.supplierRiskMetrics.mockRejectedValue(new Error('API down'));

      const result = await analyzer.getMetricsForSupplier('SUP-200', '7d');

      expect(result.time_range).toBe('7d');
      expect(result.total_assessments).toBe(0);
      expect(result.model_version).toBe('fallback');
    });

    it('should handle empty supplier id via fallback', async () => {
      apiService.supplierRiskMetrics.mockRejectedValue(new Error('API down'));

      const result = await analyzer.getMetricsForSupplier('', '30d');

      expect(apiService.supplierRiskMetrics).toHaveBeenCalledWith({
        range: '30d',
        supplier_id: ''
      });
      expect(result.model_version).toBe('fallback');
    });
  });

  describe('_fallbackMetrics', () => {
    it('should return expected fallback shape with provided range', () => {
      const result = analyzer._fallbackMetrics('60d');

      expect(result).toEqual({
        time_range: '60d',
        total_assessments: 0,
        avg_risk_score: 0,
        distribution: { low: 0, medium: 0, high: 0 },
        trends: [],
        model_version: 'fallback'
      });
    });
  });
});
