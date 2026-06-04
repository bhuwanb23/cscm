const SubAgent = require('../../_base/SubAgent');

class ContinualLearner extends SubAgent {
  constructor(storeId, apiService) {
    super('ContinualLearner', `Store-${storeId}`, apiService);
    this.storeId = storeId;
  }

  async strategicUpdate(modelState, newData) {
    this.log('Running strategic continual-learning update');

    if (!modelState) throw new Error('modelState is required');
    if (!newData) throw new Error('newData is required');

    const learningRate = (modelState && modelState.learning_rate) || 0.001;

    const payload = {
      model_state: modelState,
      new_data: newData,
      learning_rate: learningRate
    };

    try {
      const result = await this.apiService.strategicUpdate(payload);
      return {
        model_version: result.model_version || 'unknown',
        training_metrics: result.training_metrics || { loss: 0, accuracy: 0, samples_seen: 0 },
        updated_at: result.updated_at || new Date().toISOString()
      };
    } catch (err) {
      this.error('Strategic update failed:', err.message);
      return this._fallbackUpdate();
    }
  }

  async getLearningStatus(modelId) {
    this.log(`Fetching learning status for model ${modelId}`);

    if (!modelId) throw new Error('modelId is required');

    if (this.apiService && typeof this.apiService.call === 'function') {
      try {
        const result = await this.apiService.call(
          'get',
          `/api/v1/learning/status/${modelId}`,
          null,
          { allowFallback: true, bypassCircuitBreaker: true }
        );
        if (result) return result;
      } catch (err) {
        this.error('Learning status fetch failed:', err.message);
      }
    }

    return {
      model_id: modelId,
      status: 'unknown',
      last_update: null,
      model_version: 'fallback'
    };
  }

  _fallbackUpdate() {
    return {
      model_version: 'fallback',
      training_metrics: { loss: 0, accuracy: 0, samples_seen: 0 },
      updated_at: new Date().toISOString()
    };
  }
}

module.exports = ContinualLearner;
