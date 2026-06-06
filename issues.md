# Issues

Backlog of every problem surfaced during the CSCM app build (Phases 1-5, ~30 commits) and the broader codebase. Each issue has a severity, the file or location it lives in, a description, and (where useful) a suggested fix.

## Severity legend

- **P0** — broken behavior the user can hit. Fix before any release.
- **P1** — cosmetic / hard-to-hit but should not ship. Fix in the next pass.
- **P2** — tech debt. Clean up when the area is next touched.
- **P3** — nice-to-have. Defer.

## Status legend

- **open** — known, not yet fixed
- **deferred** — explicitly out of scope for the current workstream
- **fixed** — already addressed (commit hash in notes)

---

## 1. Bugs

### 1.1 `[P2]` `login.js` wraps a second `<PaperProvider>` even though `App.js` already provides one
- **File**: `App/login/login.js:78-134`, `App/App.js`
- **Status**: open
- **Description**: `App.js` already wraps the tree in a `<PaperProvider>` from `react-native-paper`. `login.js` wraps its own `<PaperProvider>` around the login screen so it works in isolation, but it never gets unmounted after login — every screen ends up nested in 2 providers. React reconciles this fine, but it is wasteful and a footgun (e.g. theme overrides on the outer provider will be ignored by the inner one).
- **Fix**: remove the `<PaperProvider>` wrapper from `login.js` and let the outer provider handle the theme; if the login screen needs its own theme overrides, lift them into `App.js`'s provider.

### 1.2 `[P2]` Health-failure screen links to `https://example.com` instead of the local docs
- **File**: `App/src/api/ApiProvider.js:91`
- **Status**: open
- **Description**: the "See API_SETUP.md" link in the unhealthy-state gate opens `https://example.com` — a placeholder left over from initial scaffolding.
- **Fix**: either (a) drop the link and surface a copy of the setup snippet in the gate, or (b) link to the absolute path of `App/API_SETUP.md` in a `Linking.openURL` call (will not work on a real device, so (a) is the better option for a mobile-only app).

### 1.3 `[P1]` `ai-ml` `demand/forecast` returns 500 on demo readiness check
- **File**: `ai-ml/api/routers/...` (sub-agent), surfaced by `ai-ml/api/scripts/seed_demo_data.py`
- **Status**: open (worked around with mock-data fallbacks in `App/.../hooks/useDashboardData.js`)
- **Description**: the readiness check from Phase 1.8 (commit `52ececf`) reported 5xx on `POST /api/v1/demand/forecast` with a sample body. The seeded RF weight loader is unhappy with the placeholder request shape.
- **Fix**: open a `demand/forecast` investigation: verify the sub-agent's `load_or_train` path against a representative input; once fixed, the `useDashboardData` hook can stop falling back to `DEFAULT_*` arrays for the demand-forecast-driven cards.

### 1.4 `[P1]` 7 other endpoints failed the readiness check (total: 8 broken)
- **File**: `ai-ml/api/scripts/seed_demo_data.py` output (last run during Phase 1.8)
- **Status**: open
- **Description**: besides `demand/forecast`, 7 other endpoints returned 5xx or 422 against the sample body. Specific labels were not captured in a persistent artifact (only the live run output). They were masked by mock-data fallbacks in the corresponding app hooks.
- **Fix**: re-run `venv\Scripts\python -m api.scripts.seed_demo_data` from `ai-ml/`, capture the FAIL list, and re-investigate each. Convert the script output into a JSON artifact (`scripts/last_readiness.json`) so the list is queryable.

### 1.5 `[P2]` Stale `Linking.openURL('https://example.com')` plus 8 broken sub-agents mean the demo will silently show fake data
- **File**: various
- **Status**: open
- **Description**: the combination of issue 1.2 (link goes nowhere) and 1.3/1.4 (real data path is broken) means a reviewer running the app for the first time will see polished but fake numbers, and have no way to know.
- **Fix**: when the user-visible flow lands on `DEFAULT_*` data, surface a subtle "Demo data — backend not reachable" banner (yellow chip in the header) on each role's dashboard. Wire this off `apiHealthy` from `ApiProvider`.

### 1.6 `[P2]` `On-Press` handlers in pre-existing components only `console.log`; no real actions
- **File**:
  - `App/users/transporters/components/BottomNavbar.js:21` — `console.log('Navigating to ...')`
  - `App/users/transporters/profile/profile.js:22` — `console.log('Edit profile pressed')`
  - `App/users/transporters/navigation/components/Header.js:18` — `console.log('Back pressed')`
  - `App/users/transporters/profile/components/Header.js:19` — `console.log('Edit profile pressed')`
  - `App/users/transporters/profile/components/SettingsSection.js:9` — `console.log('Pressed: ...')`
  - `App/users/shopkeepers/shipment/shipment.js:41` — `console.log('Action pressed for shipment ...')`
  - `App/users/shopkeepers/shipment/components/QuickActions.js:15-27` — 5x `console.log` for "Scanning barcode...", "Uploading photo...", etc.
  - `App/users/shopkeepers/shipment/components/RecentDeliveries.js:12` — `console.log('View all deliveries pressed')`
  - `App/users/shopkeepers/profile/profile.js:24,28,32` — 3x `console.log`
  - `App/login/login.js:58` — `console.log('Login attempt:', loginData)` (this one logs the full login payload — minor PII risk if any real auth is added later)
- **Status**: open
- **Description**: actions that look interactive in the UI are not wired to anything. On a demo, a reviewer can tap them and nothing happens, which is worse than a clear "coming soon" state.
- **Fix**: replace each with a real `Alert.alert('Coming soon', ...)` (or a disabled state with a tooltip), and remove the `console.log`.

### 1.7 `[P2]` `Mock data fallbacks` in every role hook mask real backend errors
- **File**: 14+ files in `App/users/**/hooks/use*Data.js`
  - shopkeeper: dashboard, inventory, shipment, stock_request, communication, analysis, profile
  - transporter: dashboard, tasks, navigation, profile
  - wholesaler: dashboard, orders, shipments, inventory, profile
  - mesh: alerts, graph (skip), drift (skip), network
- **Status**: open (intentional for the demo)
- **Description**: every hook returns `DEFAULT_*` arrays/objects when the API errors. There is no log, no telemetry, and no UI indicator that this happened (see 1.5). The hooks are doing exactly what they were designed to do, but the design is "fail silently to mock data", which is dangerous once real data is expected.
- **Fix**: in the next pass, when 1.5 is fixed, gate the fallback behind an explicit `useDemoData` prop that defaults to `true` for the demo build and is set from a build-time flag. When `false`, the hook should re-throw / surface the error.

### 1.8 `[P1]` Phase 1.8 readiness check run output was not persisted
- **File**: `ai-ml/api/scripts/seed_demo_data.py`
- **Status**: open
- **Description**: the script prints to stdout but does not write a JSON artifact, so the 8 failing endpoint labels are gone after the session ends. The list has to be re-derived by re-running.
- **Fix**: add a `--output ai-ml/api/scripts/last_readiness.json` flag, write a structured record `{timestamp, totals, failed[], warned[]}` to disk, and commit the file (with `.gitignore`d cache for transient output if needed).

---

## 2. Tech debt

### 2.1 `[P2]` 11 transporter sub-components carry inline hardcoded fallback data
- **File**: `App/users/transporters/{dashboard,navigation,tasks,profile}/components/*.js`
- **Status**: open
- **Description**: as a deliberate Phase 3 strategy, each sub-component was refactored to accept a `data` prop but kept its hardcoded literal as the fallback (`const stats = data || { pendingDeliveries: 12, ... }`). This was the right call to keep the diff small, but it leaves production code with mock data baked in.
- **Fix**: once 1.7 is fixed (fallback gated by `useDemoData`), the inline literals can be removed cleanly. The current state is intentional and safe, but should not be the long-term shape.

### 2.2 `[P2]` Mock data constants are defined in hooks (`DEFAULT_*`) and sometimes in screens — should live in one place
- **File**: `App/users/**/hooks/use*Data.js`, `App/users/wholesalers/{orders,shipments}.js` (the `FILTERS` constants), `App/users/transporters/profile/constants/index.js`
- **Status**: open
- **Description**: `DEFAULT_INVENTORY`, `DEFAULT_ORDERS`, `DEFAULT_SHIPMENTS`, `DEFAULT_BUSINESS`, `DEFAULT_STATS`, etc. are spread across the hooks. Wholesaler's tab `FILTERS` arrays live in the screen files. If we want to swap demo data for production data, we have to touch every file.
- **Fix**: centralize all demo/seed data under `App/src/demo/` and import from there. This also makes it easy to delete the demo layer in one PR.

### 2.3 `[P3]` `parsePrice()` helper is duplicated in several hooks
- **File**: `App/users/shopkeepers/{dashboard,inventory,stock_request,shipment,analysis}/hooks/use*Data.js`
- **Status**: open
- **Description**: the helper is `String(s).replace(/[^0-9.]/g, '')` then `parseFloat` — appears in 4+ hooks. Copied, not imported.
- **Fix**: lift to `App/src/utils/parsePrice.js` and import.

### 2.4 `[P3]` `STATUS_META` color/icon mapping pattern is repeated in 4+ hooks
- **File**: shopkeeper/transporter/wholesaler hooks
- **Status**: open
- **Description**: same pattern of mapping backend status strings to UI tokens. Each hook has its own local copy.
- **Fix**: consolidate into `App/src/theme/status.js` with one `STATUS_META` object keyed by status string.

### 2.5 `[P2]` `useApiQuery` is the only shared hook — most API access is in per-screen hooks
- **File**: `App/src/api/useApiQuery.js`, plus 16+ `App/users/**/hooks/use*Data.js`
- **Status**: open
- **Description**: hooks do their own data reshaping (e.g. `useDashboardData` reshapes 4 endpoints into one `stats` object). That's the right boundary, but there is no shared `useApiQueries` (plural) helper for "fetch N endpoints in parallel and return `{ loading, error, data }`". Most hooks do this by hand.
- **Fix**: add `useApiQueries(endpoints)` to `App/src/api/` and refactor the parallel-fetch hooks to use it. Cuts ~30 LOC per hook.

### 2.6 `[P3]` `App/API_SETUP.md` and `App/README.md` references are out of date
- **File**: `App/API_SETUP.md` (referenced from `App/src/api/ApiProvider.js:92` link)
- **Status**: open
- **Description**: the doc was written in Phase 1.7; the links to `seed_demo_data.py` and the gateway port should still be correct, but the readme is silent on the wholesaler role, mesh console, and the 3-role login picker added in Phases 4-5.
- **Fix**: refresh both files after 1.5 / 1.7 land.

### 2.7 `[P3]` Mock-data fields use slightly different shapes across roles
- **File**: all hooks
- **Status**: open
- **Description**: shopkeeper `useDashboardData` returns `{ sales, topProducts, alerts, pendingShipments, stats }`; wholesaler `useDashboardData` returns `{ stats, topRetailers, recentOrders }`; transporter `useDashboardData` returns `{ routeProgress, nextTask, alerts, upcomingStops, quickStats, header }`. They are correctly *role-specific*, but the absence of a typed contract (no TS, no PropTypes) means a future contributor has to read the hook to know the shape.
- **Fix**: when TS is added (or PropTypes) all 14+ hook returns can be expressed as types.

---

## 3. Test gaps

### 3.1 `[P1]` No tests in `App/`
- **File**: `App/` (entire tree)
- **Status**: open
- **Description**: the `App/` folder has zero test files. All 621 backend tests live in `backend/src/tests/`. The mobile hook layer (16+ hooks), the apiClient error normalization, the response-shape mapping in hooks, and the gateway routing are all untested.
- **Fix**: scaffold `App/jest.config.js` and `App/__tests__/` with a `__mocks__/apiClient.js`. Test pattern: import each hook, render with `@testing-library/react-hooks`, mock the apiClient to return fixture shapes, assert the hook returns the expected transformed data. Start with the 5 most data-heavy hooks (shopkeeper dashboard, wholesaler dashboard, transporter tasks, mesh alerts, mesh graph).

### 3.2 `[P2]` No end-to-end mobile test against a running gateway
- **File**: `App/`
- **Status**: deferred
- **Description**: the `INTEGRATION_TEST=1` opt-in exists conceptually, but no test currently exercises a real backend from the app side. E2E would catch issues like:
  - gateway proxy 404'ing on a 200 Node response with a body
  - response shape drift between Node and Python
  - timeout/retry behavior on slow endpoints
- **Fix**: write a Detox or Maestro test that boots the app with `EXPO_PUBLIC_BACKEND_URL` pointing at a real gateway, logs in as shopkeeper, and asserts the dashboard loads real data (no `DEFAULT_*` values).

### 3.3 `[P2]` Integration tests in `ai-ml` exist for some endpoints, not all
- **File**: `ai-ml/api/validation/model_wrapper_validation.py`, `ai-ml/api/scripts/validate_phase_*.py`
- **Status**: open
- **Description**: the validation scripts cover a subset of the 17 routers. Several new mesh endpoints (`/api/v1/coordination/plan`, `/api/v1/kg/query`, `/api/v1/monitoring/drift`) are tested only via the readiness check (1.3, 1.4), not the full Pydantic schema validation.
- **Fix**: extend `validate_phase_a.py` / `validate_phase_b.py` to include the mesh console's 4 endpoints (`anomaly/alerts`, `kg/query`, `monitoring/drift`, `central-planner/retrain`).

### 3.4 `[P3]` `seed_demo_data.py` doesn't capture `response.json()` for the OK cases
- **File**: `ai-ml/api/scripts/seed_demo_data.py:175`
- **Status**: open
- **Description**: the OK branch only records `status=200`. For future work (auto-generating TS types from response shapes, see 2.7) the actual JSON body would be useful.
- **Fix**: optionally write a `--save-responses` flag that writes `last_responses.json` keyed by endpoint.

---

## 4. Dev environment

### 4.1 `[P2]` Global Python is broken (torch DLL)
- **File**: system Python (outside repo)
- **Status**: open
- **Description**: the global `python` on this machine fails to import `torch` with a DLL error. All work must use the venv at `ai-ml/venv` (or `ai-ml/.venv`).
- **Fix**: document the venv activation in `ai-ml/README.md`; consider adding a pre-commit that fails on a global `python -c "import torch"` to prevent new contributors from being surprised.

### 4.2 `[P2]` Two venvs at `ai-ml/venv` and `ai-ml/.venv`
- **File**: `ai-ml/venv`, `ai-ml/.venv`
- **Status**: open
- **Description**: two Python virtualenvs exist, both functional. It is unclear which is the canonical one. Different scripts assume different paths.
- **Fix**: pick one, delete the other, and update the README + scripts to point at the survivor. Add `.venv` to `.gitignore` if not already.

### 4.3 `[P1]` PowerShell quirks are not documented in a single place
- **File**: (would live in `README.md` or a new `docs/powershell.md`)
- **Status**: open
- **Description**: PowerShell has a handful of sharp edges that bit us repeatedly:
  - `/` inside `git commit -m "..."` is interpreted as a path; need heredoc or escape
  - `Start-Process` child dies when the spawning shell exits — start + test + stop must be in the same shell block
  - `VAR=value cmd` is bash syntax; PowerShell needs `$env:VAR = "value"` prefix
  - `cd` chained with `;` does not change the working directory for subsequent commands in a workdir-relative context
- **Fix**: document these in the repo root README under a "Windows / PowerShell" section. Saves 5-10 minutes per future session.

### 4.4 `[P2]` Pytest must run from `ai-ml/api/`
- **File**: `ai-ml/`
- **Status**: open
- **Description**: there is a path conflict between `ai-ml/models/` (a top-level package) and `ai-ml/api/models/` (Pydantic models). Running pytest from `ai-ml/` resolves the wrong one. We sidestep this by always `cd ai-ml/api` first.
- **Fix**: rename the top-level `ai-ml/models/` package to `ai-ml/legacy_models/` or similar, and update the few importers. Then `pytest` from `ai-ml/` will work. This is invasive but worth it before the ai-ml side grows further.

### 4.5 `[P2]` Bundle smoke test takes ~3 min and runs even on small changes
- **File**: `App/`
- **Status**: open
- **Description**: `npx expo export --platform web --output-dir /tmp/expo-export-test` is the only smoke test for the mobile side, and it exports the entire bundle every time. Each Phase 1-5 commit ran it.
- **Fix**: switch to `npx expo export --platform web --no-bytecode --no-minify` for ~50% speedup, and add a Metro-only smoke (`npx expo start --no-dev --minify --offline` + a curl to the bundle URL) for the inner loop.

---

## 5. Architecture / scope reductions

### 5.1 `[P3]` Sub-agents are lightweight classes, not child processes
- **File**: `ai-ml/api/agents/`
- **Status**: deferred (per the original design decision)
- **Description**: a single Python process hosts all 31 sub-agents as in-process classes. Fine for the demo, but a hot reload of one agent restarts the whole process. A long-running deployment would want each agent in its own worker.
- **Fix**: in a future "ai-ml v2" pass, split the 17 routers into separate `uvicorn` processes fronted by a router.

### 5.2 `[P3]` No real auth — 3-role login picker is a demo affordance
- **File**: `App/login/`, `App/App.js`
- **Status**: deferred
- **Description**: login is a role-pick with no password. `auth/login` is the only auth endpoint the backend exposes, and the app does not call it.
- **Fix**: when real auth is in scope, hook the `LOGIN` endpoint from `endpoints.js`, store the JWT in `expo-secure-store`, and gate `ApiProvider` on a valid token.

### 5.3 `[P2]` Mesh console has no real auth gate (role-agnostic)
- **File**: `App/users/mesh/mesh.js`
- **Status**: open (intentional for the demo)
- **Description**: the mesh console is reachable from any role. For a production deployment, central-planner views should be gated to operators / admins only.
- **Fix**: add a `role` prop to `MeshConsole` and a permission check; or move the mesh views out of the role's bottom-nav and into a separate admin section.

### 5.4 `[P3]` Gateway port (`8080`) is duplicated in code and docs
- **File**: `App/src/api/config.js`, `App/API_SETUP.md`, `backend/src/gateway/gateway.js`
- **Status**: open
- **Description**: the gateway port appears in 3+ files. Changing it requires touching all of them.
- **Fix**: read from `process.env.GATEWAY_PORT` (default 8080) in all 3 places.

---

## 6. Documentation gaps

### 6.1 `[P3]` No `cscm/requirements.md` at repo root
- **Status**: open
- **Description**: the design system lives in `design.md` (Neural Pulse) but the app's product requirements (what each role can do, what data is shown) are scattered across commit messages and the plan log.
- **Fix**: create `requirements.md` with one section per role (shopkeeper / transporter / wholesaler / mesh) and a "data shape" sub-section for each.

### 6.2 `[P3]` `plans/app-build-plan.md` doesn't link to `issues.md`
- **Status**: open
- **Description**: future readers of the plan will hit a list of "deferred" items without a way to track them.
- **Fix**: add a "Known issues" link at the top of the plan pointing to this file.

### 6.3 `[P3]` The mesh console is undocumented outside of commit messages
- **File**: `App/users/mesh/`
- **Status**: open
- **Description**: there is no `App/users/mesh/README.md` explaining what each of the 4 sub-views does, what CENTRAL_PLANNER endpoints it calls, or what the mock-data shape is.
- **Fix**: add a `README.md` per `users/<role>/` documenting the role's data flow.

### 6.4 `[P3]` Architecture diagrams are out of date
- **File**: `cscm-video/`, `design.md`
- **Status**: open
- **Description**: any diagram in the repo (or in the `cscm-video` assets) predates the wholesaler role and the mesh console.
- **Fix**: regenerate after the next major release.

---

## 7. Pinned (intentional, do not fix)

### 7.1 Mobile hits the Node.js gateway on `:8080`, not Express on `:3000`
- **File**: `App/src/api/config.js`
- **Status**: pinned
- **Description**: the gateway is the only thing the app talks to. This is correct.

### 7.2 `mock-data fallbacks` are the right shape for the demo target
- **File**: 16+ hook files
- **Status**: pinned (see 1.7 for the path forward)
- **Description**: the demo would be worse if every offline moment produced a spinny error. The fallbacks are intentional.

### 7.3 `seed_demo_data.py` is a readiness check, not a validator
- **File**: `ai-ml/api/scripts/seed_demo_data.py:1-19`
- **Status**: pinned
- **Description**: this is documented in the script's own docstring. For schema validation, use `validate_phase_a.py` / `validate_phase_b.py`.

---

## 8. Quick wins (low effort, high value)

If you want to chip away at this list, the top 5 by effort-vs-value:

1. **Issue 1.6** — replace the 16 `console.log` handlers with `Alert.alert('Coming soon', ...)` (1 small commit)
2. **Issue 1.2** — delete the `https://example.com` link from `ApiProvider.js` (1-line fix)
3. **Issue 1.5** — add a "Demo data" yellow chip to each role's header (small new component, ~30 LOC)
4. **Issue 4.3** — write up the PowerShell quirks in `README.md` (no code change, saves 5-10 min/session)
5. **Issue 2.2** — centralize `DEFAULT_*` constants under `App/src/demo/` (touches 14 files, but each is a 1-line import change)
