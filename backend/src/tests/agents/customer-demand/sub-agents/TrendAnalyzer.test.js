const TrendAnalyzer = require('../../../../agents/customer-demand/sub-agents/TrendAnalyzer');

describe('TrendAnalyzer', () => {
  let apiService;
  let analyzer;
  const agentId = 'DEMAND-001';

  beforeEach(() => {
    apiService = {
      demandForecast: jest.fn(),
      customerTrends: jest.fn()
    };
    analyzer = new TrendAnalyzer(agentId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(analyzer.name).toBe('TrendAnalyzer');
      expect(analyzer.parentId).toBe(agentId);
      expect(analyzer.apiService).toBe(apiService);
    });
  });

  describe('analyze', () => {
    const salesData = [
      { sales: 100 },
      { sales: 120 },
      { sales: 140 }
    ];

    it('should return mapped API result on success', async () => {
      const apiResult = {
        expected_demand: 140,
        trend: 'increasing',
        seasonality: { strength: 0.2 },
        confidence_interval: [130, 150],
        daily_forecasts: [130, 135, 140]
      };
      apiService.demandForecast.mockResolvedValue(apiResult);

      const result = await analyzer.analyze(salesData, { forecastHorizon: 7, includeSeasonality: true });

      expect(apiService.demandForecast).toHaveBeenCalledWith({
        sales_data: salesData,
        forecast_horizon: 7,
        include_seasonality: true
      });
      expect(result).toEqual({
        expectedDemand: 140,
        trend: 'increasing',
        seasonality: { strength: 0.2 },
        confidenceInterval: [130, 150],
        dailyForecasts: [130, 135, 140]
      });
    });

    it('should use defaults for missing options', async () => {
      apiService.demandForecast.mockResolvedValue({
        expected_demand: 120,
        trend: 'stable',
        seasonality: null,
        confidence_interval: null,
        daily_forecasts: []
      });

      const result = await analyzer.analyze(salesData);

      expect(apiService.demandForecast).toHaveBeenCalledWith({
        sales_data: salesData,
        forecast_horizon: 14,
        include_seasonality: true
      });
    });

    it('should pass includeSeasonality false from options', async () => {
      apiService.demandForecast.mockResolvedValue({
        expected_demand: 120, trend: 'stable', seasonality: null,
        confidence_interval: null, daily_forecasts: []
      });

      await analyzer.analyze(salesData, { includeSeasonality: false });

      expect(apiService.demandForecast).toHaveBeenCalledWith({
        sales_data: salesData,
        forecast_horizon: 14,
        include_seasonality: false
      });
    });

    it('should throw if salesData is empty', async () => {
      await expect(analyzer.analyze([])).rejects.toThrow('salesData is required');
    });

    it('should throw if salesData is null', async () => {
      await expect(analyzer.analyze(null)).rejects.toThrow('salesData is required');
    });

    it('should call fallback when API throws', async () => {
      apiService.demandForecast.mockRejectedValue(new Error('API down'));

      const result = await analyzer.analyze(salesData);

      expect(result).toHaveProperty('expectedDemand');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('dailyForecasts');
      expect(result.fallback).toBe(true);
    });
  });

  describe('getTrends', () => {
    it('should return API result on success', async () => {
      const apiResult = { segment: 'premium', trend: 'growing', confidence: 0.9 };
      apiService.customerTrends.mockResolvedValue(apiResult);

      const result = await analyzer.getTrends('premium');

      expect(apiService.customerTrends).toHaveBeenCalledWith('premium');
      expect(result).toEqual(apiResult);
    });

    it('should throw if customerSegment is missing', async () => {
      await expect(analyzer.getTrends('')).rejects.toThrow('customerSegment is required');
    });

    it('should throw if customerSegment is undefined', async () => {
      await expect(analyzer.getTrends(undefined)).rejects.toThrow('customerSegment is required');
    });

    it('should return fallback object when API throws', async () => {
      apiService.customerTrends.mockRejectedValue(new Error('API down'));

      const result = await analyzer.getTrends('budget');

      expect(result).toEqual({ segment: 'budget', trend: 'stable', confidence: 0.5 });
    });
  });

  describe('_fallbackAnalysis', () => {
    it('should compute increasing trend when last value > first', () => {
      const salesData = [
        { sales: 100 },
        { sales: 150 },
        { sales: 200 }
      ];

      const result = analyzer._fallbackAnalysis(salesData);

      expect(result.trend).toBe('increasing');
      expect(result.expectedDemand).toBe(150);
      expect(result.dailyForecasts).toEqual([100, 150, 200]);
      expect(result.fallback).toBe(true);
    });

    it('should compute decreasing trend when last value <= first', () => {
      const salesData = [
        { sales: 200 },
        { sales: 150 },
        { sales: 100 }
      ];

      const result = analyzer._fallbackAnalysis(salesData);

      expect(result.trend).toBe('decreasing');
      expect(result.expectedDemand).toBe(150);
    });

    it('should treat single data point as decreasing', () => {
      const salesData = [{ sales: 100 }];

      const result = analyzer._fallbackAnalysis(salesData);

      expect(result.trend).toBe('decreasing');
      expect(result.expectedDemand).toBe(100);
    });

    it('should fall back to value field when sales is missing', () => {
      const salesData = [
        { value: 50 },
        { value: 75 }
      ];

      const result = analyzer._fallbackAnalysis(salesData);

      expect(result.expectedDemand).toBe(63);
      expect(result.dailyForecasts).toEqual([50, 75]);
    });

    it('should treat missing sales and value as 0', () => {
      const salesData = [
        {}
      ];

      const result = analyzer._fallbackAnalysis(salesData);

      expect(result.expectedDemand).toBe(0);
    });

    it('should return only last 7 daily forecasts when more than 7', () => {
      const salesData = Array.from({ length: 10 }, (_, i) => ({ sales: i * 10 }));

      const result = analyzer._fallbackAnalysis(salesData);

      expect(result.dailyForecasts.length).toBe(7);
      expect(result.dailyForecasts).toEqual([30, 40, 50, 60, 70, 80, 90]);
    });
  });
});
