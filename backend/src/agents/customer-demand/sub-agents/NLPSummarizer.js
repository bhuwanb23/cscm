const SubAgent = require('../../_base/SubAgent');

class NLPSummarizer extends SubAgent {
  constructor(segmentId, apiService) {
    super('NLPSummarizer', `CD-${segmentId}`, apiService);
    this.segmentId = segmentId;
  }

  async analyzeSentiment(text, options = {}) {
    this.log('Analyzing sentiment');

    if (text === undefined || text === null) throw new Error('text is required');

    try {
      const result = await this.apiService.sentimentAnalysis({ text, options });
      return {
        sentiment_score: result.sentiment_score !== undefined ? result.sentiment_score : 0,
        sentiment_label: result.sentiment_label || 'neutral',
        confidence: result.confidence !== undefined ? result.confidence : 0,
        key_phrases: result.key_phrases || [],
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Sentiment analysis failed:', err.message);
      return this._fallbackSentiment();
    }
  }

  async summarize(text, maxLength = 100) {
    this.log(`Summarizing text (maxLength=${maxLength})`);

    if (text === undefined || text === null) throw new Error('text is required');

    try {
      const result = await this.apiService.sentimentAnalysis({
        text,
        max_length: maxLength,
        action: 'summarize'
      });
      return {
        summary: result.summary !== undefined ? result.summary : '',
        key_points: result.key_points || [],
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Summarization failed:', err.message);
      return this._fallbackSummary();
    }
  }

  _fallbackSentiment() {
    return {
      sentiment_score: 0,
      sentiment_label: 'neutral',
      confidence: 0,
      key_phrases: [],
      model_version: 'fallback'
    };
  }

  _fallbackSummary() {
    return {
      summary: '',
      key_points: [],
      model_version: 'fallback'
    };
  }
}

module.exports = NLPSummarizer;
