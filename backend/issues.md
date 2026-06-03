# Node.js Backend — Issues & Gaps

> Generated: 2026-06-03
> Scope: `backend/` directory (Express.js + supporting infrastructure)

---

## CRITICAL (will crash at runtime)

### C1. Agent supervisor uses `spawn` with IPC channel

**File:** `src/agent-runtime/agentSupervisor.js:72`

```js
const child = spawn('node', [agentScript], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});
```

**Problem:** The `'ipc'` stdio channel is only valid with `child_process.fork()`, not `spawn()`. Node.js will throw `ERR_CHILD_PROCESS_IPC_REQUIRED` when trying to use IPC with spawn.

**Impact:** Any agent spawned via `AgentSupervisor` crashes immediately. Entire agent runtime is non-functional.

**Fix:** Either use `fork()` instead of `spawn()` when IPC is needed, or remove `'ipc'` from the stdio array.

---

### C2. Redis client uses legacy v3 constructor — incompatible with redis@4.x

**File:** `src/messaging/redisClient.js:25-36`

```js
this.publisher = redis.createClient({
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password || undefined
});
```

**Problem:** The `redis` npm package is at version 4.6.13 (per `package.json`). v4+ deprecated the `{ host, port, password }` constructor in favor of `redis.createClient({ url: 'redis://...' })`. This code will either throw or silently ignore the options.

**Impact:** Redis messaging is non-functional when Redis is configured.

**Fix:** Change to `redis.createClient({ url: \`redis://${host}:${port}\` })` and handle password via the URL or `password` option (which v4 still accepts as a top-level option).

---

### C3. Babel-jest transform configured but no babel config exists

**File:** `jest.config.js` + `package.json`

```js
// jest.config.js
transform: {
  '^.+\\.(js|jsx)$': 'babel-jest'
}
```

**Problem:** Jest references `babel-jest` for transforming JS files, but no `.babelrc` or `babel.config.js` exists anywhere in the `backend/` directory, and `babel-jest` is not in `package.json` (not even in devDependencies).

**Impact:** Running `npm test` (jest) will fail with a missing transform error. The entire test suite is broken out of the box.

---

## MAJOR (functional gaps)

### M1. Zero connection between Node.js backend and Python AI/ML API

**Files:** All `api/routes/` + `gateway/gateway.js`

**Problem:** The Node.js backend (port 3000) has 9 routes for auth and events only. The Python FastAPI backend (port 8000) has 17 routers with 60+ AI/ML endpoints. There is **no bridge** between them:
- No proxy routes from Express → FastAPI
- No gateway routing to port 8000 (gateway proxies to :3001/:3002/:3003 which don't exist)
- No service-to-service communication layer

**Impact:** The AI/ML modules are completely inaccessible from the Node.js backend. The mobile app cannot call any AI/ML endpoint through the Node.js server.

**Fix needed:** Either:
- (a) Add proxy routes in Express: `/api/v1/demand/*` → `http://localhost:8000/api/v1/demand/*`
- (b) Fix the gateway to route `/api/v1/*` → port 8000
- (c) Let the frontend call the Python API directly (adds CORS/auth concerns)

---

### M2. Auth is a complete mock — no real authentication

**Files:**
- `src/api/controllers/authController.js:33-76` (register)
- `src/api/controllers/authController.js:97-131` (login)

```js
// authController.js login — accepts any credentials
const { username, password } = req.body;
// Simulate authentication — no DB check, no password hash
const user = { id: Date.now().toString(), username, email: `${username}@example.com`, role: 'user' };
const token = generateToken(user);
```

**Problems:**
1. `register()` does NOT hash password (bcryptjs imported but unused)
2. `register()` does NOT save to database — creates in-memory object
3. `login()` does NOT verify credentials — any username/password succeeds
4. No persistent user store — all users vanish on server restart
5. SQLite storage layer exists (`src/storage/`, `src/models/`) but auth doesn't use it

**Impact:** Zero security. Any request with any credentials is authenticated. Cannot be used in production.

---

### M3. No business API endpoints exist

**Status:** Express has only 9 routes

| Area | Routes Needed | Routes Exist |
|------|---------------|--------------|
| Auth | 3 | 3 (but mocked) |
| Events | 3 | 3 |
| **Inventory CRUD** | 6+ (list, get, create, update, delete, search) | **0** |
| **Orders CRUD** | 6+ | **0** |
| **Shipments CRUD** | 6+ | **0** |
| **Suppliers** | 5+ | **0** |
| **Demand Planning** | 5+ | **0** |
| **AI/ML Proxy** | 17 domains × multiple endpoints | **0** |
| **Analytics** | 5+ | **0** |
| **User/Profile** | 3+ | 1 (getProfile — mocks data) |

**Problem:** The mobile app has 7 shopkeeper tabs and 4 transporter tabs with full UI components, but the backend has no endpoints to serve their data. The app currently uses hardcoded mock data.

**Impact:** Without these routes, the frontend cannot function with real data. This is the largest gap in the project.

---

### M4. Order and shipment models are placeholders

**Files:**
- `src/models/orderModel.js:89-95` — `getById` returns `{ order_id }` only
- `src/models/orderModel.js:114-115` — `updateStatus` returns placeholder
- `src/models/orderModel.js:133-134` — `getByStore` returns `[]`
- `src/models/shipmentModel.js:90-91` — `getById` returns placeholder
- `src/models/shipmentModel.js:149-150` — `getByLocation` returns `[]`

**Impact:** Even after adding CRUD routes, the underlying models return fake data for read operations. SQLite tables exist but queries are not implemented.

---

### M5. Gateway proxies to non-existent services

**File:** `src/gateway/gateway.js`

```js
// All three of these services have NO server code in the repository
app.use('/agents', createProxyMiddleware({ target: 'http://localhost:3001' }));
app.use('/models', createProxyMiddleware({ target: 'http://localhost:3002' }));
app.use('/analytics', createProxyMiddleware({ target: 'http://localhost:3003' }));
```

**Problem:** The gateway proxies to ports 3001, 3002, and 3003, but no server code exists for these services anywhere in the repository. Starting the gateway would get connection refused errors for any traffic to these routes.

---

### M6. No API test coverage

**Status:**
- Jest + supertest installed in `devDependencies`
- `jest.config.js` is properly configured
- 20 test files exist under `src/tests/` (storage, models, messaging, ML, KG, features, agent-runtime)
- **Zero test files for the API layer** — no tests for routes, middleware, or controllers

**Impact:** Cannot verify API behavior. Refactoring or adding routes has no safety net.

---

## MODERATE (code quality and design issues)

### Q1. BaseApiService uses console.log instead of centralized logger

**File:** `src/services/BaseApiService.js`

```js
console.log(`[BaseApiService] Request to ${url} failed (attempt ${attempt})`);
console.warn(`[BaseApiService] Circuit breaker opened`);
```

**Problem:** Should use the Winston logger from `src/utils/logger.js`. Inconsistent with the rest of the codebase.

---

### Q2. `checkPermission` authorization is a no-op stub

**File:** `src/api/middleware/auth.js:77-83`

```js
const hasPermission = true; // Would check against some permission system
```

**Problem:** Fine-grained authorization always passes. If role-based `authorize()` is used above, `checkPermission` provides no additional security.

---

### Q3. `validateInput` middleware is a no-op stub

**File:** `src/api/middleware/rateLimiter.js:65-70`

```js
const validateInput = (schema) => {
  return (req, res, next) => {
    next();
  };
};
```

**Problem:** Claims to validate request bodies against a schema, but simply passes everything through. The event controllers do their own validation via AJV, but auth controllers have zero input validation.

---

### Q4. Graph clustering algorithm is misnamed

**File:** `src/knowledge-graph/graphAlgorithms.js:341`

```js
// Simplified calculation
return actualEdges / possibleEdges;
```

**Problem:** This computes graph **density** (`2|E| / (|V|(|V|-1))`), not the **clustering coefficient** (which measures how connected a node's neighbors are to each other). The function name `_calculateAverageClustering` is misleading.

---

### Q5. Knowledge graph is in-memory only — no persistence

**File:** `src/knowledge-graph/graphStructure.js`

**Problem:** The `KnowledgeGraph` class has `toJSON()`/`fromJSON()` methods for serialization, but no code in the codebase calls them to persist/restore the graph. All graph data is lost on server restart.

---

### Q6. MongoDB config is dead — project uses SQLite

**File:** `src/config/index.js:14`

```js
database: {
  uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/cscm'
}
```

**Problem:** MongoDB driver (`mongoose`) is NOT in `package.json`. The project uses SQLite for storage (`sqlite3` installed, `src/storage/sqliteDatabase.js` exists). This config value is never used and is misleading.

---

## MINOR

### m1. nodemon listed as production dependency

In `package.json`, `nodemon` is under `dependencies` instead of `devDependencies`. It's a dev-only tool.

### m2. No .env file exists

Only `.env.example` is committed. The server will work with defaults, but first-time setup requires manually copying `.env.example` to `.env` (documented in README but easy to miss).

### m3. README references MongoDB setup

README says "MongoDB" is a prerequisite and "Start services using Docker Compose", but neither MongoDB driver nor docker-compose.yml exist.

### m4. Lint enforces Unix linebreaks on Windows

`.eslintrc.js` has `'linebreak-style': ['error', 'unix']`. On Windows, `git clone` with default settings will create `CRLF` line endings, causing lint failures. Requires `git config core.autocrlf true` or changing the rule to `'windows'`.

### m5. No Dockerfile

CI pipeline references `docker build -t cscm-backend`, but no `Dockerfile` exists in the `backend/` directory.

### m6. No PM2 or production process manager

No `ecosystem.config.js` or `pm2` configuration for production deployment.

### m7. gRPC proto file is dead code

`src/api/grpc/eventService.proto` defines a gRPC service with 3 RPCs, but no gRPC server implementation exists. The file is never imported or referenced.

### m8. Config YAML is documentation only

`src/gateway/config.yaml` defines service routing rules but `gateway.js` loads its config from hardcoded values, not this YAML file.

---

## Summary by Priority

### Fix First (blocking crashes)
| # | Issue | Effort |
|---|-------|--------|
| C1 | Agent supervisor `spawn` + IPC | 5 min |
| C2 | Redis client API incompatible | 5 min |
| C3 | Babel-jest missing config + dep | 10 min |

### Fix Second (critical functionality)
| # | Issue | Effort |
|---|-------|--------|
| M1 | No connection to Python AI/ML API | 1-2 hr |
| M2 | Auth is a mock | 2-3 hr |
| M3 | No business API endpoints | 8-12 hr |
| M4 | Order/shipment model placeholders | 2-3 hr |
| M6 | No API tests | 2-4 hr |

### Fix Third (quality)
| # | Issue | Effort |
|---|-------|--------|
| M5 | Gateway proxies to nothing | 30 min |
| Q1-Q6 | Code quality issues | 1-2 hr |
| m1-m8 | Minor issues | 1 hr |
