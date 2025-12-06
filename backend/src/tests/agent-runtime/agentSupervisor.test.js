const agentSupervisor = require('../../agent-runtime/agentSupervisor');

describe('Agent Supervisor Tests', () => {
  beforeEach(() => {
    // Reset the supervisor state before each test
    agentSupervisor.agents.clear();
    agentSupervisor.agentStatus.clear();
    agentSupervisor.restartAttempts.clear();
  });

  test('should register an agent', () => {
    agentSupervisor.registerAgent('TestAgent', '/path/to/script.js');
    
    expect(agentSupervisor.agents.has('TestAgent')).toBe(true);
    expect(agentSupervisor.agentStatus.has('TestAgent')).toBe(true);
    
    const agent = agentSupervisor.agents.get('TestAgent');
    expect(agent.scriptPath).toBe('/path/to/script.js');
    expect(agent.status).toBe('stopped');
    
    const status = agentSupervisor.agentStatus.get('TestAgent');
    expect(status.status).toBe('stopped');
  });

  test('should get agent status', () => {
    agentSupervisor.registerAgent('TestAgent', '/path/to/script.js');
    
    const status = agentSupervisor.getAgentStatus('TestAgent');
    expect(status).toBeDefined();
    expect(status.status).toBe('stopped');
  });

  test('should get all agents status', () => {
    agentSupervisor.registerAgent('TestAgent1', '/path/to/script1.js');
    agentSupervisor.registerAgent('TestAgent2', '/path/to/script2.js');
    
    const statuses = agentSupervisor.getAllAgentsStatus();
    expect(Object.keys(statuses)).toHaveLength(2);
    expect(statuses.TestAgent1).toBeDefined();
    expect(statuses.TestAgent2).toBeDefined();
  });

  test('should handle non-existent agent status', () => {
    const status = agentSupervisor.getAgentStatus('NonExistentAgent');
    expect(status).toBeNull();
  });
});