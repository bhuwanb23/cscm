const ContinualLearner = require('../../../../agents/store/sub-agents/ContinualLearner');

describe('ContinualLearner', () => {
  let apiService;
  let learner;
  const storeId = 'STORE-001';

  beforeEach(() => {
    apiService = {
      strategicUpdate: jest.fn(),
      call: jest.fn()
    };
    learner = new ContinualLearner(storeId, apiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, and apiService', () => {
      expect(learner.name).toBe('ContinualLearner');
      expect(learner.parentId).toBe(`Store-${storeId}`);
      expect(learner.apiService).toBe(apiService);
      expect(learner.storeId).toBe(storeId);
    });
  });

  describe('strategicUpdate', () => {
    const modelState = { version: 'v1', learning_rate: 0.01, weights: [0.1] };
    const newData = [{ sample: 1 }, { sample: 2 }];

    it('should send strategic update request and return mapped result on success', async () => {
      const apiResult = {
        model_version: 'v2',
        training_metrics: { loss: 0.1, accuracy: 0.95, samples_seen: 100 },
        updated_at: '2024-01-01T00:00:00Z'
      };
      apiService.strategicUpdate.mockResolvedValue(apiResult);

      const result = await learner.strategicUpdate(modelState, newData);

      expect(apiService.strategicUpdate).toHaveBeenCalledWith({
        model_state: modelState,
        new_data: newData,
        learning_rate: 0.01
      });
      expect(result).toEqual(apiResult);
    });

    it('should default learning rate when not in modelState', async () => {
      const stateNoLr = { version: 'v1', weights: [0.1] };
      apiService.strategicUpdate.mockResolvedValue({
        model_version: 'v2',
        training_metrics: { loss: 0, accuracy: 0, samples_seen: 0 },
        updated_at: 't'
      });

      await learner.strategicUpdate(stateNoLr, newData);

      expect(apiService.strategicUpdate.mock.calls[0][0].learning_rate).toBe(0.001);
    });

    it('should return fallback when API throws', async () => {
      apiService.strategicUpdate.mockRejectedValue(new Error('API down'));

      const result = await learner.strategicUpdate(modelState, newData);

      expect(result.model_version).toBe('fallback');
      expect(result.training_metrics).toEqual({ loss: 0, accuracy: 0, samples_seen: 0 });
      expect(typeof result.updated_at).toBe('string');
    });

    it('should throw when modelState is missing', async () => {
      await expect(learner.strategicUpdate(null, newData)).rejects.toThrow('modelState is required');
      expect(apiService.strategicUpdate).not.toHaveBeenCalled();
    });

    it('should throw when newData is missing', async () => {
      await expect(learner.strategicUpdate(modelState, null)).rejects.toThrow('newData is required');
      expect(apiService.strategicUpdate).not.toHaveBeenCalled();
    });

    it('should default missing API fields to safe values', async () => {
      apiService.strategicUpdate.mockResolvedValue({});

      const result = await learner.strategicUpdate(modelState, newData);

      expect(result.model_version).toBe('unknown');
      expect(result.training_metrics).toEqual({ loss: 0, accuracy: 0, samples_seen: 0 });
      expect(typeof result.updated_at).toBe('string');
    });
  });

  describe('getLearningStatus', () => {
    const modelId = 'model-1';

    it('should call apiService.call and return result on success', async () => {
      const apiResult = { model_id: modelId, status: 'training', last_update: 't' };
      apiService.call.mockResolvedValue(apiResult);

      const result = await learner.getLearningStatus(modelId);

      const [method, url, body, opts] = apiService.call.mock.calls[0];
      expect(method).toBe('get');
      expect(url).toBe(`/api/v1/learning/status/${modelId}`);
      expect(body).toBeNull();
      expect(opts.allowFallback).toBe(true);
      expect(result).toEqual(apiResult);
    });

    it('should return fallback when API throws', async () => {
      apiService.call.mockRejectedValue(new Error('API down'));

      const result = await learner.getLearningStatus(modelId);

      expect(result).toEqual({
        model_id: modelId,
        status: 'unknown',
        last_update: null,
        model_version: 'fallback'
      });
    });

    it('should return fallback when apiService has no call method', async () => {
      const stub = { strategicUpdate: jest.fn() };
      const isolated = new ContinualLearner(storeId, stub);

      const result = await isolated.getLearningStatus(modelId);

      expect(result.status).toBe('unknown');
      expect(result.model_version).toBe('fallback');
    });

    it('should throw when modelId is missing', async () => {
      await expect(learner.getLearningStatus(null)).rejects.toThrow('modelId is required');
    });
  });

  describe('_fallbackUpdate', () => {
    it('should return fallback update with proper shape', () => {
      const result = learner._fallbackUpdate();

      expect(result.model_version).toBe('fallback');
      expect(result.training_metrics).toEqual({ loss: 0, accuracy: 0, samples_seen: 0 });
      expect(typeof result.updated_at).toBe('string');
    });
  });
});
