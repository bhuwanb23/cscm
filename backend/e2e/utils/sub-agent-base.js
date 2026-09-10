/**
 * Base Sub-Agent Class
 * Base class for all role-specific test sub-agents
 */

const ApiClient = require('../config/api-client');
const testData = require('../config/test-data');
const config = require('../config/test-config');

class BaseSubAgent {
  constructor(role, userId) {
    this.role = role;
    this.userId = userId;
    this.apiClient = new ApiClient();
    this.state = {};
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: []
    };
  }

  /**
   * Initialize sub-agent
   */
  async initialize() {
    console.log(`Initializing ${this.role} sub-agent (user: ${this.userId})`);
    
    // Wait for all services to be healthy
    await this.apiClient.waitForAllServices();
    
    // Load initial state
    await this.loadInitialState();
    
    console.log(`${this.role} sub-agent initialized successfully`);
  }

  /**
   * Load initial state for the sub-agent
   */
  async loadInitialState() {
    try {
      // Load user profile
      const profile = await this.apiClient.gatewayGet('/api/v1/auth/profile');
      this.state.profile = profile.data;
      
      // Load role-specific data
      await this.loadRoleSpecificData();
    } catch (error) {
      console.log(`No existing state for ${this.role}, starting fresh`);
    }
  }

  /**
   * Load role-specific data (to be overridden by subclasses)
   */
  async loadRoleSpecificData() {
    // Override in subclasses
  }

  /**
   * Login as the role
   */
  async login() {
    console.log(`Logging in as ${this.role}`);
    
    const authData = testData.authData[this.role];
    if (!authData) {
      throw new Error(`No auth data found for role: ${this.role}`);
    }

    const startTime = Date.now();
    try {
      const response = await this.apiClient.gatewayPost('/api/v1/auth/login', {
        email: authData.email,
        password: authData.password
      });
      
      this.recordResponseTime(Date.now() - startTime);
      this.state.token = response.data.token;
      this.state.user = response.data.user;
      
      console.log(`Login successful for ${this.role}`);
      return response.data;
    } catch (error) {
      this.recordError();
      throw new Error(`Login failed for ${this.role}: ${error.message}`);
    }
  }

  /**
   * Logout
   */
  async logout() {
    console.log(`Logging out ${this.role}`);
    this.state.token = null;
    this.state.user = null;
  }

  /**
   * Perform an action (to be overridden by subclasses)
   */
  async performAction(action, data = {}) {
    throw new Error('performAction must be implemented by subclass');
  }

  /**
   * Validate API response
   */
  validateResponse(response, expectedFields = []) {
    if (!response || !response.success) {
      throw new Error('Response validation failed: response not successful');
    }

    if (expectedFields.length > 0) {
      for (const field of expectedFields) {
        if (!(field in response.data)) {
          throw new Error(`Response validation failed: missing field ${field}`);
        }
      }
    }

    return true;
  }

  /**
   * Record response time metric
   */
  recordResponseTime(time) {
    this.metrics.responseTimes.push(time);
    this.metrics.requests++;
  }

  /**
   * Record error metric
   */
  recordError() {
    this.metrics.errors++;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    const maxResponseTime = this.metrics.responseTimes.length > 0
      ? Math.max(...this.metrics.responseTimes)
      : 0;

    const p95ResponseTime = this.calculateP95(this.metrics.responseTimes);

    return {
      role: this.role,
      userId: this.userId,
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0,
      avgResponseTime,
      maxResponseTime,
      p95ResponseTime
    };
  }

  /**
   * Calculate 95th percentile
   */
  calculateP95(values) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    
    return sorted[index];
  }

  /**
   * Check if performance meets thresholds
   */
  checkPerformanceThresholds() {
    const metrics = this.getMetrics();
    const thresholds = config.performance;

    const p95Ok = metrics.p95ResponseTime <= thresholds.responseTimeP95;
    const errorRateOk = metrics.errorRate <= thresholds.errorRate;

    return {
      p95Ok,
      errorRateOk,
      meetsThresholds: p95Ok && errorRateOk
    };
  }

  /**
   * Wait for a condition
   */
  async waitForCondition(condition, timeout = 30000, interval = 1000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await this.sleep(interval);
    }
    
    throw new Error('Condition not met within timeout');
  }

  /**
   * Utility function to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    console.log(`Cleaning up ${this.role} sub-agent data`);
    
    try {
      // Delete test orders
      for (const order of testData.orders) {
        try {
          await this.apiClient.gatewayDelete(`/api/v1/orders/${order.order_id}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      // Delete test shipments
      for (const shipment of testData.shipments) {
        try {
          await this.apiClient.gatewayDelete(`/api/v1/shipments/${shipment.shipment_id}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      // Reset inventory to initial state
      for (const inventory of testData.inventory) {
        try {
          await this.apiClient.gatewayPut(
            `/api/v1/inventory/${inventory.store_id}/${inventory.sku_id}/quantity`,
            { quantity: inventory.quantity }
          );
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      console.log(`Cleanup completed for ${this.role} sub-agent`);
    } catch (error) {
      console.error(`Cleanup error for ${this.role}:`, error.message);
    }
  }

  /**
   * Run all tests for this sub-agent
   */
  async runAllTests() {
    console.log(`Running all tests for ${this.role} sub-agent`);
    
    const testMethods = this.getTestMethods();
    const results = [];

    for (const testName of testMethods) {
      try {
        console.log(`Running test: ${testName}`);
        const startTime = Date.now();
        
        await this[testName]();
        
        const duration = Date.now() - startTime;
        results.push({
          test: testName,
          status: 'passed',
          duration
        });
        
        console.log(`✓ Test passed: ${testName} (${duration}ms)`);
      } catch (error) {
        results.push({
          test: testName,
          status: 'failed',
          error: error.message
        });
        
        console.error(`✗ Test failed: ${testName} - ${error.message}`);
      }
    }

    const summary = {
      role: this.role,
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
      metrics: this.getMetrics()
    };

    console.log(`Test summary for ${this.role}:`, summary);
    
    return summary;
  }

  /**
   * Get test methods (to be overridden by subclasses)
   */
  getTestMethods() {
    return [];
  }
}

module.exports = BaseSubAgent;
