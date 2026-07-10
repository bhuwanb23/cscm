/**
 * Unit tests for error handler middleware.
 */
const { errorHandler, notFound } = require('../../../api/middleware/errorHandler');
const { mockReqResNext } = require('../helpers');

describe('Error Handler Middleware', () => {
  describe('errorHandler', () => {
    it('should return 500 for generic errors', () => {
      const { req, res, next } = mockReqResNext();
      const error = new Error('Something went wrong');

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Something went wrong');
    });

    it('should use error.statusCode if set', () => {
      const { req, res, next } = mockReqResNext();
      const error = new Error('Not Found');
      error.statusCode = 404;

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(404);
    });

    it('should include stack in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { req, res, next } = mockReqResNext();
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(res.body.error.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { req, res, next } = mockReqResNext();
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(res.body.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFound', () => {
    it('should create 404 error and call next', () => {
      const { req, res, next } = mockReqResNext();
      req.originalUrl = '/api/v1/unknown';

      notFound(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('/api/v1/unknown');
    });
  });
});
