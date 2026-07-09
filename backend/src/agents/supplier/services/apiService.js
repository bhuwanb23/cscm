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
    if (path === '/api/v1/supplier/calibrate') {
      const isStatus = data && data.action === 'get_status';
      if (isStatus) {
        return {
          last_calibrated: null,
          sample_size: 0,
          drift_detected: false,
          model_version: 'fallback_v1'
        };
      }
      return {
        calibration_score: 0.5,
        threshold_adjustments: { low: 30, medium: 60, high: 80 },
        model_version: 'fallback_v1'
      };
    }
    if (path === '/api/v1/supplier/backup') {
      return {
        backups: [{
          supplier_id: 'BACKUP-001',
          score: 0.7,
          lead_time_days: 14,
          quality_score: 0.8,
          distance_km: 100
        }],
        total_candidates: 1,
        model_version: 'fallback_v1'
      };
    }
    if (path && path.startsWith('/api/v1/supplier/risk-metrics')) {
      const rangeMatch = path.match(/[?&]range=([^&]*)/);
      const timeRange = rangeMatch ? decodeURIComponent(rangeMatch[1]) : '30d';
      return {
        time_range: timeRange,
        total_assessments: 0,
        avg_risk_score: 0,
        distribution: { low: 0, medium: 0, high: 0 },
        trends: [],
        model_version: 'fallback_v1'
      };
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

  async supplierCalibrate(data) {
    return this.call('post', '/api/v1/supplier/calibrate', data, { allowFallback: true });
  }

  async supplierBackup(data) {
    return this.call('post', '/api/v1/supplier/backup', data, { allowFallback: true });
  }

  async supplierRiskMetrics(data) {
    return this.call('post', '/api/v1/supplier/risk-metrics', data, { allowFallback: true });
  }
}

module.exports = SupplierApiService;
