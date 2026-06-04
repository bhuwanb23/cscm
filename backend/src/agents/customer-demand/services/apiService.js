const BaseApiService = require('../../../services/BaseApiService');

class CustomerDemandApiService extends BaseApiService {
  _getFallback(method, path, data) {
    if (path === '/api/v1/demand/forecast') {
      return {
        forecast_values: [100], forecast_dates: [new Date().toISOString().slice(0, 10)],
        model_version: 'fallback_v1',
      };
    }
    if (path === '/api/v1/causal/analyze') {
      return { treatment_effect: 0, confidence_interval: [0, 0], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/nlp/query') {
      return { intent: 'unknown', entities: [], sentiment: 0, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/customer/trends') {
      return { segment: 'all', trend: 'stable', confidence: 0.5, model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/customer/segment-similarity') {
      return { similarity: 0.5, shared_characteristics: [], model_version: 'fallback_v1' };
    }
    if (path === '/api/v1/nlp/sentiment') {
      return {
        sentiment_score: 0,
        sentiment_label: 'neutral',
        confidence: 0,
        key_phrases: [],
        model_version: 'fallback_v1'
      };
    }
    return null;
  }

  async demandForecast(data) {
    return this.call('post', '/api/v1/demand/forecast', data, { allowFallback: true });
  }

  async causalInference(data) {
    return this.call('post', '/api/v1/causal/analyze', data, { allowFallback: true });
  }

  async naturalLanguageProcessing(data) {
    return this.call('post', '/api/v1/nlp/query', data, { allowFallback: true });
  }

  async customerTrends(customerSegment) {
    return this.call('get', `/api/v1/customer/trends/${customerSegment}`, null, { allowFallback: true, bypassCircuitBreaker: true });
  }

  async segmentSimilarity(data) {
    return this.call('post', '/api/v1/customer/segment-similarity', data, { allowFallback: true });
  }

  async sentimentAnalysis(data) {
    return this.call('post', '/api/v1/nlp/sentiment', data, { allowFallback: true });
  }
}

module.exports = CustomerDemandApiService;
