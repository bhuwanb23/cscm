const DeliveryScheduler = require('../../../../agents/transport/sub-agents/DeliveryScheduler');

const mockApiService = {
  routingOptimization: jest.fn(),
};

describe('DeliveryScheduler', () => {
  let scheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new DeliveryScheduler(7, mockApiService);
  });

  describe('constructor', () => {
    it('should set transportId and call super with correct args', () => {
      expect(scheduler.name).toBe('DeliveryScheduler');
      expect(scheduler.parentId).toBe('Transport-7');
      expect(scheduler.apiService).toBe(mockApiService);
      expect(scheduler.transportId).toBe(7);
    });
  });

  describe('schedule', () => {
    const deliveries = [{ id: 1 }, { id: 2 }];
    const timeWindows = [{ start: '09:00', end: '17:00' }];
    const vehicles = [{ id: 'v1' }];

    it('should return routes on success', async () => {
      mockApiService.routingOptimization.mockResolvedValue({ routes: [{ deliveryId: 1, scheduledTime: '2026-06-04T12:00:00Z', status: 'scheduled' }] });
      const result = await scheduler.schedule(deliveries, timeWindows, vehicles);
      expect(mockApiService.routingOptimization).toHaveBeenCalledWith({ deliveries, time_windows: timeWindows, vehicles, transport_id: 7 });
      expect(result).toEqual([{ deliveryId: 1, scheduledTime: '2026-06-04T12:00:00Z', status: 'scheduled' }]);
    });

    it('should throw if deliveries is empty', async () => {
      await expect(scheduler.schedule([], timeWindows, vehicles)).rejects.toThrow('deliveries are required');
    });

    it('should throw if deliveries is null', async () => {
      await expect(scheduler.schedule(null, timeWindows, vehicles)).rejects.toThrow(TypeError);
    });

    it('should fallback when apiService.routingOptimization rejects', async () => {
      mockApiService.routingOptimization.mockRejectedValue(new Error('API down'));
      const result = await scheduler.schedule(deliveries, timeWindows, vehicles);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('deliveryId');
      expect(result[0]).toHaveProperty('scheduledTime');
      expect(result[0].status).toBe('scheduled');
    });

    it('should fallback when result.routes is falsy', async () => {
      mockApiService.routingOptimization.mockResolvedValue({});
      const result = await scheduler.schedule(deliveries, timeWindows, vehicles);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('scheduled');
    });
  });

  describe('track', () => {
    it('should return tracking data with deliveryId and timestamp', () => {
      const result = scheduler.track('del-1', { lat: 10, lng: 20 });
      expect(result.deliveryId).toBe('del-1');
      expect(result.lat).toBe(10);
      expect(result.lng).toBe(20);
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should throw if deliveryId is missing', () => {
      expect(() => scheduler.track(null, { lat: 10 })).toThrow('deliveryId is required');
    });

    it('should throw if trackingData is missing', () => {
      expect(() => scheduler.track('del-1', null)).toThrow('trackingData is required');
    });
  });

  describe('shouldSendNotification', () => {
    it('should return true for delayed event', () => {
      expect(scheduler.shouldSendNotification({ event: 'delayed' })).toBe(true);
    });

    it('should return true for arrived event', () => {
      expect(scheduler.shouldSendNotification({ event: 'arrived' })).toBe(true);
    });

    it('should return true for departed event', () => {
      expect(scheduler.shouldSendNotification({ event: 'departed' })).toBe(true);
    });

    it('should return true for exception event', () => {
      expect(scheduler.shouldSendNotification({ event: 'exception' })).toBe(true);
    });

    it('should return false for non-significant event', () => {
      expect(scheduler.shouldSendNotification({ event: 'in_transit' })).toBe(false);
    });

    it('should return false if trackingData is null', () => {
      expect(scheduler.shouldSendNotification(null)).toBe(false);
    });

    it('should return false if trackingData is undefined', () => {
      expect(scheduler.shouldSendNotification(undefined)).toBe(false);
    });
  });

  describe('sendNotification', () => {
    it('should return a sent notification object', () => {
      const result = scheduler.sendNotification({ deliveryId: 'del-1' }, 'delay', 'Traffic jam');
      expect(result.delivery).toEqual({ deliveryId: 'del-1' });
      expect(result.notificationType).toBe('delay');
      expect(result.details).toBe('Traffic jam');
      expect(result.sent).toBe(true);
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle delivery as string', () => {
      const result = scheduler.sendNotification('del-1', 'arrival', 'Arrived safely');
      expect(result.delivery).toBe('del-1');
      expect(result.sent).toBe(true);
    });
  });

  describe('handleException', () => {
    it('should return an unresolved exception object', () => {
      const result = scheduler.handleException('del-1', 'damage', 'Package damaged in transit');
      expect(result.deliveryId).toBe('del-1');
      expect(result.exceptionType).toBe('damage');
      expect(result.details).toBe('Package damaged in transit');
      expect(result.resolved).toBe(false);
      expect(result).toHaveProperty('timestamp');
    });
  });
});
