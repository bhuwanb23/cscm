/**
 * Unit tests for auth controller.
 */
jest.mock('../../../storage/sqliteDatabase', () => ({
  createUser: jest.fn(),
  findUserByUsername: jest.fn(),
  findUserById: jest.fn(),
  initialize: jest.fn(),
  close: jest.fn(),
}));
jest.mock('../../../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));

const { register, login, getProfile } = require('../../../api/controllers/authController');
const sqliteDatabase = require('../../../storage/sqliteDatabase');

function mockRes() {
  const res = { statusCode: null, body: null, status(c) { this.statusCode = c; return this; }, json(d) { this.body = d; return this; } };
  return res;
}

describe('Auth Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register a new user', async () => {
      sqliteDatabase.findUserByUsername.mockResolvedValue(null);
      sqliteDatabase.createUser.mockResolvedValue(1);
      const req = { body: { username: 'newuser', email: 'new@example.com', password: 'pass123' } };
      const res = mockRes();

      await register(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('newuser');
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject missing fields', async () => {
      const req = { body: {} };
      const res = mockRes();
      await register(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('should reject duplicate username', async () => {
      sqliteDatabase.findUserByUsername.mockResolvedValue({ id: 1, username: 'existing' });
      const req = { body: { username: 'existing', email: 'e@e.com', password: 'p' } };
      const res = mockRes();
      await register(req, res);
      expect(res.statusCode).toBe(409);
    });

    it('should handle DB errors', async () => {
      sqliteDatabase.findUserByUsername.mockRejectedValue(new Error('DB error'));
      const req = { body: { username: 'u', email: 'e@e.com', password: 'p' } };
      const res = mockRes();
      await register(req, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('pass123', 10);
      sqliteDatabase.findUserByUsername.mockResolvedValue({
        id: 1, username: 'user', email: 'u@u.com', password: hashedPassword, role: 'user',
      });
      const req = { body: { username: 'user', password: 'pass123' } };
      const res = mockRes();
      await login(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject missing fields', async () => {
      const req = { body: {} };
      const res = mockRes();
      await login(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('should reject wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('correct', 10);
      sqliteDatabase.findUserByUsername.mockResolvedValue({ id: 1, username: 'user', password: hashedPassword });
      const req = { body: { username: 'user', password: 'wrong' } };
      const res = mockRes();
      await login(req, res);
      expect(res.statusCode).toBe(401);
    });

    it('should reject non-existent user', async () => {
      sqliteDatabase.findUserByUsername.mockResolvedValue(null);
      const req = { body: { username: 'nobody', password: 'pass' } };
      const res = mockRes();
      await login(req, res);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      sqliteDatabase.findUserById.mockResolvedValue({ id: 1, username: 'user', email: 'u@u.com', role: 'user' });
      const req = { user: { id: 1 } };
      const res = mockRes();
      await getProfile(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.username).toBe('user');
    });

    it('should return 404 for missing user', async () => {
      sqliteDatabase.findUserById.mockResolvedValue(null);
      const req = { user: { id: 999 } };
      const res = mockRes();
      await getProfile(req, res);
      expect(res.statusCode).toBe(404);
    });
  });
});
