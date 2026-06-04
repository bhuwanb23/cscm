const RouteTracker = require('../../../../agents/transport/sub-agents/RouteTracker');

const mockApiService = {
  routeStatus: jest.fn(),
};

describe('RouteTracker', () => {
  let tracker;

  beforeEach(() => {
    jest.clearAllMocks();
    tracker = new RouteTracker(11, mockApiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, apiService via super', () => {
      expect(tracker.name).toBe('RouteTracker');
      expect(tracker.parentId).toBe('Transport-11');
      expect(tracker.apiService).toBe(mockApiService);
    });

    it('should set transportId', () => {
      expect(tracker.transportId).toBe(11);
    });
  });

  describe('trackRoute', () => {
    it('should return mapped result on success', async () => {
      const apiResult = {
        route_id: 'R-001',
        status: 'in_transit',
        current_location: { lat: 10, lng: 20 },
        eta_minutes: 45,
        progress_pct: 0.6,
        model_version: 'v3'
      };
      mockApiService.routeStatus.mockResolvedValue(apiResult);

      const result = await tracker.trackRoute('R-001');

      expect(mockApiService.routeStatus).toHaveBeenCalledWith('R-001');
      expect(result).toEqual({
        route_id: 'R-001',
        status: 'in_transit',
        current_location: { lat: 10, lng: 20 },
        eta_minutes: 45,
        progress_pct: 0.6,
        model_version: 'v3'
      });
    });

    it('should use passed routeId when result.route_id is missing', async () => {
      mockApiService.routeStatus.mockResolvedValue({
        status: 'pending',
        current_location: null,
        eta_minutes: null,
        progress_pct: 0,
        model_version: 'v1'
      });

      const result = await tracker.trackRoute('R-XYZ');
      expect(result.route_id).toBe('R-XYZ');
    });

    it('should fallback when apiService.routeStatus rejects', async () => {
      mockApiService.routeStatus.mockRejectedValue(new Error('Status API down'));

      const result = await tracker.trackRoute('R-002');

      expect(result).toEqual({
        route_id: 'R-002',
        status: 'unknown',
        current_location: null,
        eta_minutes: null,
        progress_pct: 0,
        model_version: 'fallback'
      });
    });

    it('should throw if routeId is missing', async () => {
      await expect(tracker.trackRoute(null)).rejects.toThrow('routeId is required');
      await expect(tracker.trackRoute('')).rejects.toThrow('routeId is required');
    });
  });

  describe('trackBatch', () => {
    it('should aggregate successful results', async () => {
      mockApiService.routeStatus.mockImplementation((id) =>
        Promise.resolve({
          route_id: id,
          status: 'in_transit',
          current_location: { lat: 1, lng: 2 },
          eta_minutes: 30,
          progress_pct: 0.5,
          model_version: 'v2'
        })
      );

      const result = await tracker.trackBatch(['R-1', 'R-2', 'R-3']);

      expect(mockApiService.routeStatus).toHaveBeenCalledTimes(3);
      expect(mockApiService.routeStatus).toHaveBeenNthCalledWith(1, 'R-1');
      expect(mockApiService.routeStatus).toHaveBeenNthCalledWith(2, 'R-2');
      expect(mockApiService.routeStatus).toHaveBeenNthCalledWith(3, 'R-3');
      expect(result.routes).toHaveLength(3);
      expect(result.total_tracked).toBe(3);
      expect(result.failed).toEqual([]);
    });

    it('should return empty result for empty input', async () => {
      const result = await tracker.trackBatch([]);
      expect(result).toEqual({ routes: [], total_tracked: 0, failed: [] });
      expect(mockApiService.routeStatus).not.toHaveBeenCalled();
    });

    it('should return empty result for null input', async () => {
      const result = await tracker.trackBatch(null);
      expect(result).toEqual({ routes: [], total_tracked: 0, failed: [] });
      expect(mockApiService.routeStatus).not.toHaveBeenCalled();
    });

    it('should record failed ids when apiService throws', async () => {
      mockApiService.routeStatus.mockImplementation((id) => {
        if (id === 'R-bad') return Promise.reject(new Error('API down'));
        return Promise.resolve({
          route_id: id,
          status: 'in_transit',
          current_location: { lat: 1, lng: 2 },
          eta_minutes: 30,
          progress_pct: 0.5,
          model_version: 'v2'
        });
      });

      const result = await tracker.trackBatch(['R-ok', 'R-bad']);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route_id).toBe('R-ok');
      expect(result.total_tracked).toBe(1);
      expect(result.failed).toEqual(['R-bad']);
    });
  });

  describe('_fallbackTrack', () => {
    it('should return fallback object for the given routeId', () => {
      const result = tracker._fallbackTrack('R-FB');
      expect(result).toEqual({
        route_id: 'R-FB',
        status: 'unknown',
        current_location: null,
        eta_minutes: null,
        progress_pct: 0,
        model_version: 'fallback'
      });
    });
  });
});
