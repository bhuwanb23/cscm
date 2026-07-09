const SubAgent = require('../../_base/SubAgent');

class TrendAnalyzer extends SubAgent {
  constructor(agentId, apiService) {
    super('TrendAnalyzer', agentId, apiService);
  }

  async analyze(salesData, options = {}) {
    this.log('Analyzing demand trends');

    if (!salesData || salesData.length === 0) throw new Error('salesData is required');

    const data = {
      sales_data: salesData,
      forecast_horizon: options.forecastHorizon || 14,
      include_seasonality: options.includeSeasonality !== false
    };

    try {
      const result = await this.apiService.demandForecast(data);
      return {
        expectedDemand: result.expected_demand,
        trend: result.trend,
        seasonality: result.seasonality,
        confidenceInterval: result.confidence_interval,
        dailyForecasts: result.daily_forecasts
      };
    } catch (err) {
      this.error('Trend analysis failed:', err.message);
      return this._fallbackAnalysis(salesData);
    }
  }

  async getTrends(customerSegment) {
    this.log(`Getting trends for segment ${customerSegment}`);

    if (!customerSegment) throw new Error('customerSegment is required');

    try {
      const result = await this.apiService.customerTrends(customerSegment);
      return result;
    } catch (err) {
      this.error('Failed to get trends:', err.message);
      return { segment: customerSegment, trend: 'stable', confidence: 0.5 };
    }
  }

  _fallbackAnalysis(salesData) {
    const values = salesData.map(s => s.sales || s.value || 0);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values.length > 1 && values[values.length - 1] > values[0] ? 'increasing' : 'decreasing';

    return {
      expectedDemand: Math.round(avg),
      trend,
      dailyForecasts: values.slice(-7).map(v => v),
      fallback: true
    };
  }
}

module.exports = TrendAnalyzer;
