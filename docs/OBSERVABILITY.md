# Observability: Prometheus + Grafana

CSCM ships a metrics + visualization stack:

| Service | Image | Port | Source of metrics |
|---|---|---|---|
| Prometheus | `prom/prometheus:latest` | 9090 | scrapes each service's `/metrics` |
| Grafana | `grafana/grafana:latest` | 3001 (host) | reads Prometheus, provisioned dashboards |

Scrape jobs (`prometheus/prometheus.yml`):
- `backend` → `backend:3000` (compose) or `localhost:3000` (`backend-local`)
- `gateway` → `gateway:8080` (compose) or `localhost:8080` (`gateway-local`)
- `ai-ml` → `ai-ml:8000` (compose) or `localhost:8000` (`ai-ml-local`)
- `prometheus` → self-scrape

## Metric names (what to query)

| Source | Metrics |
|---|---|
| Backend API | `http_requests_total`, `http_request_duration_seconds_*`, `active_connections`, `errors_total`, `cscm_users_*`, `cscm_orders_*`, `cscm_inventory_*`, `cscm_shipments_*` + prom-client defaults (`process_*`, `nodejs_*`) |
| Gateway | `gateway_http_requests_total`, `gateway_http_request_duration_seconds_*`, `gateway_circuit_breaker_state`, `gateway_rate_limit_hits_total`, `gateway_active_connections`, `gateway_authentication_*` |
| AI/ML | `cscm_ai_requests_total`, `cscm_ai_request_duration_seconds_*`, `cscm_ai_errors_total`, `cscm_ai_inflight_requests` |

> ai-ml note: `/metrics` is now Prometheus text format. The legacy JSON perf
> snapshot moved to `/api/metrics`.

## Run it

### Docker Compose (full stack)

```bash
docker compose up -d prometheus grafana
# Prometheus UI  http://localhost:9090
# Grafana UI     http://localhost:3001  (admin / ${GRAFANA_ADMIN_PASSWORD:-admin})
```

Grafana auto-provisions:
- Datasource: `Prometheus` → `http://prometheus:9090`
- Dashboard: **CSCM System Overview** (traffic, error rate, p95/mean latency,
  memory/CPU, event-loop lag, circuit breakers, scrape health)

### No Docker? Run Prometheus locally

Download the [Prometheus binary](https://prometheus.io/download/), then:

```bash
prometheus --config.file=prometheus/prometheus.yml
```

The `*-local` jobs scrape `localhost:3000/8080/8000` — start backend, gateway
and ai-ml with `npm start` / uvicorn as usual. For Grafana without Docker, use
[Grafana OSS](https://grafana.com/grafana/download/) and import
`grafana/dashboards/cscm-overview.json`.

## Render deployment

Free-tier Render services **sleep**, so self-hosted Prometheus/Grafana are
declared-but-commented in `render.yaml` (paid `starter` plan). For free tier the
low-friction path is **Grafana Cloud (free)**:

1. Create a free Grafana Cloud account → hosted Prometheus.
2. Scrape the public service metrics endpoints by URL
   (`https://cscm-backend.onrender.com/metrics`, etc.) — Remote Write or the
   Grafana Cloud agent both work.
3. Import `grafana/dashboards/cscm-overview.json` into your Grafana Cloud
   instance; the queries are datasource-agnostic.

## Security notes

- `/metrics` on backend and gateway bypass auth/rate-limits intentionally
  (infrastructure traffic). Do not put additional secrets on those routes;
  they expose counters/histograms only.
- Grafana: anonymous auth disabled, signup disabled, admin password via
  `GRAFANA_ADMIN_PASSWORD` env (compose `.env`), never committed.
- ai-ml `/metrics` is unauthenticated by design (Prometheus standard); all
  `/api/v1/*` business routes still require the API key.
