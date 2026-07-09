const FleetManager = require('../../../../agents/transport/sub-agents/FleetManager');

const mockApiService = {
  gnnRoutePlanning: jest.fn(),
};

describe('FleetManager', () => {
  let manager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new FleetManager(3, mockApiService);
  });

  describe('constructor', () => {
    it('should set transportId and call super with correct args', () => {
      expect(manager.name).toBe('FleetManager');
      expect(manager.parentId).toBe('Transport-3');
      expect(manager.apiService).toBe(mockApiService);
      expect(manager.transportId).toBe(3);
    });
  });

  describe('gnnRoutePlanning', () => {
    const deliveries = [{ id: 1 }, { id: 2 }];
    const vehicles = [{ id: 'v1' }];

    it('should return result on success', async () => {
      const expected = { routes: [{ vehicleId: 'v1', deliveries: [{ id: 1 }] }], model_version: 'v2' };
      mockApiService.gnnRoutePlanning.mockResolvedValue(expected);
      const result = await manager.gnnRoutePlanning(deliveries, vehicles);
      expect(mockApiService.gnnRoutePlanning).toHaveBeenCalledWith({ deliveries, vehicles, transport_id: 3 });
      expect(result).toEqual(expected);
    });

    it('should throw if deliveries is empty', async () => {
      await expect(manager.gnnRoutePlanning([], vehicles)).rejects.toThrow('deliveries are required');
    });

    it('should throw if deliveries is null', async () => {
      await expect(manager.gnnRoutePlanning(null, vehicles)).rejects.toThrow('deliveries are required');
    });

    it('should throw if vehicles is empty', async () => {
      await expect(manager.gnnRoutePlanning(deliveries, [])).rejects.toThrow('vehicles are required');
    });

    it('should throw if vehicles is null', async () => {
      await expect(manager.gnnRoutePlanning(deliveries, null)).rejects.toThrow('vehicles are required');
    });

    it('should return fallback when apiService.gnnRoutePlanning rejects', async () => {
      mockApiService.gnnRoutePlanning.mockRejectedValue(new Error('GNN API error'));
      const result = await manager.gnnRoutePlanning(deliveries, vehicles);
      expect(result).toEqual({ routes: [], model_version: 'fallback' });
    });
  });

  describe('assignVehicle', () => {
    const delivery = { id: 'del-1', weight: 100 };

    it('should return the most recently maintained vehicle among suitable', () => {
      const vehicles = [
        { id: 'v1', status: 'available', capacity: 200, lastMaintenance: 10 },
        { id: 'v2', status: 'available', capacity: 200, lastMaintenance: 5 },
        { id: 'v3', status: 'maintenance', capacity: 200 },
      ];
      const result = manager.assignVehicle(delivery, vehicles);
      expect(result.id).toBe('v2');
    });

    it('should return null if no vehicles are available', () => {
      const vehicles = [
        { id: 'v1', status: 'maintenance', capacity: 200 },
        { id: 'v2', status: 'out_of_service', capacity: 200 },
      ];
      const result = manager.assignVehicle(delivery, vehicles);
      expect(result).toBeNull();
    });

    it('should return null if availableVehicles is empty', () => {
      const result = manager.assignVehicle(delivery, []);
      expect(result).toBeNull();
    });

    it('should return null if availableVehicles is null', () => {
      const result = manager.assignVehicle(delivery, null);
      expect(result).toBeNull();
    });

    it('should filter by capacity when delivery has weight', () => {
      const heavyDelivery = { id: 'del-2', weight: 500 };
      const vehicles = [
        { id: 'v1', status: 'available', capacity: 200 },
        { id: 'v2', status: 'available', capacity: 600 },
      ];
      const result = manager.assignVehicle(heavyDelivery, vehicles);
      expect(result.id).toBe('v2');
    });

    it('should skip capacity check when delivery has no weight', () => {
      const lightDelivery = { id: 'del-3' };
      const vehicles = [
        { id: 'v1', status: 'available', capacity: 100 },
      ];
      const result = manager.assignVehicle(lightDelivery, vehicles);
      expect(result.id).toBe('v1');
    });
  });

  describe('updateVehicleStatus', () => {
    it('should update status and lastUpdated for existing vehicle', () => {
      const vehicles = { v1: { id: 'v1', status: 'available', capacity: 200 } };
      const result = manager.updateVehicleStatus('v1', 'maintenance', vehicles);
      expect(result.status).toBe('maintenance');
      expect(result.capacity).toBe(200);
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should return null if vehicle does not exist', () => {
      const result = manager.updateVehicleStatus('nonexistent', 'available', {});
      expect(result).toBeNull();
    });

    it('should return null if vehicles is null', () => {
      const result = manager.updateVehicleStatus('v1', 'available', null);
      expect(result).toBeNull();
    });
  });

  describe('generateAnalytics', () => {
    it('should compute rates from delivery statuses', () => {
      const deliveries = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'delayed' },
        { status: 'in_transit' },
      ];
      const result = manager.generateAnalytics(deliveries);
      expect(result.totalDeliveries).toBe(4);
      expect(result.completedDeliveries).toBe(2);
      expect(result.delayedDeliveries).toBe(1);
      expect(result.completionRate).toBe(0.5);
      expect(result.delayRate).toBe(0.25);
      expect(result).toHaveProperty('timestamp');
    });

    it('should return zero rates when deliveries is empty', () => {
      const result = manager.generateAnalytics([]);
      expect(result.totalDeliveries).toBe(0);
      expect(result.completedDeliveries).toBe(0);
      expect(result.delayedDeliveries).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.delayRate).toBe(0);
    });

    it('should handle all completed deliveries', () => {
      const deliveries = [{ status: 'completed' }, { status: 'completed' }];
      const result = manager.generateAnalytics(deliveries);
      expect(result.completionRate).toBe(1);
      expect(result.delayRate).toBe(0);
    });
  });
});
