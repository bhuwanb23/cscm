const DeliveryCoordinator = require('../../../../agents/central-planner/sub-agents/DeliveryCoordinator');

describe('DeliveryCoordinator', () => {
  const mockApiService = {
    coordinationPlan: jest.fn(),
    coordinationStatus: jest.fn()
  };
  const agentId = 'CP-001';
  let coordinator;

  beforeEach(() => {
    coordinator = new DeliveryCoordinator(agentId, mockApiService);
    jest.clearAllMocks();
  });

  test('should set name, parentId, and apiService on construction', () => {
    expect(coordinator.name).toBe('DeliveryCoordinator');
    expect(coordinator.parentId).toBe(agentId);
    expect(coordinator.apiService).toBe(mockApiService);
  });

  describe('createPlan', () => {
    const assignments = [{ storeId: 'STORE-001', product: 'PROD-001' }];
    const transporters = [{ id: 'T-1', status: 'available' }];
    const apiResult = { planId: 'PLAN-1', status: 'created', steps: [] };

    test('should return coordination plan on success', async () => {
      mockApiService.coordinationPlan.mockResolvedValue(apiResult);

      const result = await coordinator.createPlan(assignments, transporters);

      expect(mockApiService.coordinationPlan).toHaveBeenCalledWith({
        assignments,
        transporters
      });
      expect(result).toEqual(apiResult);
    });

    test('should return fallback plan when API fails', async () => {
      mockApiService.coordinationPlan.mockRejectedValue(new Error('API error'));

      const result = await coordinator.createPlan(assignments, transporters);

      expect(result.status).toBe('created');
      expect(result.steps[0].storeId).toBe('STORE-001');
      expect(result.steps[0].transporterId).toBe('T-1');
      expect(result.fallback).toBeUndefined();
    });
  });

  describe('getStatus', () => {
    const planId = 'PLAN-1';
    const apiResult = { planId, status: 'in_progress', progress: 50 };

    test('should return coordination status on success', async () => {
      mockApiService.coordinationStatus.mockResolvedValue(apiResult);

      const result = await coordinator.getStatus(planId);

      expect(mockApiService.coordinationStatus).toHaveBeenCalledWith(planId);
      expect(result).toEqual(apiResult);
    });

    test('should throw when planId is missing', async () => {
      await expect(coordinator.getStatus(null)).rejects.toThrow('planId is required');
      expect(mockApiService.coordinationStatus).not.toHaveBeenCalled();
    });

    test('should return unknown status fallback when API fails', async () => {
      mockApiService.coordinationStatus.mockRejectedValue(new Error('API error'));

      const result = await coordinator.getStatus(planId);

      expect(result).toEqual({
        planId,
        status: 'unknown',
        timestamp: expect.any(String)
      });
    });
  });

  describe('assignTransporter', () => {
    const transporters = [
      { id: 'T-1', status: 'busy', priorityScore: 5 },
      { id: 'T-2', status: 'available', priorityScore: 3 },
      { id: 'T-3', status: 'available', priorityScore: 8 }
    ];

    test('should return first available transporter for normal urgency', () => {
      const result = coordinator.assignTransporter('STORE-001', transporters, 'normal');
      expect(result.id).toBe('T-2');
    });

    test('should return highest priority transporter for high urgency', () => {
      const result = coordinator.assignTransporter('STORE-001', transporters, 'high');
      expect(result.id).toBe('T-3');
    });

    test('should return null when transporters list is empty', () => {
      expect(coordinator.assignTransporter('STORE-001', [], 'normal')).toBeNull();
    });

    test('should return null when transporters is null', () => {
      expect(coordinator.assignTransporter('STORE-001', null, 'normal')).toBeNull();
    });

    test('should return null when no available transporters', () => {
      const busy = [{ id: 'T-1', status: 'busy' }];
      expect(coordinator.assignTransporter('STORE-001', busy, 'normal')).toBeNull();
    });
  });

  describe('_fallbackPlan', () => {
    test('should generate fallback plan with assignments', () => {
      const assignments = [{ storeId: 'STORE-001' }, { storeId: 'STORE-002' }];
      const transporters = [{ id: 'T-1', status: 'available' }];

      const result = coordinator._fallbackPlan(assignments, transporters);

      expect(result.status).toBe('created');
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].storeId).toBe('STORE-001');
      expect(result.steps[0].transporterId).toBe('T-1');
      expect(result.steps[1].storeId).toBe('STORE-002');
      expect(result.steps[1].transporterId).toBe('T-1');
      expect(result.planId).toEqual(expect.stringContaining('PLAN-'));
    });

    test('should handle null assignments', () => {
      const result = coordinator._fallbackPlan(null, []);
      expect(result.steps).toEqual([]);
    });

    test('should use default transporter when none available', () => {
      const result = coordinator._fallbackPlan(['STORE-001'], []);
      expect(result.steps[0].transporterId).toBe('TRANSPORT-1');
    });
  });
});
