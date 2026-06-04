const UncertaintyQuantifier = require('../../../../agents/central-planner/sub-agents/UncertaintyQuantifier');

describe('UncertaintyQuantifier', () => {
  let apiService;
  let quantifier;
  const plannerId = '001';

  beforeEach(() => {
    apiService = {
      safetyStock: jest.fn()
    };
    quantifier = new UncertaintyQuantifier(plannerId, apiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, and apiService', () => {
      expect(quantifier.name).toBe('UncertaintyQuantifier');
      expect(quantifier.parentId).toBe(`CP-${plannerId}`);
      expect(quantifier.apiService).toBe(apiService);
      expect(quantifier.plannerId).toBe(plannerId);
    });
  });

  describe('calculateSafetyStock', () => {
    const productId = 'PROD-001';

    it('should send safety stock request and return mapped result on success', async () => {
      const apiResult = {
        product_id: productId,
        safety_stock: 100,
        uncertainty_bounds: { lower: 50, upper: 150 },
        confidence_level: 0.99,
        model_version: 'v3'
      };
      apiService.safetyStock.mockResolvedValue(apiResult);

      const result = await quantifier.calculateSafetyStock(productId, {
        leadTimeDays: 14,
        serviceLevel: 0.99,
        demandForecast: [10, 20, 30]
      });

      expect(apiService.safetyStock).toHaveBeenCalledWith({
        product_id: productId,
        lead_time_days: 14,
        service_level: 0.99,
        demand_forecast: [10, 20, 30]
      });
      expect(result).toEqual(apiResult);
    });

    it('should use defaults for missing options', async () => {
      apiService.safetyStock.mockResolvedValue({
        product_id: productId, safety_stock: 30,
        uncertainty_bounds: { lower: 10, upper: 50 },
        confidence_level: 0.95, model_version: 'v1'
      });

      await quantifier.calculateSafetyStock(productId);

      expect(apiService.safetyStock).toHaveBeenCalledWith({
        product_id: productId,
        lead_time_days: 7,
        service_level: 0.95,
        demand_forecast: null
      });
    });

    it('should return fallback when API throws', async () => {
      apiService.safetyStock.mockRejectedValue(new Error('API down'));

      const result = await quantifier.calculateSafetyStock(productId);

      expect(result).toEqual({
        product_id: productId,
        safety_stock: 50,
        uncertainty_bounds: { lower: 25, upper: 75 },
        confidence_level: 0.95,
        model_version: 'fallback'
      });
    });

    it('should throw when productId is missing', async () => {
      await expect(quantifier.calculateSafetyStock(null)).rejects.toThrow('productId is required');
      expect(apiService.safetyStock).not.toHaveBeenCalled();
    });
  });

  describe('quantifyDemandUncertainty', () => {
    const forecast = [100, 110, 120];
    const errors = [5, -3, 2];

    it('should send forecast and errors and return mapped result on success', async () => {
      const apiResult = {
        mean: 110,
        std_dev: 4.5,
        prediction_intervals: [{ lower: 100, upper: 120 }],
        model_version: 'v2'
      };
      apiService.safetyStock.mockResolvedValue(apiResult);

      const result = await quantifier.quantifyDemandUncertainty(forecast, errors);

      expect(apiService.safetyStock).toHaveBeenCalledWith({
        forecast,
        errors
      });
      expect(result).toEqual(apiResult);
    });

    it('should default errors to empty array when not provided', async () => {
      apiService.safetyStock.mockResolvedValue({
        mean: 100, std_dev: 0, prediction_intervals: [], model_version: 'v1'
      });

      await quantifier.quantifyDemandUncertainty(forecast);

      expect(apiService.safetyStock).toHaveBeenCalledWith({
        forecast,
        errors: []
      });
    });

    it('should return fallback when API throws', async () => {
      apiService.safetyStock.mockRejectedValue(new Error('API down'));

      const result = await quantifier.quantifyDemandUncertainty(forecast, errors);

      expect(result).toEqual({
        mean: 0,
        std_dev: 0,
        prediction_intervals: [],
        model_version: 'fallback'
      });
    });

    it('should throw when forecast is null', async () => {
      await expect(quantifier.quantifyDemandUncertainty(null, errors)).rejects.toThrow('forecast is required');
    });

    it('should default missing API fields to safe values', async () => {
      apiService.safetyStock.mockResolvedValue({});

      const result = await quantifier.quantifyDemandUncertainty(forecast);

      expect(result.mean).toBe(0);
      expect(result.std_dev).toBe(0);
      expect(result.prediction_intervals).toEqual([]);
    });
  });

  describe('_fallbackSafetyStock', () => {
    it('should return fallback safety stock for product', () => {
      expect(quantifier._fallbackSafetyStock('foo')).toEqual({
        product_id: 'foo',
        safety_stock: 50,
        uncertainty_bounds: { lower: 25, upper: 75 },
        confidence_level: 0.95,
        model_version: 'fallback'
      });
    });
  });

  describe('_fallbackQuantify', () => {
    it('should return empty quantification fallback', () => {
      expect(quantifier._fallbackQuantify()).toEqual({
        mean: 0,
        std_dev: 0,
        prediction_intervals: [],
        model_version: 'fallback'
      });
    });
  });
});
