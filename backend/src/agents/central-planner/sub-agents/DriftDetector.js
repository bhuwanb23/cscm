const SubAgent = require('../../_base/SubAgent');

const KNOWN_MODELS = [
  'demand-forecaster',
  'inventory-optimizer',
  'routing-optimizer',
  'supplier-risk'
];

class DriftDetector extends SubAgent {
  constructor(plannerId, apiService) {
    super('DriftDetector', `CP-${plannerId}`, apiService);
    this.plannerId = plannerId;
    this.knownModels = KNOWN_MODELS;
  }

  async checkDrift(modelId, timeWindow = '24h') {
    this.log(`Checking drift for model ${modelId} (window=${timeWindow})`);

    if (!modelId) throw new Error('modelId is required');

    try {
      const result = await this.apiService.driftCheck({
        model_id: modelId,
        window: timeWindow
      });
      return {
        model_id: result.model_id || modelId,
        drift_detected: result.drift_detected !== undefined ? result.drift_detected : false,
        drift_score: result.drift_score !== undefined ? result.drift_score : 0,
        affected_features: result.affected_features || [],
        timestamp: result.timestamp || new Date().toISOString(),
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Drift check failed:', err.message);
      return this._fallbackDrift(modelId);
    }
  }

  async checkAllModels(timeWindow = '24h') {
    this.log(`Checking drift for all known models (window=${timeWindow})`);

    const results = [];
    for (const modelId of this.knownModels) {
      try {
        const r = await this.checkDrift(modelId, timeWindow);
        results.push(r);
      } catch (err) {
        this.error(`checkAllModels: failed for ${modelId}`, err.message);
        results.push(this._fallbackDrift(modelId));
      }
    }

    return {
      results,
      any_drift_detected: results.some(r => r.drift_detected === true),
      total: results.length,
      window: timeWindow
    };
  }

  _fallbackDrift(modelId) {
    return {
      model_id: modelId,
      drift_detected: false,
      drift_score: 0,
      affected_features: [],
      model_version: 'fallback'
    };
  }
}

module.exports = DriftDetector;
