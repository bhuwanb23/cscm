const NLPSummarizer = require('../../../../agents/customer-demand/sub-agents/NLPSummarizer');

describe('NLPSummarizer', () => {
  let apiService;
  let summarizer;
  const segmentId = 'SEG-001';

  beforeEach(() => {
    apiService = {
      sentimentAnalysis: jest.fn()
    };
    summarizer = new NLPSummarizer(segmentId, apiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, and apiService', () => {
      expect(summarizer.name).toBe('NLPSummarizer');
      expect(summarizer.parentId).toBe(`CD-${segmentId}`);
      expect(summarizer.apiService).toBe(apiService);
      expect(summarizer.segmentId).toBe(segmentId);
    });
  });

  describe('analyzeSentiment', () => {
    const text = 'Great product, love it!';

    it('should return mapped sentiment result on success', async () => {
      const apiResult = {
        sentiment_score: 0.92,
        sentiment_label: 'positive',
        confidence: 0.95,
        key_phrases: ['great product', 'love it'],
        model_version: 'v2'
      };
      apiService.sentimentAnalysis.mockResolvedValue(apiResult);

      const result = await summarizer.analyzeSentiment(text);

      expect(apiService.sentimentAnalysis).toHaveBeenCalledWith({ text, options: {} });
      expect(result).toEqual(apiResult);
    });

    it('should pass options when provided', async () => {
      apiService.sentimentAnalysis.mockResolvedValue({
        sentiment_score: 0, sentiment_label: 'neutral', confidence: 0, key_phrases: [], model_version: 'v1'
      });

      const opts = { lang: 'en', extract_phrases: true };
      await summarizer.analyzeSentiment(text, opts);

      expect(apiService.sentimentAnalysis).toHaveBeenCalledWith({ text, options: opts });
    });

    it('should return fallback when API throws', async () => {
      apiService.sentimentAnalysis.mockRejectedValue(new Error('API down'));

      const result = await summarizer.analyzeSentiment(text);

      expect(result).toEqual({
        sentiment_score: 0,
        sentiment_label: 'neutral',
        confidence: 0,
        key_phrases: [],
        model_version: 'fallback'
      });
    });

    it('should throw when text is null', async () => {
      await expect(summarizer.analyzeSentiment(null)).rejects.toThrow('text is required');
      expect(apiService.sentimentAnalysis).not.toHaveBeenCalled();
    });

    it('should accept empty string and still call API', async () => {
      apiService.sentimentAnalysis.mockResolvedValue({
        sentiment_score: 0, sentiment_label: 'neutral', confidence: 0, key_phrases: [], model_version: 'v1'
      });

      const result = await summarizer.analyzeSentiment('');

      expect(apiService.sentimentAnalysis).toHaveBeenCalledWith({ text: '', options: {} });
      expect(result.sentiment_label).toBe('neutral');
    });

    it('should default missing API fields to safe values', async () => {
      apiService.sentimentAnalysis.mockResolvedValue({});

      const result = await summarizer.analyzeSentiment(text);

      expect(result.sentiment_score).toBe(0);
      expect(result.sentiment_label).toBe('neutral');
      expect(result.confidence).toBe(0);
      expect(result.key_phrases).toEqual([]);
      expect(result.model_version).toBe('unknown');
    });
  });

  describe('summarize', () => {
    const text = 'A very long text that needs summarizing for the user.';

    it('should send summarize request and return mapped result on success', async () => {
      const apiResult = {
        summary: 'Long text summary',
        key_points: ['point a', 'point b'],
        model_version: 'v2'
      };
      apiService.sentimentAnalysis.mockResolvedValue(apiResult);

      const result = await summarizer.summarize(text, 50);

      expect(apiService.sentimentAnalysis).toHaveBeenCalledWith({
        text,
        max_length: 50,
        action: 'summarize'
      });
      expect(result).toEqual(apiResult);
    });

    it('should default maxLength to 100', async () => {
      apiService.sentimentAnalysis.mockResolvedValue({
        summary: 's', key_points: [], model_version: 'v1'
      });

      await summarizer.summarize(text);

      expect(apiService.sentimentAnalysis).toHaveBeenCalledWith({
        text,
        max_length: 100,
        action: 'summarize'
      });
    });

    it('should return fallback when API throws', async () => {
      apiService.sentimentAnalysis.mockRejectedValue(new Error('API down'));

      const result = await summarizer.summarize(text);

      expect(result).toEqual({
        summary: '',
        key_points: [],
        model_version: 'fallback'
      });
    });

    it('should throw when text is null', async () => {
      await expect(summarizer.summarize(null)).rejects.toThrow('text is required');
    });
  });

  describe('_fallbackSentiment', () => {
    it('should return neutral sentiment fallback', () => {
      expect(summarizer._fallbackSentiment()).toEqual({
        sentiment_score: 0,
        sentiment_label: 'neutral',
        confidence: 0,
        key_phrases: [],
        model_version: 'fallback'
      });
    });
  });

  describe('_fallbackSummary', () => {
    it('should return empty summary fallback', () => {
      expect(summarizer._fallbackSummary()).toEqual({
        summary: '',
        key_points: [],
        model_version: 'fallback'
      });
    });
  });
});
