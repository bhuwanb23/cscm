# Security Policy

## Supported versions

The `main` branch is the only supported line; deployments track it directly via Render auto-deploys.

## Reporting a vulnerability

**Do not open a public issue for security problems.**

1. Use GitHub's **Private vulnerability reporting** (Security tab → Report a vulnerability), or
2. Contact the maintainer directly.

Include: affected service (backend / gateway / ai-ml / dashboard), a description, reproduction steps, and impact assessment. You'll get an acknowledgment within 72 hours.

## Security model highlights

- **Secrets**: shared secrets (`JWT_SECRET`, `AI_ML_API_KEY`) are never committed — they're set per-service in the Render dashboard. A scheduled secret-scan workflow (`.github/workflows/secret-scan.yml`) guards tracked files.
- **Auth**: backend debug endpoints are admin-JWT gated and disabled unless `DEBUG=true`; Swagger UI is production-disabled by default; the dashboard refuses to boot in production with default credentials.
- **Metrics**: `/metrics` endpoints bypass auth by design (Prometheus pull model) and expose only counters/histograms — no user data.
- **Headers**: helmet on backend/gateway; strict CSP on the console; HSTS in production.

## Known accepted risks (free-tier deployment)

- Public `/metrics` endpoints are reachable without auth (standard Prometheus practice); deploy a reverse-proxy rule if you need them locked down.
- Dashboard rate-limiting is per-IP; behind corporate NAT multiple users share the budget.
