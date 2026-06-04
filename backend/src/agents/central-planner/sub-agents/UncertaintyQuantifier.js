const SubAgent = require('../../_base/SubAgent');

class UncertaintyQuantifier extends SubAgent {
  constructor(plannerId, apiService) {
    super('UncertaintyQuantifier', `CP-${plannerId}`, apiService);
    this.plannerId = plannerId;
  }

  async calculateSafetyStock(productId, options = {}) {
    this.log(`Calculating safety stock for product ${productId}`);

    if (!productId) throw new Error('productId is required');

    const data = {
      product_id: productId,
      lead_time_days: options.leadTimeDays !== undefined ? options.leadTimeDays : 7,
      service_level: options.serviceLevel !== undefined ? options.serviceLevel : 0.95,
      demand_forecast: options.demandForecast || null
    };

    try {
      const result = await this.apiService.safetyStock(data);
      return {
        product_id: result.product_id || productId,
        safety_stock: result.safety_stock !== undefined ? result.safety_stock : 0,
        uncertainty_bounds: result.uncertainty_bounds || { lower: 0, upper: 0 },
        confidence_level: result.confidence_level !== undefined ? result.confidence_level : data.service_level,
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Safety stock calculation failed:', err.message);
      return this._fallbackSafetyStock(productId);
    }
  }

  async quantifyDemandUncertainty(forecast, historicalErrors) {
    this.log('Quantifying demand uncertainty');

    if (forecast === undefined || forecast === null) throw new Error('forecast is required');

    try {
      const result = await this.apiService.safetyStock({
        forecast,
        errors: historicalErrors || []
      });
      return {
        mean: result.mean !== undefined ? result.mean : 0,
        std_dev: result.std_dev !== undefined ? result.std_dev : 0,
        prediction_intervals: result.prediction_intervals || [],
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Demand uncertainty quantification failed:', err.message);
      return this._fallbackQuantify();
    }
  }

  _fallbackSafetyStock(productId) {
    return {
      product_id: productId,
      safety_stock: 50,
      uncertainty_bounds: { lower: 25, upper: 75 },
      confidence_level: 0.95,
      model_version: 'fallback'
    };
  }

  _fallbackQuantify() {
    return {
      mean: 0,
      std_dev: 0,
      prediction_intervals: [],
      model_version: 'fallback'
    };
  }
}

module.exports = UncertaintyQuantifier;
