const processManager = require('../../agent-runtime/processManager');

describe('Process Manager Tests', () => {
  beforeEach(() => {
    processManager.isInitialized = false;
  });

  test('should export processManager', () => {
    expect(processManager).toBeDefined();
    expect(typeof processManager.initialize).toBe('function');
    expect(typeof processManager.startAllAgents).toBe('function');
    expect(typeof processManager.stopAllAgents).toBe('function');
    expect(typeof processManager.startAgent).toBe('function');
    expect(typeof processManager.stopAgent).toBe('function');
    expect(typeof processManager.restartAgent).toBe('function');
    expect(typeof processManager.getAgentStatus).toBe('function');
    expect(typeof processManager.getAllAgentsStatus).toBe('function');
    expect(typeof processManager.healthCheck).toBe('function');
  });

  test('should initialize process manager', async () => {
    await processManager.initialize();
    expect(processManager.isInitialized).toBe(true);
  });

  test('should get all agents status', async () => {
    await processManager.initialize();
    const statuses = processManager.getAllAgentsStatus();
    expect(statuses).toBeDefined();
    // Should have at least the registered agents
    expect(Object.keys(statuses).length).toBeGreaterThan(0);
  });

  test('should get agent status', async () => {
    await processManager.initialize();
    const status = processManager.getAgentStatus('StoreAgent1');
    expect(status).toBeDefined();
    expect(status.status).toBe('stopped');
  });
});