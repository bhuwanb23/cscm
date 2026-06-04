const BaseApiService = require('../../../services/BaseApiService');

class SimulationApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/digital-twin/simulate') {
      return { simulation_id: 'fallback', status: 'completed', results: {}, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/demand/forecast') {
      return {
        forecast_values: [100], forecast_dates: [new Date().toISOString().slice(0, 10)],
        model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/inventory/optimize') {
      return { reorder_quantity: 50, safety_stock: 25, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/simulation/run') {
      return { simulation_id: `SIM-${Date.now()}`, status: 'completed', summary: { events_generated: 5 }, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/simulation/discrete-event-sim') {
      return { events: [], duration: 0, summary: { total_events: 0 }, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/simulation/results') {
      return { status: 'unknown', model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/simulation/network-sim') {
      return { nodes: [], edges: [], metrics: {}, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/simulation/policy-impact') {
      return { impact: 'unknown', confidence: 0.5, model_version: 'fallback_v1' };
    }
    return null;
  }

  async digitalTwinSimulation(data) {
    return this.call('post', '/api/v1/digital-twin/simulate', data, { allowFallback: true });
  }

  async demandForecast(data) {
    return this.call('post', '/api/v1/demand/forecast', data, { allowFallback: true });
  }

  async inventoryOptimization(data) {
    return this.call('post', '/api/v1/inventory/optimize', data, { allowFallback: true });
  }

  async simulationRun(data) {
    return this.call('post', '/api/v1/simulation/run', data, { allowFallback: true });
  }

  async simulationDiscreteEvent(data) {
    return this.call('post', '/api/v1/simulation/discrete-event-sim', data, { allowFallback: true });
  }

  async simulationResults(simulationId) {
    return this.call('get', `/api/v1/simulation/results/${simulationId}`, null, { allowFallback: true, bypassCircuitBreaker: true });
  }

  async simulationNetworkSim(data) {
    return this.call('post', '/api/v1/simulation/network-sim', data, { allowFallback: true });
  }

  async simulationWhatIf(data) {
    return this.call('post', '/api/v1/simulation/policy-impact', data, { allowFallback: true });
  }
}

module.exports = SimulationApiService;
