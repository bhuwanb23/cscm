<!-- Title: <imperative summary, e.g. "Add circuit breaker metrics to gateway"> -->

## What & why

<!-- What does this PR change, and what problem does it solve? Link issues with "Fixes #N". -->

## Changes

<!-- Bullet list of the meaningful changes. -->

-

## Verification

<!-- Check what you actually ran. CI runs all of these; local runs catch issues faster. -->

- [ ] `cd backend && npm run lint && npm test`
- [ ] `cd ai-ml && pytest` (if AI/ML touched)
- [ ] `cd dev-dashboard && npm run build` (if console touched)
- [ ] New/changed endpoints verified with curl or the Aurora console
- [ ] No secrets committed (`.env` files, tokens, real connection strings)

## Deployment notes

<!-- Env vars added? Secret pairing changes? Migration needed? Write "none" if not. -->
