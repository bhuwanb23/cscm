const { 
  StoreAgent, 
  WarehouseAgent, 
  TransportAgent, 
  CentralPlannerAgent, 
  SimulationAgent 
} = require('../../agents');

describe('Agent Initialization Tests', () => {
  test('Store Agent should initialize without errors', () => {
    const agent = new StoreAgent('TEST-STORE');
    expect(agent).toBeInstanceOf(StoreAgent);
    expect(agent.storeId).toBe('TEST-STORE');
  });

  test('Warehouse Agent should initialize without errors', () => {
    const agent = new WarehouseAgent('TEST-WAREHOUSE');
    expect(agent).toBeInstanceOf(WarehouseAgent);
    expect(agent.warehouseId).toBe('TEST-WAREHOUSE');
  });

  test('Transport Agent should initialize without errors', () => {
    const agent = new TransportAgent('TEST-TRANSPORT');
    expect(agent).toBeInstanceOf(TransportAgent);
    expect(agent.transportId).toBe('TEST-TRANSPORT');
  });

  test('Central Planner Agent should initialize without errors', () => {
    const agent = new CentralPlannerAgent();
    expect(agent).toBeInstanceOf(CentralPlannerAgent);
  });

  test('Simulation Agent should initialize without errors', () => {
    const agent = new SimulationAgent();
    expect(agent).toBeInstanceOf(SimulationAgent);
  });
});