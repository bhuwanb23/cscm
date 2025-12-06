const healthMonitor = require('../../agent-runtime/healthMonitor');

describe('Health Monitor Tests', () => {
  test('should export healthMonitor', () => {
    expect(healthMonitor).toBeDefined();
    expect(typeof healthMonitor.startMonitoring).toBe('function');
    expect(typeof healthMonitor.stopMonitoring).toBe('function');
    expect(typeof healthMonitor.getHealthStatus).toBe('function');
    expect(typeof healthMonitor.getAgentHealth).toBe('function');
  });

  test('should start and stop monitoring', () => {
    // Start monitoring
    healthMonitor.startMonitoring();
    expect(healthMonitor.monitoringInterval).not.toBeNull();
    
    // Stop monitoring
    healthMonitor.stopMonitoring();
    expect(healthMonitor.monitoringInterval).toBeNull();
  });

  test('should handle double start/stop', () => {
    // Start monitoring twice
    healthMonitor.startMonitoring();
    healthMonitor.startMonitoring(); // Should not throw
    
    // Stop monitoring twice
    healthMonitor.stopMonitoring();
    healthMonitor.stopMonitoring(); // Should not throw
  });
});