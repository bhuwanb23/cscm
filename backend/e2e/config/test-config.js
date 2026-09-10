/**
 * E2E Test Configuration
 * Central configuration for end-to-end testing
 */

module.exports = {
  // Service endpoints
  services: {
    gateway: process.env.GATEWAY_URL || 'http://localhost:8080',
    backend: process.env.BACKEND_URL || 'http://localhost:3000',
    aiMl: process.env.AI_ML_URL || 'http://localhost:8000',
    mobile: process.env.MOBILE_URL || 'http://localhost:19006'
  },

  // Test database configuration
  database: {
    path: process.env.TEST_DB_PATH || './data/cscm_test.db',
    seedFile: process.env.SEED_FILE || './scripts/seed-test-data.js'
  },

  // Test timeouts
  timeouts: {
    request: 30000, // 30 seconds
    serviceStartup: 120000, // 2 minutes
    agentExecution: 60000, // 1 minute
    testExecution: 600000 // 10 minutes
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2
  },

  // Test settings
  test: {
    parallel: process.env.PARALLEL_TESTS === 'true',
    headless: process.env.HEADLESS === 'true',
    screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
    slowMo: parseInt(process.env.SLOW_MO) || 0
  },

  // Performance thresholds
  performance: {
    responseTimeP95: 200, // milliseconds
    errorRate: 0.001, // 0.1%
    throughput: 100, // requests per second
    aiMlLatency: 500 // milliseconds
  },

  // Load testing configuration
  loadTesting: {
    concurrentUsers: 10,
    rampUpDuration: 60, // seconds
    testDuration: 300, // seconds
    requestsPerSecond: 100
  },

  // Monitoring settings
  monitoring: {
    collectMetrics: true,
    metricsInterval: 1000, // milliseconds
    exportMetrics: true
  }
};
