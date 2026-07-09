const BaseApiService = require('../../../services/BaseApiService');

class TransportApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/routing/optimize') {
      return { routes: [{ waypoints: [], total_distance_km: 0 }], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/routing/eta') {
      return { arrival_time: new Date(Date.now() + 3600000).toISOString(), confidence: 0.8, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/routing/travel-time') {
      return { estimated_minutes: 60, confidence_interval: [45, 75], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/routing/gnn-route') {
      return { routes: [], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/anomaly/detect') {
      return { anomalies: [], alerts: [], model_version: 'fallback_v1' };
    }
    if (path.startsWith('/api/v1/routing/status/')) {
      return { route_id: '', status: 'unknown', current_location: null, eta_minutes: null, progress_pct: 0, model_version: 'fallback_v1' };
    }
    if (path.startsWith('/api/v1/routing/edge/deploy/')) {
      const deploymentId = path.split('/').pop() || 'DEP-fallback';
      return { deployment_id: deploymentId, status: 'removed', model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/routing/edge/deploy') {
      return { deployment_id: 'DEP-fallback', status: 'deployed', endpoint_url: 'edge://local', model_version: 'fallback_v1' };
    }
    return null;
  }

  async routingOptimization(data) {
    return this.call('post', '/api/v1/routing/optimize', data, { allowFallback: true });
  }

  async routingEta(data) {
    return this.call('post', '/api/v1/routing/eta', data, { allowFallback: true });
  }

  async travelTime(data) {
    return this.call('post', '/api/v1/routing/travel-time', data, { allowFallback: true });
  }

  async gnnRoutePlanning(data) {
    return this.call('post', '/api/v1/routing/gnn-route', data, { allowFallback: true });
  }

  async anomalyDetection(data) {
    return this.call('post', '/api/v1/anomaly/detect', data, { allowFallback: true });
  }

  async routeStatus(routeId) {
    return this.call('get', `/api/v1/routing/status/${routeId}`, null, { allowFallback: true, bypassCircuitBreaker: true });
  }

  async edgeDeploy(data) {
    return this.call('post', '/api/v1/routing/edge/deploy', data, { allowFallback: true });
  }

  async edgeUndeploy(deploymentId) {
    return this.call('delete', `/api/v1/routing/edge/deploy/${deploymentId}`, null, { allowFallback: true });
  }
}

module.exports = TransportApiService;
