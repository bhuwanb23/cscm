/**
 * Integration tests for auth API - full request lifecycle.
 */
const request = require('supertest');

jest.mock('../../storage/sqliteDatabase', () => {
  const users = {};
  return {
    createUser: jest.fn(async (user) => {
      const id = Object.keys(users).length + 1;
      users[user.username] = { id, ...user };
      return id;
    }),
    findUserByUsername: jest.fn(async (username) => users[username] || null),
    findUserById: jest.fn(async (id) => Object.values(users).find(u => u.id === id) || null),
    initialize: jest.fn(),
    close: jest.fn(),
    upsertInventory: jest.fn(),
    getInventoryByStore: jest.fn(),
    createOrder: jest.fn(),
    addOrderItem: jest.fn(),
    getOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
    getOrdersByStore: jest.fn(),
    createShipment: jest.fn(),
    addShipmentItem: jest.fn(),
    getShipmentById: jest.fn(),
    getShipmentsByStatus: jest.fn(),
    getShipmentsByLocation: jest.fn(),
    updateShipmentStatus: jest.fn(),
  };
});

const app = require('../../api/server');

describe('Auth Integration', () => {
  const testUser = { username: 'inttest', email: 'int@test.com', password: 'pass123' };
  let token;

  it('should register, login, and get profile', async () => {
    // Register
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.token).toBeDefined();
    token = regRes.body.data.token;

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: testUser.username, password: testUser.password })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();

    // Get profile
    const profileRes = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileRes.body.data.user.username).toBe(testUser.username);
  });

  it('should reject profile without token', async () => {
    await request(app)
      .get('/api/v1/auth/profile')
      .expect(401);
  });

  it('should reject duplicate registration', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(409);
  });
});
