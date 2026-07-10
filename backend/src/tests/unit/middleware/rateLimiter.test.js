/**
 * Unit tests for rate limiter middleware.
 */
const { rateLimiter, securityHeaders } = require('../../../api/middleware/rateLimiter');
const { mockReqResNext } = require('../helpers');

describe('Rate Limiter Middleware', () => {
  describe('rateLimiter', () => {
    it('should allow requests within limit', () => {
      const { req, res, next } = mockReqResNext();

      rateLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.headers['X-RateLimit-Limit']).toBeDefined();
      expect(res.headers['X-RateLimit-Remaining']).toBeDefined();
    });

    it('should set rate limit headers', () => {
      const { req, res, next } = mockReqResNext();

      rateLimiter(req, res, next);

      expect(res.headers['X-RateLimit-Limit']).toBe(100);
      expect(typeof res.headers['X-RateLimit-Remaining']).toBe('number');
      expect(res.headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should block requests over limit', () => {
      const testIp = '10.0.0.99'; // Use unique IP to avoid interference

      // Exhaust the rate limit (default 100)
      for (let i = 0; i < 101; i++) {
        const testReq = { ip: testIp };
        const testRes = {
          statusCode: null,
          body: null,
          headers: {},
          status(code) { this.statusCode = code; return this; },
          json(data) { this.body = data; return this; },
          setHeader() { return this; },
        };
        rateLimiter(testReq, testRes, jest.fn());
      }

      // Next request should be blocked
      const blockReq = { ip: testIp };
      const blockRes = {
        statusCode: null,
        body: null,
        headers: {},
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
        setHeader() { return this; },
      };
      rateLimiter(blockReq, blockRes, jest.fn());

      expect(blockRes.statusCode).toBe(429);
      expect(blockRes.body.error).toContain('Too many');
    });
  });

  describe('securityHeaders', () => {
    it('should set security headers', () => {
      const { req, res, next } = mockReqResNext();

      securityHeaders(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(res.headers['X-Frame-Options']).toBe('DENY');
      expect(res.headers['X-DNS-Prefetch-Control']).toBe('off');
    });
  });
});
