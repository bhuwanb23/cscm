const SubAgent = require('../../_base/SubAgent');

class RiskMetricsAnalyzer extends SubAgent {
  constructor(supplierId, apiService) {
    super('RiskMetricsAnalyzer', `Supplier-${supplierId}`, apiService);
    this.supplierId = supplierId;
  }

  async getMetrics(timeRange = '30d') {
    this.log(`Fetching risk metrics for range=${timeRange}`);

    try {
      const result = await this.apiService.supplierRiskMetrics({ range: timeRange });
      this.log(`Metrics: total=${result.total_assessments}, avg_score=${result.avg_risk_score}`);
      return result;
    } catch (err) {
      this.error('Risk metrics fetch failed:', err.message);
      return this._fallbackMetrics(timeRange);
    }
  }

  async getMetricsForSupplier(supplierId, timeRange = '30d') {
    this.log(`Fetching risk metrics for supplier=${supplierId}, range=${timeRange}`);

    try {
      const result = await this.apiService.supplierRiskMetrics({
        range: timeRange,
        supplier_id: supplierId
      });
      return result;
    } catch (err) {
      this.error('Supplier risk metrics fetch failed:', err.message);
      return this._fallbackMetrics(timeRange);
    }
  }

  _fallbackMetrics(timeRange) {
    return {
      time_range: timeRange,
      total_assessments: 0,
      avg_risk_score: 0,
      distribution: { low: 0, medium: 0, high: 0 },
      trends: [],
      model_version: 'fallback'
    };
  }
}

module.exports = RiskMetricsAnalyzer;
