# Node.js Backend + AI/ML Integration — Issues & Plan

> **Generated:** 2026-06-05
> **Scope:** Real integration between `backend/` (Node.js) and `ai-ml/api/` (Python)
> **Decision (locked):** JS sub-agents are the source of truth. Pydantic schemas are made
> permissive (optional/alias fields) to accept the JS payload shapes. Integration tests
> run against a real `uvicorn` server in CI.
> **Time budget:** ~4 hours
> **Out of scope (deferred):** 8 pre-existing broken sub-agents with same class of bug;
> behavioral tests for 7 parent agents; Tier 3 cleanup.

---

## 1. Context

The `cscm` workspace has a Node.js backend (`backend/`) that proxies to a Python AI/ML
service (`ai-ml/api/`). Phase 1–5 of the cleanup (commits `3ba609c`..`0e43011`) added:

- 31 sub-agents across 7 parent agents (Store, Warehouse, Transport, Supplier, Central
  Planner, Customer Demand, Simulation)
- 18 sub-agent test suites (218 tests, all passing — but **all use mocked `apiService`**)
- 4 Pydantic schemas rewrites for previously-stub models
- 3 broken Python route paths fixed
- 21 pytest tests passing for the 4 implemented models

A post-Phase-5 audit revealed that **the unit tests all pass because `BaseApiService.call()`
catches every error (including Pydantic 422) and returns the fallback silently**. Real
round-trips between the JS sub-agents and the Python routers will fail at runtime.

This document captures the 10 specific integration gaps, the plan to close them, and the
verification steps.

---

## 2. Integration Issues (10 confirmed)

All confirmed by spot-checking the source files (citations are `file:line`).

### I1. **DriftDetector** — wrong HTTP verb + missing required body fields

- **JS call** — `backend/src/agents/central-planner/services/apiService.js:79-82`:
  ```js
  async driftCheck(params) {
    const qs = new URLSearchParams(params).toString();
    return this.call('get', `/api/v1/monitoring/drift?${qs}`, ...);
  }
  ```
- **Sub-agent payload** — `DriftDetector.js:23-26`:
  ```js
  this.apiService.driftCheck({ model_id, window: timeWindow });
  ```
- **Python route** — `ai-ml/api/routers/model_monitoring.py:484`:
  ```python
  @router.post("/drift", response_model=DriftDetectionResponse)
  ```
- **Pydantic requires** — `model_monitoring.py:104-108`: `model_id: str`,
  `reference_data: List[dict]`, `current_data: List[dict]`.
- **Failure mode:** Python returns 404 (route is POST, JS sends GET) **and** 422
  (body missing `reference_data`, `current_data`).
- **Severity:** P0 — 1 of 13 new sub-agents.

### I2. **RiskMetricsAnalyzer** — wrong HTTP verb + missing required body fields

- **JS call** — `backend/src/agents/supplier/services/apiService.js:99-102`:
  ```js
  async supplierRiskMetrics(params) {
    const query = new URLSearchParams(params || {}).toString();
    return this.call('get', `/api/v1/supplier/risk-metrics?${query}`, ...);
  }
  ```
- **Sub-agent payload** — `RiskMetricsAnalyzer.js:13, 26-29`:
  ```js
  this.apiService.supplierRiskMetrics({ range: timeRange });
  this.apiService.supplierRiskMetrics({ range, supplier_id });
  ```
- **Python route** — `ai-ml/api/routers/supplier_risk.py:581`:
  ```python
  @router.post("/risk-metrics", response_model=SupplierRiskMetricsResponse)
  ```
- **Pydantic requires** — `supplier_risk.py:216-219`: `supplier_id: str`,
  `predictions: List[float]`, `actuals: List[float]`.
- **Failure mode:** 404 (verb mismatch) + 422 (missing fields). JS then destructures
  `result.total_assessments`, `result.avg_risk_score` which the Python response
  doesn't return.
- **Severity:** P0.

### I3. **EdgeDeployer.undeploy** — same path as deploy, no real undeploy

- **JS call** — `backend/src/agents/transport/services/apiService.js:53-59`:
  ```js
  async edgeDeploy(data)   { return this.call('post', '/api/v1/routing/edge/deploy', data, ...); }
  async edgeUndeploy(data) { return this.call('post', '/api/v1/routing/edge/deploy', data, ...); }
  ```
- **Sub-agent payload** — `EdgeDeployer.js:35`:
  ```js
  const data = { deployment_id: deploymentId, action: 'undeploy' };
  ```
- **Python route** — `ai-ml/api/routers/routing_logistics.py:476`: only one route
  (`POST /edge/deploy`). The `action: 'undeploy'` field is ignored; the deployment
  is **created** on every "undeploy" call.
- **Failure mode:** Side-effect bug — undeploying actually deploys a new model.
  Wrong `deployment_id` is returned, so the agent thinks the undeploy succeeded
  but a phantom deployment is now active.
- **Severity:** P0 — silent, dangerous.

### I4. **AnomalyAlerter.listActiveAlerts** — endpoint does not exist

- **JS call** — `AnomalyAlerter.js:30-36`:
  ```js
  this.apiService.call('get', `/api/v1/anomaly/alerts?${qs}`, ...);
  ```
- **Python route** — `anomaly_detection.py:259`: only `GET /alerts/{alert_id}` (single).
  No list endpoint exists.
- **Failure mode:** 404. Returns empty fallback, so the Central Planner never sees
  active alerts and cannot respond to incidents.
- **Severity:** P0.

### I5. **AnomalyAlerter.acknowledgeAlert** — endpoint does not exist

- **JS call** — `AnomalyAlerter.js:69-72`:
  ```js
  this.apiService.call('post', `/api/v1/anomaly/alerts/${alertId}/acknowledge`, { user_id }, ...);
  ```
- **Python route** — not present anywhere in `anomaly_detection.py`.
- **Failure mode:** 404. Alert is never acknowledged, so it will fire repeatedly.
- **Severity:** P0.

### I6. **BatchOptimizer** — wrong field names

- **JS payload** — `BatchOptimizer.js:17, 40`:
  ```js
  const data = { skus };          // or: { pairs: skuStorePairs };
  ```
- **Pydantic requires** — `inventory_optimization.py:228-231`:
  ```python
  class BatchOptimizeRequest(BaseModel):
      sku_ids: List[str]          # ← JS sends `skus`
      store_id: str               # ← not sent by JS
      frequency: str = "daily"
  ```
- **Failure mode:** 422. The `pairs` variant is also unsupported (would need a new
  `pairs: List[dict]` field on the schema).
- **Severity:** P0.

### I7. **UncertaintyQuantifier** — wrong field names

- **JS payload** — `UncertaintyQuantifier.js:14-19`:
  ```js
  const data = {
    product_id, lead_time_days, service_level, demand_forecast
  };
  ```
- **Pydantic requires** — `uncertainty_quantification.py:518-524`:
  ```python
  class SafetyStockRequest(BaseModel):
      model_id: str                # ← JS sends `product_id`
      lead_time_days: int
      avg_daily_demand: float      # ← JS sends `demand_forecast`
      service_level: float
  ```
- **JS reads** — `result.uncertainty_bounds`, `result.confidence_level` —
  response doesn't have these.
- **Severity:** P0.

### I8. **SupplierCalibrator** — wrong field names + missing `supplier_id`

- **JS payload** — `SupplierCalibrator.js:12-15`:
  ```js
  const data = {
    assessments: historicalAssessments,
    ground_truth: groundTruth
  };
  ```
- **Pydantic requires** — `supplier_risk.py:230-234`:
  ```python
  class SupplierCalibrateRequest(BaseModel):
      supplier_id: str            # ← not sent by JS
      predictions: List[float]    # ← JS sends `assessments`
      actuals: List[float]        # ← JS sends `ground_truth`
      method: str = "isotonic"
  ```
- **JS reads** — `result.calibration_score` — response has `calibration_error`, not
  `calibration_score`.
- **Severity:** P0.

### I9. **BackupSupplierFinder** — wrong field names + nested object unsupported

- **JS payload** — `BackupSupplierFinder.js:12-20`:
  ```js
  const data = {
    primary_supplier_id: primarySupplierId,
    requirements: {
      product_category, min_quality, max_lead_time, region
    }
  };
  ```
- **Pydantic requires** — `supplier_risk.py:243-246`:
  ```python
  class BackupSupplierRequest(BaseModel):
      supplier_id: str            # ← JS sends `primary_supplier_id`
      min_reliability: float = 0.7
      max_distance_km: float = 1000.0
  ```
- **JS reads** — `result.backups` (exists), `result.total_candidates` (does not exist).
- **Severity:** P0.

### I10. **ContinualLearner** — wrong field names

- **JS payload** — `ContinualLearner.js:17-21`:
  ```js
  const payload = {
    model_state,          // dict containing {model_id, learning_rate, ...}
    new_data,             // List[dict]
    learning_rate
  };
  ```
- **Pydantic requires** — `continual_learning.py:114-120`:
  ```python
  class StrategicUpdateRequest(BaseModel):
      model_id: str              # ← not in JS payload
      strategy: str              # ← not in JS payload
      learning_rate: float
      X_batch: List[List[float]]
      y_batch: List[float]
  ```
- **JS reads** — `result.training_metrics` (not in response), `result.updated_at` (not in
  response).
- **Severity:** P0.

### Sub-agents that **work** (no changes needed)

| Sub-agent | Why it works |
|---|---|
| `RouteTracker` | `GET /api/v1/routing/status/{id}` exists; `RoutingStatusResponse` is permissive |
| `VisionInspector` | `POST /api/v1/vision/analyze` exists; `VisionAnalysisRequest` is permissive |
| `NLPSummarizer` | `POST /api/v1/nlp/sentiment` exists; `SentimentRequest` only requires `text` |
| `AnomalyAlerter.getAlert` | `GET /api/v1/anomaly/alerts/{id}` exists |
| `KnowledgeGraphQuerier` | `POST /api/v1/kg/query` exists; `KGQueryRequest` only requires `query` |

---

## 3. Plan (locked)

**4 phases, ~4 hours total, no scope creep.**

### Phase A — Pydantic schema fixes (Python, source-of-truth changes)

Add optional/alias fields to 9 Pydantic models so they accept the JS payloads. All
additions are **backward compatible** (existing strict callers still work; JS callers
that send extra fields now pass).

| File | Schema | Changes |
|---|---|---|
| `inventory_optimization.py:228-236` | `BatchOptimizeRequest` / `Response` | add `skus: Optional[List[str]]`, `pairs: Optional[List[dict]]`; response: add `total_savings: float = 0`, `model_version` default |
| `routing_logistics.py:198-202` | `EdgeDeployRequest` / `Response` | add `model: Optional[dict]`, `target: Optional[str]`, `action: Optional[str]`, `deployment_id: Optional[str]`; response: add `endpoint_url: Optional[str]` |
| `supplier_risk.py:230-241` | `SupplierCalibrateRequest` / `Response` | add `supplier_id: Optional[str] = "default"`, `assessments: Optional[List[float]]` (alias for `predictions`), `ground_truth: Optional[List[float]]` (alias for `actuals`); response: add `calibration_score: Optional[float] = 0.5` |
| `supplier_risk.py:243-252` | `BackupSupplierRequest` / `Response` | add `primary_supplier_id: Optional[str]`, `requirements: Optional[dict]` (ignored), `product_category: Optional[str]`, `min_quality: Optional[float]`, `max_lead_time: Optional[float]`, `region: Optional[str]`; response: add `total_candidates: int = 0` |
| `supplier_risk.py:216-228` | `SupplierRiskMetricsRequest` / `Response` | add `range: Optional[str] = "30d"`, `predictions: Optional[List[float]] = []`, `actuals: Optional[List[float]] = []`; response: add `total_assessments: int = 0`, `avg_risk_score: float = 0`, `distribution: dict = {}`, `trends: List[dict] = []` |
| `uncertainty_quantification.py:518-524` | `SafetyStockRequest` / `Response` | add `product_id: Optional[str]` (alias for `model_id`), `demand_forecast: Optional[float]` (alias for `avg_daily_demand`); response: add `uncertainty_bounds: dict = {}`, `confidence_level: float = 0` |
| `continual_learning.py:114-120` | `StrategicUpdateRequest` / `Response` | add `model_state: Optional[dict]`, `new_data: Optional[List[dict]]`, `strategy: str = "incremental"`, `model_id: Optional[str] = None` (extract from `model_state` if missing), `X_batch: Optional[List[List[float]]] = []`, `y_batch: Optional[List[float]] = []`; response: add `updated_at: str = ""`, `training_metrics: dict = {}` |
| `anomaly_detection.py:117-127` | `AnomalyAlertsRequest` / `Response` | add `status: Optional[str] = None`, `limit: int = 100`, `offset: int = 0` |
| `model_monitoring.py:104-115` | `DriftDetectionRequest` / `Response` | make `reference_data: List[dict] = []`, `current_data: List[dict] = []`; add `window: Optional[str] = "24h"`; response: add `affected_features: List[str] = []` (alias for `drifted_features`) |

**Estimated time:** 1.5 hours.

### Phase B — New Python endpoints (3 routes)

1. **`anomaly_detection.py`** — add `GET /alerts?status=&limit=&offset=` returning
   `AnomalyAlertsListResponse` (`{ alerts: [...], total: int, model_version: str,
   filters: dict }`).
2. **`anomaly_detection.py`** — add `POST /alerts/{alert_id}/acknowledge` accepting
   `AnomalyAlertAckRequest` (`{ user_id: str }`) and returning
   `AnomalyAlertAckResponse` (`{ alert_id, acknowledged: True, acknowledged_by,
   acknowledged_at, model_version }`).
3. **`routing_logistics.py`** — add `DELETE /edge/deploy/{deployment_id}` returning
   `EdgeUndeployResponse` (`{ deployment_id, status: "removed", model_version }`).

**Estimated time:** 30 minutes.

### Phase C — JS apiService HTTP verb fixes (3 sites + 1 fix)

| File | Change |
|---|---|
| `backend/src/agents/central-planner/services/apiService.js:79-82` | `driftCheck(params)` → `driftCheck(data)` using POST `/api/v1/monitoring/drift` |
| `backend/src/agents/central-planner/sub-agents/DriftDetector.js:23-26` | pass body to `driftCheck(...)` (not query params) |
| `backend/src/agents/supplier/services/apiService.js:99-102` | `supplierRiskMetrics(params)` → `supplierRiskMetrics(data)` using POST `/api/v1/supplier/risk-metrics` |
| `backend/src/agents/supplier/sub-agents/RiskMetricsAnalyzer.js:13, 26-29` | pass body (not query params) |
| `backend/src/agents/transport/services/apiService.js:53-59` | replace second POST `edgeUndeploy` with DELETE `/api/v1/routing/edge/deploy/{deployment_id}` |
| `backend/src/agents/transport/sub-agents/EdgeDeployer.js:35-47` | pass `deploymentId` (not data object) to `edgeUndeploy` |

**Estimated time:** 20 minutes.

### Phase D — Integration test harness + CI (4 new files + 2 edits)

**New files:**

1. **`backend/scripts/start_python_server.js`** — spawns
   `ai-ml/venv/Scripts/python.exe -m uvicorn api.main:app --port 8000` (or `.venv/`
   fallback), waits for `/health` to return 200, returns `{ pid, baseUrl, kill() }`.

2. **`backend/src/tests/integration/pythonApi.integration.test.js`** — 31 tests,
   one per `apiService` method across the 7 services:
   - Each test constructs the **exact** JS payload a real sub-agent would send.
   - Each test calls the apiService method against `process.env.AI_ML_BASE_URL`.
   - Asserts response status < 400 **and** no Pydantic 422.
   - All tests wrapped in `(process.env.INTEGRATION_TEST === '1' ? describe : describe.skip)`.

3. **`backend/integration-report.json`** — auto-generated report (one row per endpoint
   with `pass`/`fail`/Pydantic-422 body).

4. **`.github/workflows/integration-tests.yml`** — CI workflow:
   - `actions/checkout@v4`
   - `actions/setup-python@v5` (Python 3.11)
   - `actions/setup-node@v4` (Node 18)
   - `python -m venv ai-ml/.venv && pip install -r ai-ml/requirements.txt`
   - `npm ci` in `backend/`
   - Spawn uvicorn in background, wait for `/health`
   - `npm run test:integration` in `backend/`
   - Kill uvicorn, upload `integration-report.json` as artifact

**Edited files:**

5. **`backend/package.json`** — add `"test:integration": "cross-env INTEGRATION_TEST=1 jest --testPathPattern=integration"`
   (install `cross-env` as dev dep).

6. **`backend/src/services/BaseApiService.js`** — in `call()`, when response is 422,
   log `error` with `[BaseApiService] 422 on ${method} ${path} — likely Pydantic
   schema mismatch. Body excerpt: ...`. Continue to return fallback (don't break
   behavior) but make the failure visible in CI logs.

7. **`backend/README.md`** — add a "Integration Tests" section:
   ```bash
   # Local (requires ai-ml/venv with deps)
   cd ai-ml && python -m venv .venv && .venv/Scripts/activate && pip install -r requirements.txt
   cd ../backend && npm run test:integration
   ```

**Estimated time:** 1 hour.

---

## 4. Verification (must all pass)

| # | Command | Expected |
|---|---|---|
| 1 | `cd backend && npm test` | 621 unit tests pass (unchanged) |
| 2 | `cd backend && npm run test:integration` | 31 integration tests pass (new) |
| 3 | `cd ai-ml/api && ../../venv/Scripts/python.exe -m pytest tests/` | 21 pytest tests pass (unchanged) |
| 4 | Manual: start uvicorn + `npm start` in `backend/`, then `curl -X POST http://localhost:3000/api/v1/monitoring/drift -H "Content-Type: application/json" -d '{"model_id":"demand-forecaster"}'` | Returns 200 with Pydantic `DriftDetectionResponse` body |
| 5 | Manual: `curl -X POST http://localhost:3000/api/v1/anomaly/alerts/ALERT-001/acknowledge -H "Content-Type: application/json" -d '{"user_id":"u-1"}'` | Returns 200, alert acknowledged |

---

## 5. Commit Plan

Each phase is one or more commits. Both `cscm` and `ai-ml` repos are pushed to the
same `origin` (`bhuwanb23/cscm` on GitHub), so commits that touch Python files
happen in `ai-ml/` and commits that touch JS files happen in `cscm/`.

| Phase | Repo | Commit message |
|---|---|---|
| A. Pydantic schemas | `ai-ml/` | `fix: make 9 Pydantic schemas permissive to accept JS sub-agent payloads` |
| B. New endpoints | `ai-ml/` | `feat: add /anomaly/alerts list, acknowledge, /routing/edge/deploy/{id} DELETE` |
| C. JS apiService verbs | `cscm/backend/` | `fix: convert 3 apiService methods from GET+qs to POST+body; add DELETE for undeploy` |
| D-1. uvicorn spawner | `cscm/backend/` | `feat: add scripts/start_python_server.js for integration test harness` |
| D-2. integration tests | `cscm/backend/` | `test: add 31 integration tests hitting real Python service (opt-in via INTEGRATION_TEST=1)` |
| D-3. fail-loud 422 | `cscm/backend/` | `feat: BaseApiService logs error on 422 to surface schema drift in CI` |
| D-4. CI workflow | `cscm/.github/` | `ci: add integration-tests workflow that boots uvicorn and runs npm run test:integration` |
| D-5. README + scripts | `cscm/backend/` | `docs: add Integration Tests section to README` |

**Total:** ~8 commits across 2 repos, push after each phase.

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Optional fields weaken Pydantic validation | Add `Field(...)` custom validators where business-critical (e.g., `min_reliability` if used downstream). Default values make the schema lenient, not invalid. |
| Integration tests are slow (5–10 s uvicorn startup) | Run only in CI by default, opt-in locally with `INTEGRATION_TEST=1`. CI caches the venv install. |
| uvicorn hangs on teardown | `child.kill('SIGKILL')` after tests, with 5 s timeout. CI step uses `if: always()` to ensure teardown runs. |
| Other (non-JS) callers depend on the current strict schema | Making fields `Optional` with defaults is **backward compatible** — strict callers still pass the required field; lenient callers get a default. No breaking changes. |
| venv at `ai-ml/venv` may not exist in CI | CI creates `ai-ml/.venv` fresh via `python -m venv .venv && pip install -r requirements.txt`. Local devs use the existing `ai-ml/venv`. |
| `_getFallback` keys in JS apiServices become stale | Phase C does not touch `_getFallback` — the keys match the new POST paths. No changes needed. |
| Existing 8 pre-existing broken sub-agents | **Explicitly out of scope** — they have the same class of bug (e.g., `InventoryOptimizer` sends `product_id` but Python wants `sku_id`). Defer to follow-up. |

---

## 7. Out of Scope (explicit, per earlier agreement)

1. **8 pre-existing broken sub-agents** with the same class of body-shape bug:
   `InventoryOptimizer`, `DemandForecaster`, `EventGenerator`, `RouteOptimizer`,
   `RiskAssessor`, `DeliveryCoordinator`, `ScenarioRunner`, `WarehouseAssigner`.
   They will be fixed in a follow-up commit using the same pattern (Pydantic
   optional/alias fields).
2. **Behavioral tests for the 7 parent agents** — out of scope per earlier agreement.
3. **Tier 3 cleanup** (gateway/config.yaml stale, dead `corsOptions` config, duplicate
   `module.exports` in some agents, stale comments in config, JWT secret warning).
4. **HTTP-level tests for the 14 untested Python routers** (low priority).
5. **Response-shape tests** that verify JS sub-agents correctly destructure the Python
   response (Pydantic response field name aliases) — will be added if regressions occur.

---

## 8. Resolved History (preserved for context)

All prior issues (C1–C3, M1–M6, Q1–Q6, m1–m8) from the previous `issues.md` are
**resolved**. See git log `3ba609c`..`0e43011` for the 5 cleanup commits.

| # | Issue | Fixed in |
|---|-------|----------|
| C1 | Agent supervisor `spawn` + IPC crash | `9e75fbb` |
| C2 | Redis v3 → v4 API incompatibility | `eba09ed` |
| C3 | Babel-jest missing (mitigated) | — |
| M1 | No Python AI/ML bridge | `3136a84` + `428a7f5` |
| M2 | Auth was complete mock | `a354d16` |
| M3 | No business API endpoints | `23fcd11` + `8796186` + `a9931e9` |
| M4 | Order/shipment model placeholders | `0ac3227` |
| M5 | Gateway proxies to dead services | `e81e516` |
| M6 | No API test coverage | `52cb70e` |
| Q1 | BaseApiService console.log | `1255ba2` |
| Q2 | checkPermission stub | `1255ba2` |
| Q3 | validateInput stub | `1255ba2` |
| Q4 | Misnamed clustering function | `1255ba2` |
| Q5 | KG no persistence | `1255ba2` |
| Q6 | MongoDB config | `ccb4f8e` |
| m1 | nodemon in deps | `9adb4e0` |
| m2 | No .env auto-copy | `9adb4e0` |
| m3 | README MongoDB refs | `9adb4e0` |
| m4 | linebreak-style Windows | `9adb4e0` |
| m5 | No Dockerfile | `9adb4e0` |
| m6 | No PM2 config | `9adb4e0` |
| m7 | gRPC proto dead code | `9adb4e0` |
| m8 | Config YAML stale | `9adb4e0` |
| — | Gateway pathRewrite bug | `428a7f5` |
| — | localStorage console.log | `0e43011` |
| — | snake_case in inventory controller | `0e43011` |
| — | .env.example missing vars | `0e43011` |
| — | 7 empty stub files | `021b2e3` |
| — | 3 broken Python route paths | `3ba609c` |
| — | Stale placeholder tests | `07cdfa4` |
| — | Requirements split | `5cae696` |
| — | 13 new sub-agents | `a6e7510` |
| — | Events + SubAgent base tests | `0e43011` |

### Open LOW issues from previous `issues.md`

- `jest.config.js:9` references `babel-jest` which is not installed — Jest falls back to
  default CommonJS transform. Remove the transform rule or install `babel-jest` if ES
  module transforms are ever needed.
- No test coverage for `GET /:storeId/:productId` and `PUT /:storeId/:productId/quantity`
  in `src/tests/api/inventory.test.js` (the other 4 inventory operations are covered).

---

## 9. Source-of-Truth Decision Log

| Question | Answer | Rationale |
|---|---|---|
| Which side is the source of truth? | **JS sub-agents** | Pydantic schemas are documented contracts; 31 sub-agents exist; changing them is more invasive. Adding optional fields to Python is non-breaking. |
| Should integration tests run in regular CI? | **Yes** | Catches regressions when Python schemas or JS sub-agents drift. |
| Should the new Python endpoints use FastAPI `Body(...)` for undeploy? | No, use `DELETE /{id}` path param | RESTful; no body needed. |
| Should `_getFallback` keys be updated? | No | Phase C changes the HTTP verb, not the path. Keys already match the POST paths. |
| Should we use `ai-ml/venv` or `ai-ml/.venv` in CI? | `.venv` (created in CI) | venv is gitignored; CI creates a fresh one. Local devs can use either. |
