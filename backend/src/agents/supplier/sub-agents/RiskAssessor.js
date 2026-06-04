const SubAgent = require('../../_base/SubAgent');

class RiskAssessor extends SubAgent {
  constructor(supplierId, apiService) {
    super('RiskAssessor', `Supplier-${supplierId}`, apiService);
    this.supplierId = supplierId;
  }

  async assess(historicalPerformance, financialHealth, geographicRisk) {
    this.log('Assessing supplier risk');

    const data = {
      supplier_id: this.supplierId,
      historical_performance: historicalPerformance,
      financial_health: financialHealth,
      geographic_risk: geographicRisk
    };

    try {
      const result = await this.apiService.supplierRiskAssessment(data);
      this.log(`Risk score: ${result.risk_score}, level: ${result.risk_level}`);
      return result;
    } catch (err) {
      this.error('Risk assessment failed:', err.message);
      return this._fallbackAssessment(historicalPerformance);
    }
  }

  async survivalAnalysis(data) {
    this.log('Running survival analysis');

    try {
      const result = await this.apiService.supplierSurvival(data);
      return result;
    } catch (err) {
      this.error('Survival analysis failed:', err.message);
      return { survival_probability: 0.85, risk_factors: [], model_version: 'fallback' };
    }
  }

  _fallbackAssessment(historicalPerformance) {
    if (!historicalPerformance || historicalPerformance.length === 0) {
      return { risk_score: 50, risk_level: 'medium', factors: ['insufficient_data'] };
    }

    const avgQuality = historicalPerformance.reduce((s, r) => s + (r.quality_score || 1), 0) / historicalPerformance.length;
    const lateDeliveries = historicalPerformance.filter(r => new Date(r.delivery_date) > new Date(r.promised_date)).length;
    const lateRate = lateDeliveries / historicalPerformance.length;

    const score = Math.round((1 - avgQuality) * 50 + lateRate * 50);
    const level = score > 70 ? 'high' : score > 40 ? 'medium' : 'low';

    return { risk_score: score, risk_level: level, factors: ['quality', 'timeliness'], model_version: 'fallback' };
  }
}

module.exports = RiskAssessor;
