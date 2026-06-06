# CSCM App — Build Plan

**Stack lock-in**: React Native + Expo SDK 54 (RN 0.81, React 19), react-native-paper, **mobile only** (no web build), **blue gradient stays** (Neural Pulse design deferred), **demo target** (role-pick login, seeded fixtures, polished UI; real auth deferred).

**Commit cadence**: one small commit per sub-step after manual smoke test.

**Total budget**: ~35 commits across 5 phases + 4 cross-cutting.

---

## Phase 1 — Foundation (~9 small commits)

The first phase stands up the API layer that every subsequent phase depends on. Nothing here is visible in the UI yet, but every screen from Phase 2 onwards calls into this layer.

### 1.0 — Install npm dependencies in `App/`
- `cd App && npm install`
- Verify `node_modules/expo` resolves and `npx expo --version` works
- Smoke test: `node -e "require('expo/package.json')"` returns version
- **Commit**: `chore(app): install expo sdk 54 dependencies`

### 1.1 — `src/api/config.js` + `App/API_SETUP.md`
- Single source of truth for `BACKEND_URL`
- Default: `http://localhost:3000`
- Helper: `getDevBackendUrl()` that reads `expo-constants` `hostUri` and auto-derives the LAN IP for phone testing
- Fallback chain: `process.env.EXPO_PUBLIC_BACKEND_URL` → `expo-constants` hostUri → `localhost:3000`
- `App/API_SETUP.md` documents:
  - How to find your dev machine's LAN IP (`ipconfig` on Windows, `ifconfig` on mac)
  - Expo Go on phone needs same WiFi
  - How to set `EXPO_PUBLIC_BACKEND_URL` for production builds
- **Validation**: `node -e "const c = require('./App/src/api/config.js')"` — must run (this is a stub for now, will be RN module later)
- **Commit**: `feat(app/api): add config module with backend URL resolution`

### 1.2 — `src/api/apiClient.js`
- `apiGet(path, { params })`, `apiPost(path, { body })`, `apiDelete(path)`, `apiPut(path, { body })`
- Base URL from `config.js`
- JSON headers, 30s timeout via `AbortController`
- Error normalization: `{ ok: false, status, message, payload }` on any non-2xx; `{ ok: true, data, status }` on success
- Log all non-2xx with the request method + path (mimics backend's BaseApiService 422 fail-loud log)
- **Validation**: small `node` test that exercises `apiGet` against a known endpoint (e.g. via `node --experimental-fetch` or by mocking `fetch`)
- **Commit**: `feat(app/api): add fetch wrapper with timeout and error normalization`

### 1.3 — `src/api/endpoints.js`
- One map per backend family: `STORE`, `WAREHOUSE`, `TRANSPORT`, `SUPPLIER`, `CUSTOMER_DEMAND`, `CENTRAL_PLANNER`, `SIMULATION`
- Each entry: `{ path, method, expectedKeys }`
- ~30 endpoints grouped by sub-agent (mirrors backend's `src/agents/*/services/apiService.js`)
- Helper: `lookupEndpoint(family, action)` returns the full config
- Helper: `endpointsByRole(role)` returns just the endpoints a given role should see (e.g. shopkeeper sees store + central-planner)
- **Validation**: `node -e "const e = require('./App/src/api/endpoints.js'); console.log(Object.keys(e.STORE).length)"` returns number of store endpoints
- **Commit**: `feat(app/api): add endpoint catalog grouped by backend family`

### 1.4 — `src/api/useApiQuery.js`
- `useApiQuery(family, action, { params, body, refetchInterval, enabled })` hook
- Returns `{ data, loading, error, refetch }`
- Handles loading + error states
- Cancellable on unmount via `AbortController`
- Skips fetch when `enabled: false`
- **Validation**: cannot test without RN runtime. Will be exercised by Phase 1.7 smoke test.
- **Commit**: `feat(app/api): add useApiQuery hook with abort and refetch support`

### 1.5 — `src/api/ApiProvider.js`
- React context exposing `apiClient` to children
- `<ApiHealthGate>` component that runs a health probe on mount
- States: `checking` (spinner), `healthy` (renders children), `unhealthy` (fullscreen "Backend not reachable" + retry button)
- Probe runs against `/api/health` (added in 1.6)
- **Validation**: smoke-tested with 1.7
- **Commit**: `feat(app/api): add ApiProvider with health gate`

### 1.6 — Add `/api/health` to backend gateway
- New endpoint in `backend/src/gateway/gateway.js`: `GET /api/health` returns `{ ok: true, timestamp, aiMlStatus, services: { ... } }`
- Probes Python AI/ML service for liveness; returns 200 if Node is up regardless of Python
- Logs status changes
- **Validation**: `curl http://localhost:3000/api/health` returns the JSON
- **Commit**: `feat(gateway): add /api/health endpoint for mobile client probe`

### 1.7 — Update `App.js` to use `ApiProvider`
- Wrap `<App />` root with `<ApiProvider>` and `<ApiHealthGate>`
- On boot, health gate probes backend
- If unhealthy, shows fullscreen "Backend not reachable — see App/API_SETUP.md" with retry
- Login screen still renders inside the gate (no changes to login flow yet)
- **Validation**: boot Expo (`npx expo start --web` for fastest smoke test) — see health gate; kill backend, see unhealthy screen; restart backend, see green
- **Commit**: `feat(app): wire ApiProvider with health gate into root`

### 1.8 — `ai-ml/api/scripts/seed_demo_data.py`
- Creates 1 shopkeeper (with 10 SKUs), 1 transporter (with 1 vehicle + 2 active routes), 1 wholesaler (with 2 suppliers)
- Idempotent: re-running upserts rather than duplicates
- Uses `TestClient(app)` to POST directly into the FastAPI app — no port binding
- Prints what was created
- **Validation**: `python ai-ml/api/scripts/seed_demo_data.py` exits 0; `validate_demo_seed.py` queries each entity back and asserts it exists
- **Commit**: `feat(ai-ml): add seed_demo_data script for mobile app demo`

### 1.9 — Phase 1 final smoke test
- Boot backend (Node.js + Python)
- Run `seed_demo_data.py`
- Boot Expo (`npx expo start --web`)
- Confirm health gate shows green
- Confirm login screen renders
- Confirm no console errors
- **Commit**: `docs(plans): mark phase 1 complete`

---

## Phase 2 — Wire Shopkeeper (~7 small commits)

Replace hardcoded data in each shopkeeper hook with `useApiQuery` calls. Each step is one commit + smoke test.

| Step | Hook | Backend family | Sample endpoint |
|---|---|---|---|
| 2.1 | `useDashboardData` (stockLevels, alerts) | store | `DemandForecaster.forecast` |
| 2.2 | `useDashboardData` (shipments) | central-planner | `DeliveryCoordinator.active` |
| 2.3 | `useInventoryData` | store | `InventoryOptimizer.optimize` |
| 2.4 | `useShipmentData` | central-planner | `DeliveryCoordinator.list` |
| 2.5 | `useStockRequestData` | store | `StockRecommender.recommend` |
| 2.6 | `useAnalysis` | store | `ContinualLearner.status` |
| 2.7 | `useCommunicationData` | customer-demand | `NLPSummarizer.summarize` |

`useProfileData` stays local (no backend user model yet — demo target).

**Validation per step**: open the corresponding screen, see real backend data, watch for 2-second loading state and graceful error state if backend is down.

---

## Phase 3 — Wire Transporter (~4 small commits)

| Step | Hook | Backend family | Sample endpoint |
|---|---|---|---|
| 3.1 | `useDashboardData` (transporter) | transport | `RouteTracker.active` |
| 3.2 | `useTasksData` | transport | `DeliveryScheduler.list` |
| 3.3 | `useNavigationData` | transport | `RouteOptimizer.plan` |
| 3.4 | `useProfileData` (transporter, vehicle) | transport | `FleetManager.vehicle` |

**Validation per step**: same as Phase 2.

---

## Phase 4 — Add Wholesaler Role (~8 small commits)

The wholesaler role is **brand new** — currently only shopkeeper + transporter exist.

| Step | Files | Backend family | Notes |
|---|---|---|---|
| 4.1 | `login/components/LoginForm.js` | — | Add "Wholesaler" tab to role selector |
| 4.2 | `users/wholesalers/wholesaler.js` + components | — | Dashboard shell with bottom nav |
| 4.3 | `users/wholesalers/risk/risk.js` | supplier | `RiskAssessor.assess` + `RiskMetricsAnalyzer.metrics` |
| 4.4 | `users/wholesalers/sourcing/sourcing.js` | supplier | `SourcingAdvisor.recommend` |
| 4.5 | `users/wholesalers/performance/performance.js` | supplier | `PerformanceTracker.report` |
| 4.6 | `users/wholesalers/calibration/calibration.js` | supplier | `SupplierCalibrator.run` |
| 4.7 | `users/wholesalers/backup/backup.js` | supplier | `BackupSupplierFinder.find` |
| 4.8 | `App.js` | — | Add `wholesaler` branch in `renderDashboard` |

**Validation per step**: login as wholesaler, navigate to each new screen, verify real data from supplier sub-agents renders with blue gradient styling.

---

## Phase 5 — Mesh-Level Views (~6 small commits)

A new top-level entry accessible from any role's nav. This is the "operations console" view — what makes the app a mesh client, not just three disconnected role views.

| Step | Files | Backend family | Notes |
|---|---|---|---|
| 5.1 | `users/mesh/mesh.js` + `components/Header.js` | — | Shell with sub-tabs |
| 5.2 | `users/mesh/alerts/alerts.js` | central-planner | `AnomalyAlerter.list` + `acknowledge` |
| 5.3 | `users/mesh/graph/graph.js` | central-planner | `KnowledgeGraphQuerier.query` — simple text query + JSON result viewer (no fancy viz in mobile) |
| 5.4 | `users/mesh/drift/drift.js` | central-planner | `DriftDetector.check` |
| 5.5 | `users/mesh/network/network.js` | central-planner | Aggregated view: count of active shopkeepers, transporters, wholesalers, open anomalies. Plain React Native `View` layout, no SVG library. |
| 5.6 | Bottom-nav updates for all 3 roles | — | Add "Mesh" entry to each role's nav so any user can open the console |

**Validation per step**: as any role, open Mesh tab, verify each sub-view shows real data from central-planner.

---

## Cross-Cutting Concerns (one commit each, run anytime)

- **A. CORS / mobile network**: handled in 1.1 via `getDevBackendUrl()`
- **B. Loading + error UX**: shared `<LoadingScreen>` and `<ErrorScreen>` components used by every `useApiQuery` consumer. One commit at the start of Phase 2.
- **C. Refresh-on-pull**: add `RefreshControl` to every list screen. One commit at the end of Phase 2.

---

## What's Explicitly Out of Scope (parked for later)

- Real auth (JWT, refresh tokens, secure storage) — deferred; demo uses role-pick login
- Push notifications, offline sync, barcode scanning, multi-store chain management (the README's "Future Enhancements")
- Neural Pulse design system (admin console, future project)
- Web build
- TypeScript migration
- Unit tests for the RN app (manual smoke test only; can add Jest+RN later)

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Mobile can't reach `localhost:3000` | Phase 1.1 derives URL from Expo's `hostUri` automatically; falls back to env var for production |
| Backend isn't running | `<ApiHealthGate>` in 1.5 shows a clear "Backend not reachable — see API_SETUP.md" screen instead of silent errors |
| Sub-agent endpoints return error shapes that don't match the app's mocks | 1.3 `endpoints.js` documents `expectedKeys`; adapters in each hook normalize shapes |
| Demo backend needs seeded fixtures | `seed_demo_data.py` (1.8) creates one shopkeeper, one transporter, one wholesaler with inventory |
| Adding wholesaler touches 8 new files | Each is a self-contained commit; if 4.3 breaks, roll back just that step, others stay |

---

## Commit Log (filled in as we go)

<!-- Add a new entry per commit. Format:
- `<short-sha>` — `<scope>: <message>` — <what was validated>
-->

---

## Status

- [x] Plan written
- [ ] Phase 1 in progress
- [ ] Phase 2 pending
- [ ] Phase 3 pending
- [ ] Phase 4 pending
- [ ] Phase 5 pending
- [ ] Cross-cutting concerns
