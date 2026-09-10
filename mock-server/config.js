/**
 * Mock Server Configuration
 */

module.exports = {
  port: process.env.MOCK_PORT || 8081,
  
  // Response delay configuration (in milliseconds)
  delay: {
    min: 100,
    max: 500
  },
  
  // Error simulation probability (0 to 1)
  errorProbability: {
    timeout: 0.01,
    serverError: 0.05,
    notFound: 0.02
  },
  
  // Mock data configuration
  data: {
    users: 20,
    inventory: 50,
    orders: 30,
    shipments: 25,
    events: 40
  },
  
  // Enable/disable features
  features: {
    randomDelays: true,
    errorSimulation: true,
    requestLogging: true
  }
};
