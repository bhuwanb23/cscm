const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../../storage/sqliteDatabase', () => {
  const users = {};
  return {
    createUser: jest.fn(async (user) => {
      const id = Object.keys(users).length + 1;
      users[user.username] = { id, ...user };
      return id;
    }),
    findUserByUsername: jest.fn(async (username) => {
      return users[username] || null;
    }),
    findUserById: jest.fn(async (id) => {
      const found = Object.values(users).find(u => u.id === id);
      return found || null;
    }),
    initialize: jest.fn(),
    close: jest.fn(),
    createTables: jest.fn(),
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
    updateShipmentStatus: jest.fn()
  };
});

const app = require('../../api/server');

describe('Auth API', () => {
  const testUser = { username: 'testuser', email: 'test@example.com', password: 'password123' };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate username', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('exists');
    });

    it('should require username, email, and password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'nobody', password: 'password123' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return profile with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testuser');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
