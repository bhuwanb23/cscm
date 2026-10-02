/**
 * Regression tests for the debug control plane's credential redaction.
 *
 * The admin table browser returned live bcrypt hashes verbatim. Because those
 * hashes are offline-crackable, any read-access leak on the dashboard became
 * full credential compromise rather than a mere information disclosure.
 *
 * These tests fail without the redaction in src/api/routes/debug.js.
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../../config');

// The route talks to whichever driver getDatabase() returns. Stub it with a
// fake that returns rows containing a realistic bcrypt hash.
const FAKE_HASH = '$2a$10$0a.yR8im0lIlk19rdkUkf.yYn6nS2OzH57kEwTvP.8OTv7uHHkvN2';

jest.mock('../../storage/database', () => ({
  getDatabase: () => ({
    pool: {
      connect: async () => ({
        query: async () => ({
          rows: [
            {
              id: 1,
              username: 'shopkeeper_001',
              email: 'shopkeeper_001@cscm-sim.local',
              password: '$2a$10$0a.yR8im0lIlk19rdkUkf.yYn6nS2OzH57kEwTvP.8OTv7uHHkvN2',
              role: 'shopkeeper',
            },
            {
              id: 2,
              username: 'admin001',
              email: 'admin001@cscm-sim.local',
              Password: '$2a$10$abcdefghijklmnopqrstuv',
              role: 'admin',
            },
          ],
        }),
        release: () => {},
      }),
    },
  }),
}));

const debugRouter = require('../../api/routes/debug');

function adminToken() {
  return jwt.sign(
    { id: 0, username: 'tester', role: 'admin' },
    config.auth.jwtSecret,
    {
      expiresIn: '1h',
      issuer: config.auth.jwtIssuer,
      audience: config.auth.jwtAudience,
      algorithm: config.auth.jwtAlgorithm,
    }
  );
}

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/debug', debugRouter);
  return app;
}

describe('debug control plane — credential redaction', () => {
  const app = makeApp();
  const header = `Bearer ${adminToken()}`;

  it('never returns password hashes from the raw table browser', async () => {
    const res = await request(app)
      .get('/api/v1/debug/database/tables/users/rows?limit=10')
      .set('Authorization', header)
      .expect(200);

    const serialized = JSON.stringify(res.body);

    expect(serialized).not.toContain(FAKE_HASH);
    expect(serialized).not.toContain('$2a$10$');
    expect(serialized).not.toContain('$2b$');
    // The column should still be present, just masked, so operators can see
    // that it exists.
    expect(res.body.data.rows[0]).toHaveProperty('password', '[redacted]');
  });

  it('redacts regardless of column-name casing', async () => {
    const res = await request(app)
      .get('/api/v1/debug/database/tables/users/rows')
      .set('Authorization', header)
      .expect(200);

    expect(res.body.data.rows[1].Password).toBe('[redacted]');
  });

  it('redacts hash columns returned by the read-only SQL console', async () => {
    const res = await request(app)
      .post('/api/v1/debug/database/query')
      .set('Authorization', header)
      .send({ sql: 'SELECT username, password FROM users' })
      .expect(200);

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('$2a$10$');
    expect(res.body.data.rows[0].password).toBe('[redacted]');
  });

  it('still requires an admin token', async () => {
    await request(app).get('/api/v1/debug/database/tables/users/rows').expect(401);
  });
});
