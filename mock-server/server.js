const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');
const config = require('./config');

const app = express();
const PORT = config.port || 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data storage
const mockData = {
  users: [],
  inventory: [],
  orders: [],
  shipments: [],
  events: []
};

// Initialize mock data
function initializeMockData() {
  // Generate mock users
  for (let i = 0; i < 20; i++) {
    mockData.users.push({
      id: faker.datatype.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['shopkeeper', 'transporter', 'wholesaler']),
      storeId: faker.datatype.uuid(),
      createdAt: faker.date.past().toISOString()
    });
  }

  // Generate mock inventory
  for (let i = 0; i < 50; i++) {
    mockData.inventory.push({
      id: faker.datatype.uuid(),
      productId: faker.datatype.uuid(),
      productName: faker.commerce.productName(),
      quantity: faker.number.int({ min: 0, max: 1000 }),
      storeId: faker.datatype.uuid(),
      lastUpdated: faker.date.recent().toISOString()
    });
  }

  // Generate mock orders
  for (let i = 0; i < 30; i++) {
    mockData.orders.push({
      id: faker.datatype.uuid(),
      customerId: faker.datatype.uuid(),
      items: faker.number.int({ min: 1, max: 10 }),
      totalAmount: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
      createdAt: faker.date.recent().toISOString()
    });
  }

  // Generate mock shipments
  for (let i = 0; i < 25; i++) {
    mockData.shipments.push({
      id: faker.datatype.uuid(),
      orderId: faker.datatype.uuid(),
      origin: faker.location.city(),
      destination: faker.location.city(),
      status: faker.helpers.arrayElement(['in_transit', 'delivered', 'delayed']),
      estimatedDelivery: faker.date.future().toISOString()
    });
  }

  // Generate mock events
  for (let i = 0; i < 40; i++) {
    mockData.events.push({
      id: faker.datatype.uuid(),
      type: faker.helpers.arrayElement(['inventory', 'shipment', 'order', 'alert']),
      description: faker.lorem.sentence(),
      severity: faker.helpers.arrayElement(['info', 'warning', 'error']),
      timestamp: faker.date.recent().toISOString()
    });
  }

  console.log('Mock data initialized');
}

// Helper function to add delay
function addDelay(min = 100, max = 500) {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

// Mock API endpoints
app.get('/api/v1/auth/users', async (req, res) => {
  await addDelay();
  res.json({
    success: true,
    data: mockData.users
  });
});

app.get('/api/v1/inventory', async (req, res) => {
  await addDelay();
  res.json({
    success: true,
    data: mockData.inventory
  });
});

app.get('/api/v1/orders', async (req, res) => {
  await addDelay();
  res.json({
    success: true,
    data: mockData.orders
  });
});

app.get('/api/v1/shipments', async (req, res) => {
  await addDelay();
  res.json({
    success: true,
    data: mockData.shipments
  });
});

app.get('/api/v1/events', async (req, res) => {
  await addDelay();
  res.json({
    success: true,
    data: mockData.events
  });
});

// Error simulation endpoint
app.get('/api/v1/error/:type', async (req, res) => {
  const { type } = req.params;
  
  await addDelay();
  
  switch (type) {
    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 10000));
      break;
    case 'server_error':
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
      return;
    case 'not_found':
      res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
      return;
    default:
      res.status(400).json({
        success: false,
        error: 'Bad request'
      });
      return;
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CSCM Mock Server',
    timestamp: new Date().toISOString()
  });
});

// Config endpoint
app.get('/config', (req, res) => {
  res.json({
    ...config,
    mockDataCount: {
      users: mockData.users.length,
      inventory: mockData.inventory.length,
      orders: mockData.orders.length,
      shipments: mockData.shipments.length,
      events: mockData.events.length
    }
  });
});

// Reset mock data
app.post('/reset', (req, res) => {
  mockData.users = [];
  mockData.inventory = [];
  mockData.orders = [];
  mockData.shipments = [];
  mockData.events = [];
  
  initializeMockData();
  
  res.json({
    success: true,
    message: 'Mock data reset successfully'
  });
});

// Start server
initializeMockData();

app.listen(PORT, () => {
  console.log(`CSCM Mock Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Config: http://localhost:${PORT}/config`);
});
