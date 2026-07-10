/**
 * Unit tests for auth middleware.
 */
const { authenticate, authorize } = require('../../../api/middleware/auth');
const { generateToken, generateExpiredToken, mockReqResNext } = require('../helpers');

describe('Auth Middleware', () => {
  describe('authenticate', () => {
    it('should pass with valid token', () => {
      const token = generateToken();
      const { req, res, next } = mockReqResNext({
        headers: { authorization: `Bearer ${token}` },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.username).toBe('testuser');
    });

    it('should reject without Authorization header', () => {
      const { req, res, next } = mockReqResNext({ headers: {} });

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No token');
    });

    it('should reject without Bearer prefix', () => {
      const token = generateToken();
      const { req, res, next } = mockReqResNext({
        headers: { authorization: token },
      });

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it('should reject with invalid token', () => {
      const { req, res, next } = mockReqResNext({
        headers: { authorization: 'Bearer invalid.token.here' },
      });

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Invalid token');
    });

    it('should reject with expired token', () => {
      const token = generateExpiredToken();
      const { req, res, next } = mockReqResNext({
        headers: { authorization: `Bearer ${token}` },
      });

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it('should attach user to req', () => {
      const token = generateToken({ id: 42, username: 'alice', role: 'admin' });
      const { req, res, next } = mockReqResNext({
        headers: { authorization: `Bearer ${token}` },
      });

      authenticate(req, res, next);

      expect(req.user.id).toBe(42);
      expect(req.user.username).toBe('alice');
      expect(req.user.role).toBe('admin');
    });
  });

  describe('authorize', () => {
    it('should pass with correct role', () => {
      const token = generateToken({ id: 1, username: 'admin', role: 'admin' });
      const { req, res, next } = mockReqResNext({
        headers: { authorization: `Bearer ${token}` },
      });

      // First authenticate
      authenticate(req, res, jest.fn());
      // Then authorize
      const authMiddleware = authorize('admin');
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject with wrong role', () => {
      const token = generateToken({ id: 1, username: 'user', role: 'user' });
      const { req, res, next } = mockReqResNext({
        headers: { authorization: `Bearer ${token}` },
      });

      authenticate(req, res, jest.fn());
      const authMiddleware = authorize('admin');
      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('permissions');
    });

    it('should reject without user', () => {
      const { req, res, next } = mockReqResNext({});
      const authMiddleware = authorize('admin');

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it('should accept multiple roles', () => {
      const token = generateToken({ id: 1, username: 'editor', role: 'editor' });
      const { req, res, next } = mockReqResNext({
        headers: { authorization: `Bearer ${token}` },
      });

      authenticate(req, res, jest.fn());
      const authMiddleware = authorize('admin', 'editor', 'viewer');
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
