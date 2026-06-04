const SubAgent = require('../../_base/SubAgent');

class PerformanceTracker extends SubAgent {
  constructor(supplierId, apiService) {
    super('PerformanceTracker', `Supplier-${supplierId}`, apiService);
    this.supplierId = supplierId;
  }

  trackMetrics(newMetrics) {
    this.log('Tracking supplier performance metrics');

    if (!this.state.metrics) this.state.metrics = [];
    this.state.metrics.push({
      ...newMetrics,
      recordedAt: new Date().toISOString()
    });

    if (this.state.metrics.length > 100) {
      this.state.metrics = this.state.metrics.slice(-100);
    }

    return this.summarize();
  }

  summarize() {
    const metrics = this.state.metrics || [];
    if (metrics.length === 0) {
      return { onTimeDeliveryRate: 0, qualityScore: 0, averageLeadTime: 0, dataPoints: 0 };
    }

    return {
      onTimeDeliveryRate: metrics.reduce((s, m) => s + (m.onTimeDelivery || 0), 0) / metrics.length,
      qualityScore: metrics.reduce((s, m) => s + (m.qualityScore || 1), 0) / metrics.length,
      averageLeadTime: metrics.reduce((s, m) => s + (m.leadTimeDays || 0), 0) / metrics.length,
      dataPoints: metrics.length,
      lastUpdated: new Date().toISOString()
    };
  }

  async getHistoricalMetrics(options = {}) {
    const data = {
      supplier_id: this.supplierId,
      days: options.days || 90
    };

    try {
      const result = await this.apiService.supplierRiskAssessment(data);
      return result;
    } catch (err) {
      this.error('Failed to fetch historical metrics:', err.message);
      return this.summarize();
    }
  }
}

module.exports = PerformanceTracker;
