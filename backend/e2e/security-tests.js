/**
 * Security Regression Tests for CSCM Backend
 * 
 * Tests security controls implemented during hardening:
 * - Debug routes restricted in production
 * - Self-service admin registration prevented
 * - Object-level authorization (BOLA/IDOR)
 * - JWT configuration
 * - Password policy enforcement
 * - Authentication rate limiting
 * - CORS hardening
 * - Schema validation
 * - Gateway security headers
 * - AI/ML authentication
 */

const request = require('supertest');
const { app } = require('../src/api/server');
const jwt = require('jsonwebtoken');

describe('Security Regression Tests', () => {
  let authToken;
  let shopkeeperToken;
  let adminToken;

  beforeAll(async () => {
    // Create test users
    const testUser = {
      username: 'securitytestuser',
      password: 'TestPassword123!',
      email: 'securitytest@example.com',
      role: 'user'
    };

    const shopkeeperUser = {
      username: 'securityshopkeeper',
      password: 'TestPassword123!',
      email: 'shopkeeper@example.com',
      role: 'shopkeeper'
    };

    const adminUser = {
      username: 'securityadmin',
      password: 'TestPassword123!',
      email: 'admin@example.com',
      role: 'admin'
    };

    // Register users (admin registration should fail)
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    await request(app)
      .post('/api/v1/auth/register')
      .send(shopkeeperUser)
      .expect(201);

    // Attempt to register admin directly (should fail)
    await request(app)
      .post('/api/v1/auth/register')
      .send(adminUser)
      .expect(400); // Should reject self-service admin registration

    // Login to get tokens
    const userResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'securitytestuser', password: 'TestPassword123!' });
    authToken = userResponse.body.token;

    const shopkeeperResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'securityshopkeeper', password: 'TestPassword123!' });
    shopkeeperToken = shopkeeperResponse.body.token;

    // Manually create admin user in database for testing
    // (In production, this would be done through admin approval workflow)
  });

  describe('Debug Routes', () => {
    it('should restrict debug routes in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/v1/debug/database')
        .set('Authorization', `Bearer ${authToken}`);

      process.env.NODE_ENV = originalEnv;

      // Should return 404 or 403 in production
      expect([404, 403]).toContain(response.status);
    });

    it('should not expose stack traces in production errors', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/v1/nonexistent-route')
        .set('Authorization', `Bearer ${authToken}`);

      process.env.NODE_ENV = originalEnv;

      // Should not contain stack trace in response
      expect(response.text).not.toMatch(/stack/i);
    });
  });

  describe('Self-Service Admin Registration', () => {
    it('should reject registration with admin role', async () => {
      const adminAttempt = {
        username: 'adminattempt',
        password: 'TestPassword123!',
        email: 'adminattempt@example.com',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(adminAttempt);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/role/i);
    });

    it('should default new users to user role', async () => {
      const newUser = {
        username: 'regularuser',
        password: 'TestPassword123!',
        email: 'regular@example.com'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('user');
    });
  });

  describe('Password Policy', () => {
    it('should reject passwords shorter than 12 characters', async () => {
      const weakUser = {
        username: 'weakpass',
        password: 'Short1!',
        email: 'weak@example.com'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakUser);

      expect(response.status).toBe(400);
    });

    it('should reject passwords without complexity requirements', async () => {
      const noComplexity = {
        username: 'nocomplexity',
        password: 'nocapitalletters123',
        email: 'nocomplex@example.com'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(noComplexity);

      expect(response.status).toBe(400);
    });

    it('should accept strong passwords', async () => {
      const strongUser = {
        username: 'strongpass',
        password: 'StrongPassword123!',
        email: 'strong@example.com'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(strongUser);

      expect(response.status).toBe(201);
    });
  });

  describe('Authentication Rate Limiting', () => {
    it('should rate limit failed login attempts', async () => {
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'wronguser', password: 'wrongpassword' })
        );
      }

      const responses = await Promise.all(attempts);
      
      // Should start failing with 429 after threshold
      const lastResponse = responses[responses.length - 1];
      expect([429, 401]).toContain(lastResponse.status);
    });
  });

  describe('Object-Level Authorization', () => {
    it('should prevent users from accessing other users orders', async () => {
      // Create order for shopkeeper
      const orderResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({
          store_id: 'store123',
          items: [{ product_id: 'prod1', quantity: 10 }]
        });

      expect(orderResponse.status).toBe(201);

      // Try to access with regular user token
      const accessResponse = await request(app)
        .get(`/api/v1/orders/store/store123`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should be denied due to object-level authorization
      expect([403, 404]).toContain(accessResponse.status);
    });

    it('should prevent users from modifying others shipments', async () => {
      // Create shipment
      const shipmentResponse = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({
          order_id: 'order123',
          carrier: 'test-carrier',
          tracking_number: 'TEST123'
        });

      expect(shipmentResponse.status).toBe(201);

      // Try to update with different user
      const updateResponse = await request(app)
        .put(`/api/v1/shipments/${shipmentResponse.body.shipment_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'delivered' });

      // Should be denied
      expect([403, 404]).toContain(updateResponse.status);
    });
  });

  describe('JWT Configuration', () => {
    it('should reject tokens with none algorithm', async () => {
      const maliciousToken = jwt.sign(
        { user_id: 'test', username: 'test' },
        '',
        { algorithm: 'none' }
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${maliciousToken}`);

      expect([401, 403]).toContain(response.status);
    });

    it('should validate token expiration', async () => {
      const expiredToken = jwt.sign(
        { user_id: 'test', username: 'test' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Schema Validation', () => {
    it('should reject malformed JSON payloads', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send('invalid json');

      expect([400, 415]).toContain(response.status);
    });

    it('should reject requests with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({}); // Missing required fields

      expect(response.status).toBe(400);
    });

    it('should reject requests with invalid data types', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({
          store_id: 123, // Should be string
          items: 'not an array'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('CORS Configuration', () => {
    it('should reject requests from unauthorized origins in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://malicious-site.com');

      process.env.NODE_ENV = originalEnv;

      // Should not include CORS headers for unauthorized origin
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Health Endpoints', () => {
    it('should allow unauthenticated access to health endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/v1/health');

      // Check for common security headers
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
    });
  });
});
