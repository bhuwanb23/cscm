const request = require('supertest');
const { app, isAiMlPath } = require('../../gateway/gateway');

describe('isAiMlPath()', () => {
  test('routes AI/ML domains to Python', () => {
    const aiDomains = ['demand', 'demand-planning', 'routing', 'supplier',
      'customer', 'anomaly', 'coordination', 'simulation', 'explain',
      'nlp', 'kg', 'causal', 'vision', 'learning', 'uncertainty', 'monitoring'];
    aiDomains.forEach(domain => {
      expect(isAiMlPath(`/api/v1/${domain}/forecast`)).toBe(true);
    });
  });

  test('routes inventory AI actions to Python', () => {
    const actions = ['optimize', 'recommendation', 'ss-policy',
      'stochastic-optimize', 'rl-train', 'mip-optimize', 'batch-optimize'];
    actions.forEach(action => {
      expect(isAiMlPath(`/api/v1/inventory/${action}`)).toBe(true);
    });
  });

  test('routes inventory CRUD to Node.js', () => {
    expect(isAiMlPath('/api/v1/inventory/STORE-001')).toBe(false);
    expect(isAiMlPath('/api/v1/inventory/STORE-001/PROD-001')).toBe(false);
    expect(isAiMlPath('/api/v1/inventory')).toBe(false);
  });

  test('routes Node.js CRUD domains to Node.js', () => {
    const crudDomains = ['auth', 'events', 'orders', 'shipments'];
    crudDomains.forEach(domain => {
      expect(isAiMlPath(`/api/v1/${domain}/anything`)).toBe(false);
    });
  });

  test('returns false for non-/api/v1 paths', () => {
    expect(isAiMlPath('/health')).toBe(false);
    expect(isAiMlPath('/')).toBe(false);
    expect(isAiMlPath('/api/v1')).toBe(false);
  });
});

describe('Gateway HTTP', () => {
  test('GET /health returns healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('api-gateway');
  });

  test('GET /health/python returns unreachable when Python is down', async () => {
    const res = await request(app).get('/health/python');
    expect(res.status).toBe(503);
    expect(res.body.service).toBe('ai-ml-python');
    expect(res.body.status).toBe('unreachable');
  });

  test('proxied Node.js route returns error when Express is down', async () => {
    const res = await request(app).get('/api/v1/auth/profile');
    expect(res.status).toBeGreaterThanOrEqual(502);
  });

  test('proxied AI/ML route returns error when Python is down', async () => {
    const res = await request(app).get('/api/v1/demand/forecast');
    expect(res.status).toBeGreaterThanOrEqual(502);
  });
});
