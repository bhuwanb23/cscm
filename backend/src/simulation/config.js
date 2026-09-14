/**
 * Simulation Configuration
 * Controls autonomous user simulation behavior for CSCM hackathon
 */

module.exports = {
  // API Configuration
  api: {
    backendUrl: process.env.BACKEND_URL || 'https://cscm-backend.onrender.com',
    aiMlUrl: process.env.AI_ML_API_URL || 'https://cscm-aiml.onrender.com',
    aiMlApiKey: process.env.AI_ML_API_KEY || '',
  },

  // Simulation Schedule
  schedule: {
    // Run every 2 hours during business hours (9am-6pm UTC)
    businessHours: {
      start: 9, // 9am UTC
      end: 18, // 6pm UTC
    },
    intervalMinutes: 120, // 2 hours
  },

  // User Configuration
  users: {
    counts: {
      shopkeeper: 10,
      transporter: 10,
      wholesaler: 10,
      admin: 10,
    },
    // Naming pattern for simulated users
    namePattern: {
      shopkeeper: 'shopkeeper_',
      transporter: 'transporter_',
      wholesaler: 'wholesaler_',
      admin: 'admin_',
    },
  },

  // Behavior Configuration
  behavior: {
    // Random delay between user actions (milliseconds)
    actionDelayMin: 5000, // 5 seconds
    actionDelayMax: 30000, // 30 seconds

    // Random delay between user cycles (milliseconds)
    cycleDelayMin: 60000, // 1 minute
    cycleDelayMax: 300000, // 5 minutes

    // Probability of performing each action (0-1)
    probabilities: {
      shopkeeper: {
        checkInventory: 0.9,
        checkForecast: 0.7,
        createOrder: 0.3,
        checkOrderStatus: 0.8,
      },
      transporter: {
        checkShipments: 0.9,
        acceptShipment: 0.4,
        updateStatus: 0.6,
      },
      wholesaler: {
        reviewForecasts: 0.8,
        createBulkOrder: 0.3,
        updateInventory: 0.7,
      },
      admin: {
        checkHealth: 1.0,
        reviewUsers: 0.8,
        generateReports: 0.5,
      },
    },
  },

  // Test Data
  testData: {
    stores: ['STORE001', 'STORE002', 'STORE003', 'STORE004', 'STORE005'],
    skus: ['SKU001', 'SKU002', 'SKU003', 'SKU004', 'SKU005'],
    locations: ['DELHI', 'MUMBAI', 'BANGALORE', 'CHENNAI', 'KOLKATA'],
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableAuditLog: true,
    auditLogPath: './logs/simulation-audit.log',
  },

  // Retry Configuration
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
  },

  // Safety Limits
  limits: {
    maxOrdersPerCycle: 5,
    maxShipmentsPerCycle: 3,
    maxApiCallsPerCycle: 100,
  },
};
