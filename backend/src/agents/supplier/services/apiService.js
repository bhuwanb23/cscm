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
    if (path === '/api/v1/anomaly/detect') {
      return { anomalies: [], alerts: [], model_version: 'fallback_v1' };
    }
    return null;
  }

  async supplierRiskAssessment(data) {
    return this.call('post', '/api/v1/supplier/risk', data, { allowFallback: true });
  }

  async anomalyDetection(data) {
    return this.call('post', '/api/v1/anomaly/detect', data, { allowFallback: true });
  }
}

module.exports = SupplierApiService;
