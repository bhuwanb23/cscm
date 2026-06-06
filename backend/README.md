# CSCM Backend

Backend services for the Cognitive Supply Chain Mesh (CSCM) platform.

## Overview

- REST API server (Express.js, port 3000)
- API Gateway (Express.js, port 8080 — proxies to Node.js + Python AI/ML)
- SQLite storage via `sqlite3`
- Messaging (Redis pub/sub, optional Kafka/MQTT)
- Agent orchestration runtime
- Knowledge graph for supply chain relationships

## Prerequisites

- Node.js 18+
- SQLite (included via `sqlite3` npm package — no separate install)

Optional:
- Redis — for pub/sub messaging
- Kafka — for event streaming
- MQTT Broker — for IoT messaging
- Python FastAPI (port 8000) — for AI/ML endpoints

## Getting Started

```bash
npm install        # installs deps, auto-creates .env if missing
npm start          # starts API server on port 3000
npm run dev        # starts with nodemon auto-reload
```

The gateway runs separately:
```bash
node src/gateway/gateway.js    # starts on port 8080
```

## Project Structure

```
src/
├── api/              # Express routes, controllers, middleware
│   ├── routes/       # auth, events, inventory, orders, shipments
│   ├── controllers/  # request handlers (auth, events, inventory, orders, shipments)
│   └── middleware/    # authenticate, authorize, rate limiter
├── agents/           # Multi-agent orchestration (store, warehouse, transport, etc.)
├── agent-runtime/    # Process manager, supervisor, health monitor
├── config/           # Centralized config (env vars)
├── features/         # Feature flag storage, versioning, transformations
├── gateway/          # API Gateway (proxy to Node.js + Python AI/ML)
├── knowledge-graph/  # Graph structure, algorithms, entity models
├── messaging/        # Redis, Kafka, MQTT clients
├── ml/               # ML decision models
├── models/           # Data models (inventory, order, shipment, user)
├── optimization/     # Inventory optimization
├── services/         # BaseApiService for agent → Python AI/ML calls
├── storage/          # SQLite database, localStorage
├── tests/            # Jest test suites
│   ├── api/          # API integration tests (auth, inventory, orders, shipments)
│   ├── agents/
│   ├── knowledge-graph/
│   └── ...
└── utils/            # Winston logger
```

## API Endpoints

All endpoints are mounted under `/api/v1`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user (bcrypt + SQLite) |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| GET | `/api/v1/auth/profile` | Current user profile (requires token) |

### Events
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/events/telemetry` | Publish telemetry event |
| POST | `/api/v1/events/inventory` | Publish inventory event |
| POST | `/api/v1/events/order` | Publish order event |

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/inventory/:storeId` | List inventory by store |
| GET | `/api/v1/inventory/:storeId/:productId` | Get specific item |
| POST | `/api/v1/inventory` | Create/update inventory item |
| PUT | `/api/v1/inventory/:storeId/:productId/quantity` | Update quantity |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/orders` | Create order |
| GET | `/api/v1/orders/:orderId` | Get order by ID |
| PATCH | `/api/v1/orders/:orderId/status` | Update order status |
| GET | `/api/v1/orders/store/:storeId` | List orders by store |

### Shipments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/shipments` | Create shipment |
| GET | `/api/v1/shipments/:shipmentId` | Get shipment by ID |
| PATCH | `/api/v1/shipments/:shipmentId/status` | Update shipment status |
| GET | `/api/v1/shipments/status/:status` | List by status |
| GET | `/api/v1/shipments/location/:location` | List by location |

### Gateway
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Gateway health check |
| GET | `/health/python` | Python AI/ML health probe |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start API server |
| `npm run dev` | Start with nodemon |
| `npm test` | Run all Jest tests (unit only) |
| `npm run test:integration` | Run JS -> Python AI/ML integration suite (spawns uvicorn) |
| `npm run lint` | ESLint check |
| `npm run agents` | Start agent runtime |
| `npm run test-sqlite` | Test SQLite connection |
| `npm run demo-sqlite` | SQLite feature demo |
| `npm run test-knowledge-graph` | Test knowledge graph |
| `npm run test-redis` | Test Redis connection |

## Testing

```bash
npm test              # all unit suites (fast, ~30s, mocked apiService)
npm test -- --watch   # watch mode
```

### Integration tests (JS -> Python AI/ML)

The integration suite under `src/tests/integration/` exercises the full
JS -> HTTP -> Python -> Pydantic contract for every endpoint touched by
the Phase A schema fixes and Phase B new routes (20 tests across 13
endpoints + 3 Pydantic 422 negative tests).

These tests are **skipped by default** so `npm test` stays fast and
side-effect-free. They are gated on the `INTEGRATION_TEST=1` env var
and are run in CI by `.github/workflows/integration-tests.yml`.

To run locally:

```bash
# 1. Make sure the ai-ml venv exists and the app imports cleanly
cd ../ai-ml
python -m venv venv
./venv/bin/pip install -r requirements.txt

# 2. From this directory, run the integration suite
#    (the Python uvicorn server is auto-spawned and killed by the test)
npm run test:integration
```

How it works:

- `src/tests/integration/pythonApi.integration.test.js` uses
  `describe.skip` when `INTEGRATION_TEST !== '1'`, so the file is a
  no-op under plain `npm test`
- On `INTEGRATION_TEST=1`, `beforeAll` calls
  `scripts/start_python_server.js` which spawns
  `python -m api._run_server` from the `../ai-ml/venv` and polls
  `/health` until the server is ready (default timeout 120s, absorbs
  the FastAPI lifespan that pre-trains models)
- `afterAll` sends SIGTERM to the child
- Failures from Pydantic (HTTP 422) are surfaced in full by the
  `BaseApiService` fail-loud log branch — visible in test output
  via the structured logger

A run looks like:

```
Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        ~10s
```

## License

MIT
