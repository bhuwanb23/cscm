# CSCM Control Plane (dev-dashboard)

A React control plane for the **entire** Cognitive Supply Chain Mesh: monitor,
inspect, edit, delete and drive every layer — mobile app surface, gateway,
Node backend + agents, AI/ML platform, and the database.

## Architecture

```
React SPA (Vite, 40 routes)
  └── Express control server (server.cjs, :3002)
        ├── dashboard auth (JWT, 8h sessions)
        ├── /api/*    → Node backend :3000 /api/v1/debug/* (admin API)
        ├── /api/aiml/* → AI/ML :8000 /api/v1/* (X-API-Key injected)
        ├── /gateway/* → gateway :8080 passthrough (your backend JWT)
        └── WebSocket: live service health + event feed
```

Security: the dashboard never stores upstream credentials. It either signs a
5-minute backend admin token from `BACKEND_JWT_SECRET`, or forwards the admin
JWT you paste in **Settings**. All SQL through the console is read-only
(SELECT/WITH/EXPLAIN, bound params, 500-row cap); deletes go through guarded,
allowlisted admin actions only.

## Run

Development (hot reload):

```bash
cd dev-dashboard
npm install
cp .env.example .env          # set BACKEND_JWT_SECRET = backend's JWT_SECRET
npm run server                # control server on :3002
npm run dev                   # React + HMR on :5173 (proxies to :3002)
```

Production-style (built SPA served by the control server):

```bash
npm run build
npm start                     # http://localhost:3002
```

Login with `DASHBOARD_USER` / `DASHBOARD_PASSWORD` (default `admin`/`admin123`
in development only).

## What each page does

| Group | Pages |
|---|---|
| **Monitor** | Overview (live KPIs + activity feed), Services (health detail + topology), Logs (tail backend combined/error), Event stream (WS feed), Settings (backend admin JWT), Docs (Swagger/Prometheus/Grafana links) |
| **Database** | Tables (live row counts), Table detail (schema + paginated rows + guarded delete), SQL console (read-only), Backups (list/create), Migrations info |
| **Business data** | Users & roles (list/create/edit role/delete), Inventory (per-store, edit qty, delete), Orders (status transitions, delete), Shipments (filter by status, transitions, delete), Store detail (combined view) |
| **Agents** | Runtime control (start/stop/restart via process manager), Families & sub-agents (7 parents / 31 subs), Knowledge graph (structure + AI/ML query console), Cache (stats/clear), Feature store |
| **AI/ML** | Model overview (health + 16 domain cards), API playground (any endpoint + history), and a per-domain page each: demand forecast/planning, inventory opt, routing, supplier risk, customer, anomaly, NLP, KG, causal, vision, learning, uncertainty, monitoring, digital twin, coordination, explainability |
| **Platform** | User simulation (start/stop/status via backend), Gateway routing table, Circuit breakers (state + reset), Mobile app screens map |

## Backend admin API (added for this dashboard)

All under `/api/v1/debug/*`, admin JWT required, `DEBUG=true` in production:

- `GET /system` · `GET /database/tables` · `GET /database/tables/:t/schema` · `GET /database/tables/:t/rows`
- `POST /database/query` (read-only SQL) · `POST /database/create-user`
- `GET /data/users|inventory/:store|orders/:store|shipments/status/:s`
- `POST /data/delete-user|delete-order|delete-shipment|delete-inventory`
- `PATCH /data/users/:id/role`
- `GET /logs` · `GET /agents` · `POST /agents/:name/:action`
- `GET /cache/stats` · `POST /cache/clear` · `GET|POST /backups`
- `GET /simulation/status` · `POST /simulation/start|stop`

## Deployment (Render)

The dashboard deploys as `cscm-dashboard` (see `render.yaml`) alongside the
existing services. It serves the built React app and proxies API traffic
server-to-server, so only the dashboard's origin needs public browser access.

### How it connects

| Env var | Value on Render | Purpose |
|---|---|---|
| `BACKEND_URL` | `<BACKEND_URL>` | admin API proxy (`/api/v1/*` passthrough) |
| `GATEWAY_URL` | `<GATEWAY_URL>` | circuit-breaker state + reset |
| `AI_ML_URL` | `<AI_ML_URL>` | AI/ML playground + domain pages |
| `BACKEND_JWT_SECRET` | **same value as cscm-backend's `JWT_SECRET`** | signs 5-min admin tokens |
| `AI_ML_API_KEY` | **same value as cscm-aiml's `AI_ML_API_KEY`** | `X-API-Key` for AI/ML calls |
| `DASHBOARD_JWT_SECRET` | auto-generated (`generateValue: true`) | dashboard session cookies |
| `DASHBOARD_USER` / `DASHBOARD_PASSWORD` | set manually | dashboard login |

### One-time setup checklist

1. **Push this repo** — the backend CORS fix (allow server-to-server traffic
   with no `Origin` header) must deploy to `cscm-backend` before anything can
   call it server-side. Until then the gateway and dashboard see backend 500s.
2. In the Render dashboard set on **cscm-backend** →
   `ALLOWED_ORIGINS=<DASHBOARD_URL>` (comma-separated if more).
3. On **cscm-gateway**: ensure `JWT_SECRET` equals cscm-backend's, set
   `AI_ML_API_KEY` to match cscm-aiml.
4. On **cscm-dashboard** (after first deploy): set `BACKEND_JWT_SECRET` (=
   backend `JWT_SECRET`), `AI_ML_API_KEY` (= cscm-aiml's key),
   `DASHBOARD_USER` / `DASHBOARD_PASSWORD` (do not keep defaults).
5. Redeploy all services. Verify at `/api/health` → then log in and check
   Overview shows all three services healthy.

### Notes

- Free-tier instances sleep; the first request after idle may take 50s+ (the
  dashboard's health poller will show services as `unknown` briefly).
- The dashboard never proxies browser CORS concerns: all upstream calls are
  server-to-server (no `Origin` header), which the backend now allows.
