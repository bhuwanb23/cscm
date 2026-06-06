const BaseApiService = require('../../../services/BaseApiService');

class CentralPlannerApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/demand/forecast') {
      return {
        forecast_values: [100], forecast_dates: [new Date().toISOString().slice(0, 10)],
        model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/inventory/optimize') {
      return { reorder_quantity: 50, safety_stock: 25, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/routing/optimize') {
      return { routes: [{ waypoints: [], total_distance_km: 0 }], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/supplier/risk') {
      return { risk_score: 0.5, risk_level: 'medium', model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/coordination/plan') {
      return { plan_id: `PLAN-${Date.now()}`, status: 'created', steps: [], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/coordination/status') {
      return { status: 'unknown', model_version: 'fallback_v1' };
    }
    if (path && path.startsWith('/api/v1/anomaly/alerts/')) {
      const alertId = path.split('/').pop();
      return { alert_id: alertId, severity: 'unknown', status: 'unknown', model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/kg/query') {
      return { entities: [], relationships: [], paths: [], model_version: 'fallback_v1' };
    }
    if (path && path.startsWith('/api/v1/monitoring/drift')) {
      return { drift_detected: false, drift_score: 0, affected_features: [], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/uncertainty/safety-stock') {
      return {
        safety_stock: 50,
        uncertainty_bounds: { lower: 25, upper: 75 },
        confidence_level: 0.95,
        model_version: 'fallback_v1'
      };
    }
    return null;
  }

  async demandForecast(data) {
    return this.call('post', '/api/v1/demand/forecast', data, { allowFallback: true });
  }

  async inventoryOptimization(data) {
    return this.call('post', '/api/v1/inventory/optimize', data, { allowFallback: true });
  }

  async routingOptimization(data) {
    return this.call('post', '/api/v1/routing/optimize', data, { allowFallback: true });
  }

  async supplierRiskAssessment(data) {
    return this.call('post', '/api/v1/supplier/risk', data, { allowFallback: true });
  }

  async coordinationPlan(data) {
    return this.call('post', '/api/v1/coordination/plan', data, { allowFallback: true });
  }

  async coordinationStatus(planId) {
    return this.call('get', `/api/v1/coordination/status/${planId}`, null, { allowFallback: true, bypassCircuitBreaker: true });
  }

  async anomalyAlert(alertId) {
    return this.call('get', `/api/v1/anomaly/alerts/${alertId}`, null, { allowFallback: true, bypassCircuitBreaker: true });
  }

  async kgQuery(data) {
    return this.call('post', '/api/v1/kg/query', data, { allowFallback: true });
  }

  async driftCheck(data) {
    return this.call('post', '/api/v1/monitoring/drift', data, { allowFallback: true });
  }

  async safetyStock(data) {
    return this.call('post', '/api/v1/uncertainty/safety-stock', data, { allowFallback: true });
  }
}

module.exports = CentralPlannerApiService;
