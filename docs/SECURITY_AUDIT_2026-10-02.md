# Security Audit — CSCM Supply Chain Mesh

**Date:** 2026-10-02
**Scope:** `backend/` (API + gateway), `dev-dashboard/` (admin control plane), `ai-ml/`, `App/`, CI workflows, deployed Render topology.
**Method:** static review of code and configuration, live probing of the deployed
services, git-history secret scan, and dependency audit. Findings were confirmed
against the running production deployment before being reported.

> The external reference library `mukul975/Anthropic-Cybersecurity-Skills`
> (818 skills / 34 domains) was consulted as a knowledge reference. It was **not**
> installed: injecting unvetted instruction files into an agent session that holds
> production credentials is a supply-chain risk in its own right. The six domains
> relevant to a Node/React monorepo (Web AppSec, API Security, Supply Chain,
> AI/agentic, Cryptography, Compliance) drove the audit; ADCS, Sliver C2, OT/ICS,
> Bluetooth and similar domains have no attack surface here.

---

## Summary

The platform is meaningfully hardened for its architecture: strict CORS allowlist,
pinned JWT algorithms with issuer/audience verification, bcrypt with account
lockout and enumeration-safe errors, helmet security headers on all three services,
and **zero known dependency vulnerabilities** across all workspaces.

Two genuine vulnerabilities were found and fixed, both in the admin/control-plane
trust boundary. Neither is exploitable anonymously; both require an authenticated
session. The most serious would escalate a *read-only* dashboard session into
full credential compromise.

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| F1 | **High** | Debug table browser returned live bcrypt password hashes | Fixed |
| F2 | **High** | Broken object-level authorization — any shopkeeper could read/write every other store's orders and inventory | Fixed |
| F3 | **Medium** | Hardcoded demo password for all seeded accounts, published in a public repo | Fixed |
| F4 | Low | Secrets pasted into chat / operator shoulder-surfing risk | Action required by operator |
| F5 | Info | `DEBUG=true` and an admin-capable proxy are enabled in production | Accepted, mitigated |

---

## F1 — Credential disclosure via the debug table browser (High, fixed)

**Where:** `backend/src/api/routes/debug.js`

`GET /api/v1/debug/database/tables/:table/rows` returned every column of a table
verbatim. The `users` table contains the bcrypt hash, so the endpoint returned
credential material to any holder of an admin dashboard session.

**Evidence (live, pre-fix):**

```
GET /api/v1/debug/database/tables/users/rows?limit=1  ->  200
{"id":1,"username":"testuser","email":"test@example.com",
 "password":"$2a$10$0a.yR8im0lIlk19rdkUkf.yYn6nS2OzH57kEwTvP.8OTv7uHHkvN2", ...}
```

**Why it matters:** bcrypt hashes are offline-crackable. A dashboard read leak
stops being an information disclosure and becomes credential compromise — the
seeded demo accounts all share one password, so cracking one yields the roster.

**Impact was bounded.** The endpoint's authentication itself held up under probing:

| Attempt | Result |
|---|---|
| No token | 401 |
| Garbage token | 401 |
| Expired admin token | 401 |
| `alg: none` forgery | 401 |
| Non-admin role (shopkeeper) | 403 |

`pg_authid` and `pg_shadow` were correctly denied by Postgres itself, the read-only
SQL guard blocked stacked statements, data-modifying CTEs, comment-hidden keywords
and `COPY`, and `/logs` accepts only two fixed filenames (no path traversal).

**Fix:** `redactSensitiveColumns()` masks a denylist of credential columns
(`password`, `token`, `secret`, `api_key`, `private_key`, …) case-insensitively,
on both the Postgres and SQLite branches and in the read-only SQL console. Columns
are replaced with `[redacted]` rather than dropped, so operators can still see the
column exists.

**Regression test:** `backend/src/tests/api/debugRedaction.test.js` — 4 tests,
verified to fail (3/4) without the fix.

---

## F2 — Broken object-level authorization across stores (High, fixed)

**Where:** `backend/src/api/routes/inventory.js`, `backend/src/api/controllers/orderController.js`

Inventory routes mounted `authenticate` but never authorized the `:storeId` path
segment. Orders had a `checkStoreAccess` guard, but it only checked the caller's
**role**, carrying an explicit `TODO: Implement proper user-to-store association`.
Any authenticated shopkeeper was therefore trusted with every store's data.

**Evidence (live, pre-fix)** — `shopkeeper_001` reading other tenants:

```
GET /api/v1/orders/store/STORE002 -> 200  (63 orders, another store's)
GET /api/v1/orders/store/STORE007 -> 200  (65 orders)
GET /api/v1/orders/store/STORE008 -> 200  (77 orders)
GET /api/v1/inventory/STORE002    -> 200  (another store's stock)
```

The write path was equally unguarded — `PUT /inventory/:storeId/:productId/quantity`
let one shopkeeper rewrite another's stock levels. This is textbook BOLA/IDOR
(OWASP API1:2023), and in a multi-tenant supply chain it means a shopkeeper could
manipulate a competitor's inventory.

**Fix:** new `backend/src/api/middleware/storeAccess.js` enforcing ownership:

- `admin` and `transporter` are cross-store roles (they are not store-bound).
- `shopkeeper`/`wholesaler` are bound to exactly one store, resolved from the JWT
  `storeId` claim, falling back to the seeded username convention
  (`shopkeeper_003` → `STORE003`) so existing tokens keep working.
- **Fails closed:** a store-scoped role whose store cannot be resolved is denied
  rather than served. Silently allowing was the original defect.
- Applied to all four inventory routes; `checkStoreAccess` now delegates to the
  same guard, removing the duplicated role-only logic and its TODO.

**Regression tests:** 5 added across the two API suites — cross-store read denied,
cross-store write denied, unresolvable store denied, admin still cross-store, own
store still allowed. All 5 pass.

---

## F3 — Hardcoded demo password in a public repository (Medium, fixed)

**Where:** `backend/scripts/seed-history.js`, `.github/workflows/user-simulation.yml`

Both contained the literal `'Cscm!Demo2026'`. The repo is **public**, so this was
the plaintext production password for all 23 seeded accounts — the 8 shopkeepers,
8 transporters, 5 wholesalers and 2 admins. A git-history scan across all 470
commits confirmed the literal is committed in 2 files.

**Fix:** both now require an explicit secret and fail closed with instructions to
generate one. `SEED_PASSWORD` has no source-level default, so it cannot leak via git.

**Action required:** the existing 23 seeded accounts still hold `Cscm!Demo2026`.
Rotate them (set `SIM_USER_PASSWORD` as a repo secret and re-run the rotation),
because removing the literal from source does not change already-seeded rows.

---

## F4 — Live production secrets exposed in chat (Low, operator action)

During setup, the following were pasted into a chat transcript: `JWT_SECRET` /
`BACKEND_JWT_SECRET`, `DASHBOARD_JWT_SECRET`, `AI_ML_API_KEY`, `DASHBOARD_PASSWORD`,
and the database password embedded in `DATABASE_URL`.

**Verified good:** a full-history scan for all of these values across every commit
returns **0 hits** — no secret is present in the repository or its git history, and
`.env` files are gitignored. The repo being public has not leaked them.

**Still recommended:** rotate `DASHBOARD_JWT_SECRET`, `AI_ML_API_KEY`,
`DASHBOARD_PASSWORD`, and the Postgres password, since they are now in a
transcript. Treat the database password as compromised and rotate it first.

---

## F5 — Debug plane and privileged proxy enabled in production (Info, accepted)

`DEBUG=true` is set on `cscm-backend`, which enables the entire admin control
plane (22 routes) in production. The dashboard mints its own short-lived admin JWT
from `BACKEND_JWT_SECRET`, so compromise of that one variable yields full backend
admin access — including the read-only SQL console.

This is a deliberate architecture choice for the hackathon demo and was assessed as
acceptable, with F1/F2 as compensating controls. Hardening options, if you want a
tighter posture after judging:

1. Drop `DEBUG=true` outside a demo window.
2. Bind `cscm-backend` to private networking so only the gateway/dashboard can reach it.
3. Replace the shared-secret JWT minting with a dedicated least-privilege
   `dashboard-readonly` role instead of full `admin`.
4. Gate the control plane on a source-IP allowlist in addition to the JWT.

---

## Verified controls (no action needed)

- **JWT handling** — algorithm pinned to HS256, issuer `cscm-backend` and audience
  `cscm-api` verified; `alg: none` rejected. No default signing secret; the gateway
  throws at boot in production if `JWT_SECRET` is missing rather than falling back.
- **Passwords** — bcrypt cost 10, per-account lockout on repeated failure,
  identical error for unknown-user and wrong-password (no enumeration), failed
  attempts recorded even for nonexistent users.
- **Rate limiting** — four layers (global, per-user, auth-specific, advanced) with
  `trust proxy` set to 1 so Render's hop is counted without trusting client headers.
- **CORS** — strict allowlist, not `*`; origin-less server-to-server traffic allowed
  by design for the gateway→backend topology.
- **Security headers** — HSTS with preload, `X-Frame-Options: DENY`,
  `nosniff`, and a restrictive CSP on backend, gateway and dashboard alike.
- **Dependencies** — `npm audit`: 0 vulnerabilities in `backend`, `dev-dashboard`, `App`.
- **SQL console** — read-only; blocks stacked statements, data-modifying CTEs,
  `COPY`, comment-hidden keywords; 500-row cap; params bound, never interpolated.

## Residual risk and honest limitations

- Ownership is derived from a **username convention**, because the `users` table
  has no store association. This is a mitigation, not a real identity model. The
  correct fix is a `store_id` foreign key on `users` and a `storeId` claim minted at
  login; the middleware already prefers that claim when present, so the migration
  can land later without another auth change.
- **Legacy accounts** (`shopkeeper`, `wholesaler` — no numeric suffix) resolve to no
  store and are now correctly denied by the fail-closed guard. If the demo needs
  them, give them a `storeId` claim rather than relaxing the guard.
- The authorization tests could not be run to green locally: the suite attempts a
  real Postgres/Redis connection and this machine's network blocks it. Verified
  baseline-before-change was **5 failed / 2 passed** and the same failures persist
  after, so they are environmental and pre-existing, not regressions. The 5 new
  security tests pass because they assert 403s and never reach the database.
- `npm audit` reflects advisories known at audit time; run it again in CI.
