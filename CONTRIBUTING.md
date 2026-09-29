# Contributing to CSCM

Thanks for your interest in improving the Cognitive Supply Chain Mesh!

## Getting started

1. **Fork & clone** the repository.
2. Follow the [README Quick Start](README.md#quick-start) — the `scripts/setup-dev.*` path sets up everything (backend, gateway, AI/ML, console).
3. Copy the relevant `.env.example` files to `.env` (backend, dev-dashboard). Never commit `.env` files.

## Development workflow

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes with tests where practical.
3. Verify locally before pushing:
   ```bash
   cd backend && npm run lint && npm test
   cd ai-ml && pytest
   cd dev-dashboard && npm run build
   ```
4. Push and open a Pull Request against `main`. CI must pass (lint, tests, builds).

## Code standards

- **Backend**: CommonJS modules, ESLint + Prettier configs are enforced (`npm run lint`, `npm run format:check`). New routes need auth + validation middleware where applicable. Fail fast on missing production secrets.
- **AI/ML**: keep routers thin; business logic lives in `api/legacy_models/`. All `/api/v1/*` routes stay behind the API-key dependency.
- **Dashboard**: React function components only; shared primitives live in `src/components/` (Icon, StatusPill, EmptyState…); follow the Aurora token system in `styles.css`.
- **Commits**: short imperative subject + a body explaining *why*. No secrets in commit messages or diffs.

## Security

Never commit credentials, tokens, or real connection strings. If you find a vulnerability, follow [SECURITY.md](SECURITY.md) — do not open a public issue.

## Reporting bugs & proposing features

Open an issue with: what you expected, what happened, minimal reproduction steps, and the service + environment affected (backend / gateway / ai-ml / dashboard / app).
