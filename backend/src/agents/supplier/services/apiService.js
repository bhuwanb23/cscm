const BaseApiService = require('../../../services/BaseApiService');

class SupplierApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/supplier/risk') {
      return {
        supplier_id: (data && data.supplier_id) || '',
        risk_score: 0.5, risk_level: 'medium',
        model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/supplier/recommendations') {
      return {
        recommended: true, confidence: 0.5, reason: 'Fallback evaluation',
        alternatives: [], model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/supplier/survival') {
      return { survival_probability: 0.85, risk_factors: [], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/supplier/graph-risk') {
      return { risk_score: 30, network_position: 'unknown', dependencies: [], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/anomaly/detect') {
      return { anomalies: [], alerts: [], model_version: 'fallback_v1' };
    }
    return null;
  }

  async supplierRiskAssessment(data) {
    return this.call('post', '/api/v1/supplier/risk', data, { allowFallback: true });
  }

  async sourcingRecommendations(supplierId) {
    return this.call('get', `/api/v1/supplier/recommendations/${supplierId}`, null, { allowFallback: true, bypassCircuitBreaker: true });
  }

  async supplierSurvival(data) {
    return this.call('post', '/api/v1/supplier/survival', data, { allowFallback: true });
  }

  async supplierGraphRisk(data) {
    return this.call('post', '/api/v1/supplier/graph-risk', data, { allowFallback: true });
  }

  async anomalyDetection(data) {
    return this.call('post', '/api/v1/anomaly/detect', data, { allowFallback: true });
  }
}

module.exports = SupplierApiService;
