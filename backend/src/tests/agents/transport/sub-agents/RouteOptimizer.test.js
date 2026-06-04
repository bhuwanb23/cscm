const RouteOptimizer = require('../../../../agents/transport/sub-agents/RouteOptimizer');

const mockApiService = {
  routingOptimization: jest.fn(),
  routingEta: jest.fn(),
  travelTime: jest.fn(),
};

describe('RouteOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new RouteOptimizer(42, mockApiService);
  });

  describe('constructor', () => {
    it('should set transportId and call super with correct args', () => {
      expect(optimizer.name).toBe('RouteOptimizer');
      expect(optimizer.parentId).toBe('Transport-42');
      expect(optimizer.apiService).toBe(mockApiService);
      expect(optimizer.transportId).toBe(42);
    });
  });

  describe('optimize', () => {
    const deliveries = [{ id: 1 }, { id: 2 }];
    const vehicles = [{ id: 'v1' }];

    it('should return routes on success', async () => {
      mockApiService.routingOptimization.mockResolvedValue({ routes: [{ vehicleId: 'v1', deliveries: [{ id: 1 }] }] });
      const result = await optimizer.optimize(deliveries, vehicles);
      expect(mockApiService.routingOptimization).toHaveBeenCalledWith({ deliveries, vehicles, transport_id: 42 });
      expect(result).toEqual([{ vehicleId: 'v1', deliveries: [{ id: 1 }] }]);
    });

    it('should throw if deliveries is empty', async () => {
      await expect(optimizer.optimize([], vehicles)).rejects.toThrow('deliveries are required');
    });

    it('should throw if deliveries is null', async () => {
      await expect(optimizer.optimize(null, vehicles)).rejects.toThrow(TypeError);
    });

    it('should throw if vehicles is empty', async () => {
      await expect(optimizer.optimize(deliveries, [])).rejects.toThrow('vehicles are required');
    });

    it('should throw if vehicles is null', async () => {
      await expect(optimizer.optimize(deliveries, null)).rejects.toThrow(TypeError);
    });

    it('should fallback when apiService.routingOptimization rejects', async () => {
      mockApiService.routingOptimization.mockRejectedValue(new Error('API down'));
      const result = await optimizer.optimize(deliveries, vehicles);
      expect(result).toHaveLength(vehicles.length);
      expect(result[0].vehicleId).toBe('v1');
      expect(result[0].deliveries).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should return empty array when result.routes is falsy', async () => {
      mockApiService.routingOptimization.mockResolvedValue({});
      const result = await optimizer.optimize(deliveries, vehicles);
      expect(result).toEqual([]);
    });
  });

  describe('predictETA', () => {
    const routeData = { stops: [{ lat: 10, lng: 20 }] };

    it('should return eta on success', async () => {
      mockApiService.routingEta.mockResolvedValue({ eta: '2026-06-04T18:00:00Z' });
      const result = await optimizer.predictETA(routeData);
      expect(mockApiService.routingEta).toHaveBeenCalledWith(routeData);
      expect(result).toEqual({ eta: '2026-06-04T18:00:00Z' });
    });

    it('should return null when apiService.routingEta rejects', async () => {
      mockApiService.routingEta.mockRejectedValue(new Error('ETA error'));
      const result = await optimizer.predictETA(routeData);
      expect(result).toBeNull();
    });
  });

  describe('predictTravelTime', () => {
    const origin = { lat: 28.6139, lng: 77.209 };
    const destination = { lat: 19.076, lng: 72.8777 };

    it('should return travel time on success', async () => {
      mockApiService.travelTime.mockResolvedValue({ estimated_minutes: 120 });
      const result = await optimizer.predictTravelTime(origin, destination);
      expect(mockApiService.travelTime).toHaveBeenCalledWith({ origin, destination });
      expect(result).toEqual({ estimated_minutes: 120 });
    });

    it('should fallback to haversine estimate when apiService.travelTime rejects', async () => {
      mockApiService.travelTime.mockRejectedValue(new Error('Travel API down'));
      const result = await optimizer.predictTravelTime(origin, destination);
      expect(result.estimated_minutes).toBeGreaterThan(0);
    });
  });

  describe('_fallbackRoutes', () => {
    it('should distribute deliveries evenly across vehicles', () => {
      const deliveries = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const vehicles = [{ id: 'v1' }, { id: 'v2' }];
      const result = optimizer._fallbackRoutes(deliveries, vehicles);
      expect(result).toHaveLength(2);
      expect(result[0].vehicleId).toBe('v1');
      expect(result[0].deliveries).toHaveLength(2);
      expect(result[1].vehicleId).toBe('v2');
      expect(result[1].deliveries).toHaveLength(1);
      expect(result[0].total_distance_km).toBe(0);
    });
  });

  describe('_haversineDistance', () => {
    it('should return 0 if either point is null', () => {
      expect(optimizer._haversineDistance(null, { lat: 10, lng: 20 })).toBe(0);
      expect(optimizer._haversineDistance({ lat: 10, lng: 20 }, null)).toBe(0);
      expect(optimizer._haversineDistance(null, null)).toBe(0);
    });

    it('should calculate approximate distance between two points', () => {
      const mumbai = { lat: 19.076, lng: 72.8777 };
      const delhi = { lat: 28.6139, lng: 77.209 };
      const dist = optimizer._haversineDistance(mumbai, delhi);
      expect(dist).toBeGreaterThan(1100);
      expect(dist).toBeLessThan(1200);
    });

    it('should return 0 for same point', () => {
      const pt = { lat: 10, lng: 20 };
      expect(optimizer._haversineDistance(pt, pt)).toBe(0);
    });
  });
});
