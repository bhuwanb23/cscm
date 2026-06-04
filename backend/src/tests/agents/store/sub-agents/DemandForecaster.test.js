const DemandForecaster = require('../../../../agents/store/sub-agents/DemandForecaster');

describe('DemandForecaster', () => {
  const mockApiService = {
    demandForecast: jest.fn(),
    batchDemandForecast: jest.fn()
  };
  const storeId = 'STORE-001';
  let forecaster;

  beforeEach(() => {
    forecaster = new DemandForecaster(storeId, mockApiService);
    jest.clearAllMocks();
  });

  test('should set storeId and name on construction', () => {
    expect(forecaster.storeId).toBe(storeId);
    expect(forecaster.name).toBe('DemandForecaster');
    expect(forecaster.parentId).toBe('Store-STORE-001');
    expect(forecaster.apiService).toBe(mockApiService);
  });

  describe('forecast', () => {
    const productId = 'PROD-001';
    const salesData = [10, 12, 15, 11, 13, 14, 16];
    const forecastDays = 7;
    const apiResponse = {
      expected_demand: 100,
      daily_forecasts: [14, 15, 13, 16, 14, 15, 13],
      safety_stock: 20,
      confidence_interval: { lower: 85, upper: 115 },
      trend: 'stable'
    };

    test('should return mapped forecast data on success', async () => {
      mockApiService.demandForecast.mockResolvedValue(apiResponse);

      const result = await forecaster.forecast(productId, salesData, forecastDays);

      expect(mockApiService.demandForecast).toHaveBeenCalledWith({
        product_id: productId,
        store_id: storeId,
        sales_data: salesData,
        forecast_days: forecastDays
      });
      expect(result).toEqual({
        productId,
        expectedDemand: 100,
        dailyForecasts: apiResponse.daily_forecasts,
        safetyStock: 20,
        confidenceInterval: apiResponse.confidence_interval,
        trend: 'stable',
        lastUpdated: expect.any(String)
      });
    });

    test('should throw when productId is missing', async () => {
      await expect(forecaster.forecast(null, salesData)).rejects.toThrow('productId is required');
      expect(mockApiService.demandForecast).not.toHaveBeenCalled();
    });

    test('should return null when salesData has fewer than 7 records', async () => {
      const result = await forecaster.forecast(productId, [1, 2, 3]);
      expect(result).toBeNull();
      expect(mockApiService.demandForecast).not.toHaveBeenCalled();
    });

    test('should use default forecastDays of 7 when not provided', async () => {
      mockApiService.demandForecast.mockResolvedValue(apiResponse);
      await forecaster.forecast(productId, salesData);
      expect(mockApiService.demandForecast).toHaveBeenCalledWith(
        expect.objectContaining({ forecast_days: 7 })
      );
    });

    test('should throw when API call fails', async () => {
      mockApiService.demandForecast.mockRejectedValue(new Error('API timeout'));
      await expect(forecaster.forecast(productId, salesData)).rejects.toThrow('API timeout');
    });
  });

  describe('batchForecast', () => {
    const items = [{ product_id: 'P1', sales_data: [1, 2, 3, 4, 5, 6, 7] }];

    test('should call batchDemandForecast and return result', async () => {
      const expected = { forecasts: [] };
      mockApiService.batchDemandForecast.mockResolvedValue(expected);

      const result = await forecaster.batchForecast(items);

      expect(mockApiService.batchDemandForecast).toHaveBeenCalledWith({
        items,
        store_id: storeId
      });
      expect(result).toBe(expected);
    });

    test('should throw when batch API fails', async () => {
      mockApiService.batchDemandForecast.mockRejectedValue(new Error('Batch failed'));
      await expect(forecaster.batchForecast(items)).rejects.toThrow('Batch failed');
    });
  });
});
