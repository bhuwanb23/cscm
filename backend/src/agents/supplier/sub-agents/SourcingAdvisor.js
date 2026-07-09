const SubAgent = require('../../_base/SubAgent');

class SourcingAdvisor extends SubAgent {
  constructor(supplierId, apiService) {
    super('SourcingAdvisor', `Supplier-${supplierId}`, apiService);
    this.supplierId = supplierId;
  }

  async recommend(supplierData) {
    this.log('Generating sourcing recommendations');

    try {
      const result = await this.apiService.sourcingRecommendations(supplierData);
      return result;
    } catch (err) {
      this.error('Sourcing recommendation failed:', err.message);
      return this._fallbackRecommendation(supplierData);
    }
  }

  async graphRiskAnalysis(supplierId) {
    this.log('Running graph-based risk analysis');

    try {
      const result = await this.apiService.supplierGraphRisk({ supplier_id: supplierId });
      return result;
    } catch (err) {
      this.error('Graph risk analysis failed:', err.message);
      return { risk_score: 30, network_position: 'unknown', dependencies: [] };
    }
  }

  _fallbackRecommendation(supplierData) {
    const performance = supplierData.historical_performance || [];
    if (performance.length === 0) {
      return { recommended: true, confidence: 0.5, reason: 'Insufficient data for evaluation' };
    }

    const avgQuality = performance.reduce((s, r) => s + (r.quality_score || 1), 0) / performance.length;
    return {
      recommended: avgQuality > 0.8,
      confidence: avgQuality,
      reason: avgQuality > 0.8 ? 'Consistent quality performance' : 'Below average quality performance',
      alternatives: []
    };
  }
}

module.exports = SourcingAdvisor;
