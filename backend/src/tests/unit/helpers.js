/**
 * Shared test helpers for backend unit tests.
 */
const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * Generate a valid JWT auth token.
 */
function generateToken(payload = { id: 1, username: 'testuser', role: 'user' }) {
  return jwt.sign(payload, config.auth.jwtSecret, { expiresIn: '1h' });
}

/**
 * Generate an expired JWT token.
 */
function generateExpiredToken(payload = { id: 1, username: 'testuser', role: 'user' }) {
  return jwt.sign(payload, config.auth.jwtSecret, { expiresIn: '0s' });
}

/**
 * Create a mock Express req/res/next.
 */
function mockReqResNext(overrides = {}) {
  const req = {
    headers: {},
    body: {},
    params: {},
    query: {},
    ip: '127.0.0.1',
    ...overrides,
  };
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    setHeader(key, val) { this.headers[key] = val; return this; },
    removeHeader() { return this; },
    end(data) { this.body = data; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

/**
 * Create a mock SQLite database.
 */
function createMockDb(overrides = {}) {
  return {
    initialize: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue(),
    createTables: jest.fn().mockResolvedValue(),
    // User
    createUser: jest.fn().mockResolvedValue(1),
    findUserByUsername: jest.fn().mockResolvedValue(null),
    findUserById: jest.fn().mockResolvedValue(null),
    // Inventory
    upsertInventory: jest.fn().mockResolvedValue(1),
    getInventoryByStore: jest.fn().mockResolvedValue([]),
    // Orders
    createOrder: jest.fn().mockResolvedValue(1),
    addOrderItem: jest.fn().mockResolvedValue(1),
    getOrderById: jest.fn().mockResolvedValue(null),
    updateOrderStatus: jest.fn().mockResolvedValue(1),
    getOrdersByStore: jest.fn().mockResolvedValue([]),
    // Shipments
    createShipment: jest.fn().mockResolvedValue(1),
    addShipmentItem: jest.fn().mockResolvedValue(1),
    getShipmentById: jest.fn().mockResolvedValue(null),
    getShipmentsByStatus: jest.fn().mockResolvedValue([]),
    getShipmentsByLocation: jest.fn().mockResolvedValue([]),
    updateShipmentStatus: jest.fn().mockResolvedValue(1),
    ...overrides,
  };
}

module.exports = {
  generateToken,
  generateExpiredToken,
  mockReqResNext,
  createMockDb,
};
