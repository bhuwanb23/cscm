# Node.js Backend — Issues & Gaps

> Generated: 2026-06-03
> Status: All original C1-C3, M1-M6, Q1-Q6, m1-m8 resolved across 16+ commits.

---

## Remaining

### LOW — jest.config.js references `babel-jest` which is not installed

**File:** `jest.config.js:9`

```js
transform: { '^.+\\.(js|jsx)$': 'babel-jest' }
```

No `.babelrc`/`babel.config.js` exists, and `babel-jest` is not in `package.json`.
Tests pass anyway because Jest falls back to its default transform for CommonJS files.
Remove the transform rule or install `babel-jest` + a babel config if ES module transforms
are ever needed.

---

### LOW — No test coverage for `GET /:storeId/:productId` and `PUT /:storeId/:productId/quantity`

**File:** `src/tests/api/inventory.test.js`

Missing tests for two inventory endpoints. The other 4 inventory operations are covered.

---

## Resolved (previous issues.md, all fixed)

| # | Issue | Fixed in |
|---|-------|----------|
| C1 | Agent supervisor `spawn` + IPC crash | `9e75fbb` |
| C2 | Redis v3 → v4 API incompatibility | `eba09ed` |
| C3 | Babel-jest missing (mitigated) | — |
| M1 | No Python AI/ML bridge | `3136a84` + `428a7f5` |
| M2 | Auth was complete mock | `a354d16` |
| M3 | No business API endpoints | `23fcd11` + `8796186` + `a9931e9` |
| M4 | Order/shipment model placeholders | `0ac3227` |
| M5 | Gateway proxies to dead services | `e81e516` |
| M6 | No API test coverage | `52cb70e` |
| Q1 | BaseApiService console.log | `1255ba2` |
| Q2 | checkPermission stub | `1255ba2` |
| Q3 | validateInput stub | `1255ba2` |
| Q4 | Misnamed clustering function | `1255ba2` |
| Q5 | KG no persistence | `1255ba2` |
| Q6 | MongoDB config | `ccb4f8e` |
| m1 | nodemon in deps | `9adb4e0` |
| m2 | No .env auto-copy | `9adb4e0` |
| m3 | README MongoDB refs | `9adb4e0` |
| m4 | linebreak-style Windows | `9adb4e0` |
| m5 | No Dockerfile | `9adb4e0` |
| m6 | No PM2 config | `9adb4e0` |
| m7 | gRPC proto dead code | `9adb4e0` |
| m8 | Config YAML stale | `9adb4e0` |
| — | Gateway pathRewrite bug | `428a7f5` |
| — | localStorage console.log | *(current commit)* |
| — | snake_case in inventory controller | *(current commit)* |
| — | .env.example missing vars | *(current commit)* |
