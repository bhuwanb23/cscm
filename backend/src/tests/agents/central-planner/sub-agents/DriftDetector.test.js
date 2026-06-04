const DriftDetector = require('../../../../agents/central-planner/sub-agents/DriftDetector');

describe('DriftDetector', () => {
  let apiService;
  let detector;
  const plannerId = '001';

  beforeEach(() => {
    apiService = {
      driftCheck: jest.fn()
    };
    detector = new DriftDetector(plannerId, apiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, and apiService', () => {
      expect(detector.name).toBe('DriftDetector');
      expect(detector.parentId).toBe(`CP-${plannerId}`);
      expect(detector.apiService).toBe(apiService);
      expect(detector.plannerId).toBe(plannerId);
    });

    it('should expose knownModels list', () => {
      expect(Array.isArray(detector.knownModels)).toBe(true);
      expect(detector.knownModels.length).toBeGreaterThan(0);
    });
  });

  describe('checkDrift', () => {
    const modelId = 'demand-forecaster';

    it('should call driftCheck with default 24h window and return mapped result', async () => {
      const apiResult = {
        model_id: modelId,
        drift_detected: true,
        drift_score: 0.42,
        affected_features: ['price'],
        timestamp: '2024-01-01T00:00:00Z',
        model_version: 'v2'
      };
      apiService.driftCheck.mockResolvedValue(apiResult);

      const result = await detector.checkDrift(modelId);

      expect(apiService.driftCheck).toHaveBeenCalledWith({ model_id: modelId, window: '24h' });
      expect(result).toEqual(apiResult);
    });

    it('should pass custom timeWindow', async () => {
      apiService.driftCheck.mockResolvedValue({
        model_id: modelId, drift_detected: false, drift_score: 0,
        affected_features: [], timestamp: 't', model_version: 'v1'
      });

      await detector.checkDrift(modelId, '7d');

      expect(apiService.driftCheck).toHaveBeenCalledWith({ model_id: modelId, window: '7d' });
    });

    it('should return fallback when API throws', async () => {
      apiService.driftCheck.mockRejectedValue(new Error('API down'));

      const result = await detector.checkDrift(modelId);

      expect(result).toEqual({
        model_id: modelId,
        drift_detected: false,
        drift_score: 0,
        affected_features: [],
        model_version: 'fallback'
      });
    });

    it('should throw when modelId is missing', async () => {
      await expect(detector.checkDrift(null)).rejects.toThrow('modelId is required');
      expect(apiService.driftCheck).not.toHaveBeenCalled();
    });

    it('should default missing API fields to safe values', async () => {
      apiService.driftCheck.mockResolvedValue({});

      const result = await detector.checkDrift(modelId);

      expect(result.model_id).toBe(modelId);
      expect(result.drift_detected).toBe(false);
      expect(result.drift_score).toBe(0);
      expect(result.affected_features).toEqual([]);
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('checkAllModels', () => {
    it('should iterate knownModels and aggregate results', async () => {
      apiService.driftCheck.mockResolvedValue({
        drift_detected: false, drift_score: 0, affected_features: [], model_version: 'v1'
      });

      const result = await detector.checkAllModels('1h');

      expect(apiService.driftCheck).toHaveBeenCalledTimes(detector.knownModels.length);
      expect(result.results).toHaveLength(detector.knownModels.length);
      expect(result.any_drift_detected).toBe(false);
      expect(result.total).toBe(detector.knownModels.length);
      expect(result.window).toBe('1h');
    });

    it('should set any_drift_detected true if any model has drift', async () => {
      let callCount = 0;
      apiService.driftCheck.mockImplementation(() => {
        callCount += 1;
        return Promise.resolve({
          drift_detected: callCount === 2,
          drift_score: callCount === 2 ? 0.8 : 0,
          affected_features: [],
          model_version: 'v1'
        });
      });

      const result = await detector.checkAllModels();

      expect(result.any_drift_detected).toBe(true);
    });

    it('should use fallbacks when API throws for all models', async () => {
      apiService.driftCheck.mockRejectedValue(new Error('API down'));

      const result = await detector.checkAllModels();

      expect(result.results).toHaveLength(detector.knownModels.length);
      result.results.forEach(r => {
        expect(r.drift_detected).toBe(false);
        expect(r.model_version).toBe('fallback');
      });
      expect(result.any_drift_detected).toBe(false);
    });

    it('should default window to 24h when not provided', async () => {
      apiService.driftCheck.mockResolvedValue({
        drift_detected: false, drift_score: 0, affected_features: [], model_version: 'v1'
      });

      const result = await detector.checkAllModels();

      expect(result.window).toBe('24h');
      expect(apiService.driftCheck.mock.calls[0][0].window).toBe('24h');
    });

    it('should pass timeWindow to each checkDrift call', async () => {
      apiService.driftCheck.mockResolvedValue({
        drift_detected: false, drift_score: 0, affected_features: [], model_version: 'v1'
      });

      await detector.checkAllModels('30m');

      apiService.driftCheck.mock.calls.forEach(call => {
        expect(call[0].window).toBe('30m');
      });
    });
  });

  describe('_fallbackDrift', () => {
    it('should return fallback object with model id', () => {
      expect(detector._fallbackDrift('foo')).toEqual({
        model_id: 'foo',
        drift_detected: false,
        drift_score: 0,
        affected_features: [],
        model_version: 'fallback'
      });
    });
  });
});
