const ScenarioRunner = require('../../../../agents/simulation/sub-agents/ScenarioRunner');

describe('ScenarioRunner', () => {
  const mockApiService = {
    simulationRun: jest.fn(),
    simulationDiscreteEvent: jest.fn(),
    simulationResults: jest.fn(),
    simulationNetworkSim: jest.fn(),
    simulationWhatIf: jest.fn()
  };
  const agentId = 'SIM-001';
  let runner;

  beforeEach(() => {
    runner = new ScenarioRunner(agentId, mockApiService);
    jest.clearAllMocks();
  });

  test('should set name, parentId, and apiService on construction', () => {
    expect(runner.name).toBe('ScenarioRunner');
    expect(runner.parentId).toBe(agentId);
    expect(runner.apiService).toBe(mockApiService);
  });

  describe('run', () => {
    const scenario = { type: 'demand_shock', storeId: 'STORE-001' };
    const apiResult = { simulation_id: 'SIM-123', status: 'completed', summary: { events: 10 } };

    test('should return mapped simulation result on success', async () => {
      mockApiService.simulationRun.mockResolvedValue(apiResult);

      const result = await runner.run(scenario);

      expect(mockApiService.simulationRun).toHaveBeenCalledWith(scenario);
      expect(result).toEqual({
        simulationId: 'SIM-123',
        status: 'completed',
        summary: apiResult.summary,
        timestamp: expect.any(String)
      });
    });

    test('should throw when scenario is missing', async () => {
      await expect(runner.run(null)).rejects.toThrow('scenario is required');
      expect(mockApiService.simulationRun).not.toHaveBeenCalled();
    });

    test('should return fallback when API fails', async () => {
      mockApiService.simulationRun.mockRejectedValue(new Error('API error'));

      const result = await runner.run(scenario);

      expect(result.status).toBe('completed');
      expect(result.fallback).toBe(true);
      expect(result.simulationId).toEqual(expect.stringContaining('SIM-'));
      expect(result.summary.entities_affected).toEqual(['STORE-001']);
    });
  });

  describe('discreteEvent', () => {
    const config = { type: 'supply_disruption', probability: 0.3 };
    const apiResult = { events: [{ id: 'E-1' }], duration: 100 };

    test('should return discrete event result on success', async () => {
      mockApiService.simulationDiscreteEvent.mockResolvedValue(apiResult);

      const result = await runner.discreteEvent(config);

      expect(mockApiService.simulationDiscreteEvent).toHaveBeenCalledWith(config);
      expect(result).toEqual(apiResult);
    });

    test('should return fallback when API fails', async () => {
      mockApiService.simulationDiscreteEvent.mockRejectedValue(new Error('API error'));

      const result = await runner.discreteEvent(config);

      expect(result).toEqual({
        events: [],
        duration: 0,
        summary: { total_events: 0 },
        fallback: true
      });
    });
  });

  describe('getResults', () => {
    const simulationId = 'SIM-123';
    const apiResult = { simulation_id: simulationId, status: 'completed', metrics: {} };

    test('should return simulation results on success', async () => {
      mockApiService.simulationResults.mockResolvedValue(apiResult);

      const result = await runner.getResults(simulationId);

      expect(mockApiService.simulationResults).toHaveBeenCalledWith(simulationId);
      expect(result).toEqual(apiResult);
    });

    test('should throw when simulationId is missing', async () => {
      await expect(runner.getResults(null)).rejects.toThrow('simulationId is required');
      expect(mockApiService.simulationResults).not.toHaveBeenCalled();
    });

    test('should return fallback when API fails', async () => {
      mockApiService.simulationResults.mockRejectedValue(new Error('API error'));

      const result = await runner.getResults(simulationId);

      expect(result).toEqual({ simulationId, status: 'unknown', fallback: true });
    });
  });

  describe('networkSimulation', () => {
    const config = { nodes: 10, topology: 'mesh' };
    const apiResult = { nodes: [{ id: 'N-1' }], edges: [{ from: 'N-1', to: 'N-2' }], metrics: { latency: 5 } };

    test('should return network simulation result on success', async () => {
      mockApiService.simulationNetworkSim.mockResolvedValue(apiResult);

      const result = await runner.networkSimulation(config);

      expect(mockApiService.simulationNetworkSim).toHaveBeenCalledWith(config);
      expect(result).toEqual(apiResult);
    });

    test('should return fallback when API fails', async () => {
      mockApiService.simulationNetworkSim.mockRejectedValue(new Error('API error'));

      const result = await runner.networkSimulation(config);

      expect(result).toEqual({ nodes: [], edges: [], metrics: {}, fallback: true });
    });
  });

  describe('whatIf', () => {
    const scenario = { type: 'price_change' };
    const changes = { price: -0.1 };
    const apiResult = { impact: 'positive', confidence: 0.85, details: {} };

    test('should return what-if result on success', async () => {
      mockApiService.simulationWhatIf.mockResolvedValue(apiResult);

      const result = await runner.whatIf(scenario, changes);

      expect(mockApiService.simulationWhatIf).toHaveBeenCalledWith({ scenario, changes });
      expect(result).toEqual(apiResult);
    });

    test('should return fallback when API fails', async () => {
      mockApiService.simulationWhatIf.mockRejectedValue(new Error('API error'));

      const result = await runner.whatIf(scenario, changes);

      expect(result).toEqual({ impact: 'unknown', confidence: 0.5, fallback: true });
    });
  });
});
