/**
 * End-to-end integration tests for the JS -> HTTP -> Python -> Pydantic
 * contract covered by Phase A (schema fixes) and Phase B (new endpoints).
 *
 * These tests are SKIPPED unless the INTEGRATION_TEST env var is set to '1'.
 * The default `npm test` does not run them; use `npm run test:integration`.
 *
 * Why a separate suite:
 *  - Unit tests use mocked apiService (no real network)
 *  - Phase A & B used in-process TestClient (no uvicorn / port binding)
 *  - These tests exercise the full HTTP path with a real uvicorn process
 *    so port binding, middleware, JSON encoding, and Pydantic parsing are
 *    all covered.
 *
 * To run locally:
 *   # 1. Make sure the ai-ml venv is installed and the app imports cleanly
 *   # 2. From this directory:
 *   npm run test:integration
 *
 * The Python server is auto-spawned by scripts/start_python_server.js
 * inside globalSetup, and killed in globalTeardown.
 */

const http = require('http');
const path = require('path');

const INTEGRATION_ENABLED = process.env.INTEGRATION_TEST === '1';

// When the env var is missing we describe.skip the whole file so the
// normal `npm test` (which runs every test file) shows a clear "skipped"
// summary instead of "no tests found".
const dsl = INTEGRATION_ENABLED ? describe : describe.skip;

dsl('Python AI/ML API contract (integration)', () => {
  let serverHandle;
  let baseUrl;
  let port;
  let host;

  const post = (urlPath, body) => new Promise((resolve, reject) => {
    const data = body == null ? '' : JSON.stringify(body);
    const req = http.request({
      host, port, path: urlPath, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw, json: safeJson(raw) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });

  const get = (urlPath) => new Promise((resolve, reject) => {
    const req = http.request({ host, port, path: urlPath, method: 'GET' }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw, json: safeJson(raw) }));
    });
    req.on('error', reject);
    req.end();
  });

  const del = (urlPath) => new Promise((resolve, reject) => {
    const req = http.request({ host, port, path: urlPath, method: 'DELETE' }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw, json: safeJson(raw) }));
    });
    req.on('error', reject);
    req.end();
  });

  beforeAll(async () => {
    const { start } = require('../../../scripts/start_python_server');
    serverHandle = await start({
      log: (lvl, msg) => process.stderr.write(`[python-server][${lvl}] ${msg}\n`),
    });
    await serverHandle.ready;
    host = serverHandle.host;
    port = serverHandle.port;
    baseUrl = `http://${host}:${port}`;
  }, 180000);

  afterAll(async () => {
    if (serverHandle && serverHandle.proc.exitCode == null) {
      await serverHandle.kill('SIGTERM');
    }
  }, 30000);

  // ----- Phase A schema fixes -----

  describe('I6: POST /api/v1/inventory/batch-optimize', () => {
    it('accepts JS-shaped payload {skus: [...]} and returns expected keys', async () => {
      const res = await post('/api/v1/inventory/batch-optimize', {
        skus: ['SKU-001', 'SKU-002', 'SKU-003'],
      });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('results');
      expect(res.json).toHaveProperty('recommendations');
      expect(res.json).toHaveProperty('total_savings');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  describe('I3a: POST /api/v1/routing/edge/deploy', () => {
    it('accepts JS-shaped payload {model, target} and returns deployment info', async () => {
      const res = await post('/api/v1/routing/edge/deploy', {
        model: { name: 'eta-v1', version: '1.0' },
        target: 'edge',
      });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('deployment_id');
      expect(res.json).toHaveProperty('status');
      expect(res.json).toHaveProperty('endpoint_url');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  describe('I3b: POST /api/v1/supplier/calibrate', () => {
    it('accepts JS-shaped {assessments, ground_truth} and returns calibration info', async () => {
      const res = await post('/api/v1/supplier/calibrate', {
        assessments: [0.1, 0.5, 0.9, 0.3],
        ground_truth: [0, 1, 1, 0],
      });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('calibrated_scores');
      expect(res.json).toHaveProperty('calibration_error');
      expect(res.json).toHaveProperty('model_version');
    });

    it('accepts {action: "get_status"} and returns calibration status', async () => {
      const res = await post('/api/v1/supplier/calibrate', { action: 'get_status' });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('calibration_score');
      expect(res.json).toHaveProperty('threshold_adjustments');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  describe('I8: POST /api/v1/supplier/backup', () => {
    it('accepts {primary_supplier_id, requirements} and returns backup list', async () => {
      const res = await post('/api/v1/supplier/backup', {
        primary_supplier_id: 'SUP-001',
        requirements: {
          product_category: 'electronics',
          min_quality: 0.8,
          max_lead_time: 14,
          region: 'NA',
        },
      });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('backups');
      expect(res.json).toHaveProperty('total_candidates');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  describe('I2: POST /api/v1/supplier/risk-metrics', () => {
    it('accepts {range, supplier_id} and returns metrics over the window', async () => {
      const res = await post('/api/v1/supplier/risk-metrics', {
        range: '7d',
        supplier_id: 'SUP-1',
      });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('total_assessments');
      expect(res.json).toHaveProperty('avg_risk_score');
      expect(res.json).toHaveProperty('distribution');
      expect(res.json).toHaveProperty('trends');
      expect(res.json).toHaveProperty('time_range');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  describe('I7: POST /api/v1/uncertainty/safety-stock', () => {
    it('accepts {product_id, lead_time_days, service_level, demand_forecast}', async () => {
      const res = await post('/api/v1/uncertainty/safety-stock', {
        product_id: 'PROD-001',
        lead_time_days: 7,
        service_level: 0.95,
        demand_forecast: 150.0,
      });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('safety_stock');
      expect(res.json).toHaveProperty('reorder_point');
      expect(res.json).toHaveProperty('uncertainty_bounds');
      expect(res.json).toHaveProperty('confidence_level');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  describe('I10: POST /api/v1/learning/strategic-update', () => {
    it('accepts {model_state, new_data, learning_rate} and returns strategy', async () => {
      const res = await post('/api/v1/learning/strategic-update', {
        model_state: { model_id: 'M-1', learning_rate: 0.005, weights: [0.1, 0.2] },
        new_data: [{ x: 1, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
        learning_rate: 0.005,
      });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('model_id');
      expect(res.json).toHaveProperty('strategy');
      expect(res.json).toHaveProperty('metrics');
      expect(res.json).toHaveProperty('training_metrics');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  describe('I4: GET /api/v1/anomaly/alerts/{alert_id} (legacy GET)', () => {
    it('returns anomaly details for a known alert id', async () => {
      const res = await get('/api/v1/anomaly/alerts/A-001');
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('alert_id');
      expect(res.json).toHaveProperty('anomalies');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  describe('I1: POST /api/v1/monitoring/drift', () => {
    it('accepts {model_id, window} and returns drift detection result', async () => {
      const res = await post('/api/v1/monitoring/drift', {
        model_id: 'demand-forecaster',
        window: '24h',
      });
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('model_id');
      expect(res.json).toHaveProperty('drift_detected');
      expect(res.json).toHaveProperty('drift_score');
      expect(res.json).toHaveProperty('affected_features');
      expect(res.json).toHaveProperty('model_version');
    });
  });

  // ----- Phase B new endpoints -----

  describe('Phase B: GET /api/v1/anomaly/alerts (list)', () => {
    it('returns paginated list with default limit and offset', async () => {
      const res = await get('/api/v1/anomaly/alerts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.json.alerts)).toBe(true);
      expect(res.json.alerts.length).toBeGreaterThanOrEqual(1);
      expect(res.json).toHaveProperty('total');
      expect(res.json).toHaveProperty('limit');
      expect(res.json).toHaveProperty('offset');
      expect(res.json).toHaveProperty('filters');
      expect(res.json).toHaveProperty('model_version');
    });

    it('honors ?status=... filter', async () => {
      const res = await get('/api/v1/anomaly/alerts?status=acknowledged&limit=10');
      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty('filters');
      expect(res.json.filters).toHaveProperty('status', 'acknowledged');
      for (const a of res.json.alerts || []) {
        expect(a.status).toBe('acknowledged');
      }
    });

    it('honors ?limit=2&offset=1 pagination', async () => {
      const res = await get('/api/v1/anomaly/alerts?limit=2&offset=1');
      expect(res.status).toBe(200);
      expect(res.json.limit).toBe(2);
      expect(res.json.offset).toBe(1);
      expect(res.json.alerts.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Phase B: POST /api/v1/anomaly/alerts/{id}/acknowledge', () => {
    it('acknowledges a known alert with notes', async () => {
      const res = await post('/api/v1/anomaly/alerts/ALERT-001/acknowledge', {
        user_id: 'ops-team-42',
        notes: 'Investigating, supplier notified',
      });
      expect(res.status).toBe(200);
      expect(res.json.alert_id).toBe('ALERT-001');
      expect(res.json.acknowledged).toBe(true);
      expect(res.json.acknowledged_by).toBe('ops-team-42');
      expect(res.json).toHaveProperty('acknowledged_at');
      expect(res.json).toHaveProperty('model_version');
    });

    it('acknowledges without notes', async () => {
      const res = await post('/api/v1/anomaly/alerts/ALERT-099/acknowledge', {
        user_id: 'auto-system',
      });
      expect(res.status).toBe(200);
      expect(res.json.acknowledged).toBe(true);
      expect(res.json.acknowledged_by).toBe('auto-system');
    });
  });

  describe('Phase B: DELETE /api/v1/routing/edge/deploy/{id}', () => {
    it('removes a known deployment', async () => {
      const res = await del('/api/v1/routing/edge/deploy/DEP-001');
      expect(res.status).toBe(200);
      expect(res.json.deployment_id).toBe('DEP-001');
      expect(res.json.status).toBe('removed');
      expect(res.json).toHaveProperty('model_version');
    });

    it('removes a freshly-deployed model (round-trip)', async () => {
      const deploy = await post('/api/v1/routing/edge/deploy', {
        model: { name: 'eta-v2' },
        target: 'edge',
      });
      expect(deploy.status).toBe(200);
      const deploymentId = deploy.json.deployment_id;

      const undeploy = await del(`/api/v1/routing/edge/deploy/${deploymentId}`);
      expect(undeploy.status).toBe(200);
      expect(undeploy.json.deployment_id).toBe(deploymentId);
      expect(undeploy.json.status).toBe('removed');
    });
  });

  // ----- Negative tests: 422 from the Pydantic fail-loud path in BaseApiService -----

  describe('Pydantic 422 contract enforcement', () => {
    it('monitoring/drift rejects wrong-type model_id with 422', async () => {
      const res = await post('/api/v1/monitoring/drift', { model_id: 12345, window: '24h' });
      expect(res.status).toBe(422);
      expect(res.json).toHaveProperty('detail');
    });

    it('inventory/batch-optimize rejects wrong-type skus with 422', async () => {
      const res = await post('/api/v1/inventory/batch-optimize', { skus: 'SKU-001' });
      expect(res.status).toBe(422);
    });

    it('supplier/calibrate rejects wrong-type assessments with 422', async () => {
      const res = await post('/api/v1/supplier/calibrate', { assessments: 'not-a-list' });
      expect(res.status).toBe(422);
    });
  });
});

function safeJson(raw) {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { __raw__: raw }; }
}
