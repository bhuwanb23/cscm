const request = require('supertest');
const bcrypt = require('bcryptjs');

// Reset the auth rate limiter state between test cases — the limiter allows
// only 5 auth requests per 15-minute window per IP, which this file exceeds.
jest.mock('../../api/middleware/authRateLimiter', () => {
  const actual = jest.requireActual('../../api/middleware/authRateLimiter');
  return { ...actual, authRateLimiter: (req, res, next) => next() };
});

jest.mock('../../storage/sqliteDatabase', () => {
  const users = {};
  const createTables = jest.fn();
  const createIndexes = jest.fn();
  class SQLiteDatabase {
    constructor() {
      this.db = { run: jest.fn(), all: jest.fn(), get: jest.fn() };
      this.createTables = createTables;
      this.createIndexes = createIndexes;
      this.createUser = jest.fn(async (user) => {
        const id = Object.keys(users).length + 1;
        users[user.username] = { id, ...user };
        return id;
      });
      this.findUserByUsername = jest.fn(async (username) => users[username] || null);
      this.findUserById = jest.fn(async (id) => {
        const found = Object.values(users).find((u) => u.id === id);
        return found || null;
      });
      this.upsertInventory = jest.fn();
      this.getInventoryByStore = jest.fn();
      this.createOrder = jest.fn();
      this.addOrderItem = jest.fn();
      this.getOrderById = jest.fn();
      this.updateOrderStatus = jest.fn();
      this.getOrdersByStore = jest.fn();
      this.createShipment = jest.fn();
      this.addShipmentItem = jest.fn();
      this.getShipmentById = jest.fn();
      this.getShipmentsByStatus = jest.fn();
      this.getShipmentsByLocation = jest.fn();
      this.updateShipmentStatus = jest.fn();
    }
    async initialize() {}
    async close() {}
  }
  const instance = new SQLiteDatabase();
  instance.SQLiteDatabase = SQLiteDatabase;
  return instance;
});

const app = require('../../api/server');

describe('Auth API', () => {
  const testUser = { username: 'testuser', email: 'test@example.com', password: 'Sup3rSecure!Passphrase' };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate username', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser).expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('exists');
    });

    it('should require username, email, and password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({}).expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser', password: 'Sup3rSecure!Passphrase' })
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
        .send({ username: 'testuser', password: 'Sup3rSecure!Passphrase' });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testuser');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/v1/auth/profile').expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
