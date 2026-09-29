# Deployment Runbook (Render)

Push to `main` and Render auto-deploys the services declared in `render.yaml`.
This is the complete checklist to go from push → verified production.

## 1. Required env vars (set once in the Render dashboard)

Render can't know shared secrets — these must be set manually and **pair up
exactly** across services:

| Secret | Set on | Must equal |
|---|---|---|
| `JWT_SECRET` | cscm-backend | auto-generated there; copy the **same value** to the two services below |
| `JWT_SECRET` | cscm-gateway | = backend's `JWT_SECRET` (gateway validates backend tokens) |
| `BACKEND_JWT_SECRET` | cscm-dashboard | = backend's `JWT_SECRET` (dashboard signs admin tokens) |
| `AI_ML_API_KEY` | cscm-aiml | auto-generated there |
| `AI_ML_API_KEY` | cscm-backend | = aiml's key |
| `AI_ML_API_KEY` | cscm-gateway | = aiml's key |
| `AI_ML_API_KEY` | cscm-dashboard | = aiml's key (AI/ML playground proxy) |
| `DASHBOARD_USER` / `DASHBOARD_PASSWORD` | cscm-dashboard | your login (password must not be `admin123` in prod) |
| `DATABASE_URL` | cscm-backend | Render PostgreSQL internal connection string |
| `ALLOWED_ORIGINS` | cscm-backend, cscm-gateway | `https://cscm-dashboard.onrender.com` |

After rotating any secret, **restart all services that share it** — env vars
are read at boot.

## 2. Deploy

```
git push origin main        # (you do this — never done by the agent)
```

Render builds each service per `render.yaml`:
- cscm-backend / cscm-gateway: `npm ci --only=production` → `node src/...`
- cscm-aiml: `pip install -r requirements.txt` → uvicorn
- cscm-dashboard: `npm ci --include=dev && npm run build` → `node server.cjs`

## 3. Post-deploy verification (5 minutes)

```bash
# Health (all four must return 200)
curl -s -o /dev/null -w "%{http_code}\n" https://cscm-backend.onrender.com/health
curl -s -o /dev/null -w "%{http_code}\n" https://cscm-gateway.onrender.com/health
curl -s -o /dev/null -w "%{http_code}\n" https://cscm-aiml.onrender.com/health
curl -s -o /dev/null -w "%{http_code}\n" https://cscm-dashboard.onrender.com/api/health

# Metrics endpoints (Prometheus text format, must NOT be 500)
curl -s https://cscm-backend.onrender.com/metrics | head -3
curl -s https://cscm-gateway.onrender.com/metrics | grep -m1 gateway_http_requests_total
curl -s https://cscm-aiml.onrender.com/metrics | grep -m1 cscm_ai_requests_total
```

Then in the dashboard: log in, open the SQL console and run `SELECT 1` — that
exercises dashboard→backend auth (`BACKEND_JWT_SECRET` pairing) end to end.

## 4. Observability (optional)

Free-tier Render services sleep, so self-hosted monitoring is local-only:

```bash
docker compose up -d prometheus grafana
# Grafana http://localhost:3001 — dashboard + datasource auto-provisioned
```

For always-on monitoring on the free tier use Grafana Cloud (free): point it at
the public `/metrics` URLs above and import `grafana/dashboards/cscm-overview.json`.

## 5. Rollback

Render keeps previous deploys: Dashboard → service → **Rollback**. Rollback
redeploys the previous commit with the **current** env vars — if a deploy
changes a shared secret, rotate back in the dashboard before rolling back.

## 6. Known limits (accepted, free tier)

- Services spin down after 15 min idle → first request pays ~30-50s cold start.
  The keep-alive workflow pings every 30 min during business hours to soften this.
- 512 MB memory per service; PostgreSQL free tier expires after 30 days.
- Prometheus/Grafana are not deployed as Render services (see render.yaml
  comments) — they sleep and lose their TSDB anyway.
