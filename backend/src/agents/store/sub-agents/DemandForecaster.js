const SubAgent = require('../../_base/SubAgent');

class DemandForecaster extends SubAgent {
  constructor(storeId, apiService) {
    super('DemandForecaster', `Store-${storeId}`, apiService);
    this.storeId = storeId;
  }

  async forecast(productId, salesData, forecastDays = 7) {
    this.log(`Forecasting demand for product ${productId}`);

    if (!productId) throw new Error('productId is required');
    if (!salesData || salesData.length < 7) {
      this.warn(`Not enough sales data for ${productId} (${salesData ? salesData.length : 0} records)`);
      return null;
    }

    const requestData = {
      product_id: productId,
      store_id: this.storeId,
      sales_data: salesData,
      forecast_days: forecastDays
    };

    try {
      const result = await this.apiService.demandForecast(requestData);
      this.log(`Forecast for ${productId}: ${result.expected_demand} units`);
      return {
        productId,
        expectedDemand: result.expected_demand,
        dailyForecasts: result.daily_forecasts,
        safetyStock: result.safety_stock,
        confidenceInterval: result.confidence_interval,
        trend: result.trend,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      this.error(`Forecast failed for ${productId}:`, err.message);
      throw err;
    }
  }

  async batchForecast(items) {
    this.log(`Batch forecasting ${items.length} items`);
    try {
      const result = await this.apiService.batchDemandForecast({ items, store_id: this.storeId });
      return result;
    } catch (err) {
      this.error('Batch forecast failed:', err.message);
      throw err;
    }
  }
}

module.exports = DemandForecaster;
