# Phase 4 — Deployment safety and CI guardrails — 2026-10-23

**Verdict: HOLD. Local-only implementation; no push, deployment, remote configuration or real enquiry.**

## Preflight and preservation

- Branch: `development`; starting HEAD `7fa85d5e335e01a9f37106676db5451e03f105e0`, one commit ahead of `origin/development` (`ccf69da`).
- Executed requested status, last-three-commits, archive-commit stat and origin-to-HEAD name-status commands. No discrepancies.
- The archive regression tests, loader, route and supporting report are tracked and committed in `7fa85d5`: `tests/blog-archive-failures.test.mjs`, `tests/blog-archive-categories.test.mjs`, `src/lib/blog-archive-query.ts`, `src/pages/blogs.astro`, `docs/qa/phase4-archive-reliability-2026-10-23.md`.
- Original uncommitted `docs/qa/phase4-production-readiness-2026-10-23.md` remains untouched and excluded from this change. SHA256 before/after: `b04a758c4c2ca4bb48c18c90ddb06446b31015d3c2bea1e747f8f2bededf70fa`.

## Confirmed risk and correction

| Area | Before | After |
| --- | --- | --- |
| Targeting | Both deployment scripts ultimately used implicit `wrangler deploy` against the same root config. Production SEO verification did not separate targets. | Explicit manifest, environment, Worker and config must agree. Staging is restricted to existing `smc-headless-worker`; production entry is deliberately null and blocked before tests/build/upload. |
| Production approval | SEO mode could unlock production script using the staging target. | Independent owner-reviewed manifest entry with separate Worker/config and recorded approval reference is required; no production name or infrastructure created. |
| Build/upload separation | No generated-target check. | Astro adapter receives the explicit config path. Generated Wrangler name/source path and deployment redirect must match before upload; actual prerendered robots/Googlebot/canonical output and staging asset noindex headers are checked. |
| CMS | Staging runtime guard existed, but arbitrary syntactically valid collection names were accepted in production. | Build/deploy validators require exact environment collection; runtime validation requires exactly `QuoteRequests` in production and retains exactly `QuoteRequestsStaging` in staging. |
| CI | Build then upload; no automated test gate or explicit upload target. | Development-ref gate, source validation, tests, existing optional staging-ledger configuration, build, generated validation, explicit-target upload. Default sequential failure behavior; no failure bypass. |
| Analytics | Staging CI disabled it. | Existing setting retained and deployment guard rejects staging analytics enablement. |

No source changes to protected routes/slugs, canonical/metadata/robots/sitemap logic, archive fixes, quote route/form/notifications, dependencies, secrets or root Wrangler resources. `wrangler.jsonc` remains unchanged. No additional Wix API requests.

## Files changed

- `deployment-targets.json`: staging allowlist and deliberately unapproved production entry.
- `scripts/deployment-safety.mjs`: offline source and generated artifact validation.
- `scripts/verify-deployment.mjs`: check-only CLI.
- `scripts/deploy.mjs`: guarded command orchestration; all upload tests use injected mocks.
- `package.json`: supported deployment commands use the guard; check-only command added.
- `astro.config.mjs`: explicit adapter config selection.
- `.github/workflows/deploy-development-preview.yml`: tests, target validation, explicit staging target and branch gate.
- `src/lib/quote-collection.ts`: exact production runtime destination.
- `tests/deployment-safety.test.mjs`: 30 offline regression tests.
- `README.md`: operating requirements, blocked production pathway and runtime limitations.
- This additive report; original audit preserved.

## Executed validation

- Focused offline deployment-safety tests: **30 passed, 0 failed**.
- Complete `npm test`: **328 passed, 0 failed, 0 skipped** (baseline 298). Includes existing actual-generated-HTML production/staging SEO regressions and archive regressions.
- `npm run build` with explicit staging environment, existing public Wix client, canonical origin, analytics false, `QuoteRequestsStaging`, staging Worker/config: **PASS**.
- `npm run deployment:verify -- staging`: **PASS**.
- `npm run deployment:verify -- staging --built`: **PASS**, inspecting the actual local staging build.
- Offline production fixture validation: explicit approved fixture target passes; current real manifest has no production target and rejects it. No real production Worker name/config was added.
- Mocked orchestration proves test failure, build failure, source rejection and artifact rejection prevent upload; successful mocked sequence verifies explicit name/config immediately before mocked upload. No Wrangler deployment command was executed.
- CI inspected offline for gate order, explicit upload target, development-only ref and absence of failure bypass. Workflow execution itself is **NOT VERIFIED** and was not triggered.
- `git diff --check`: **PASS**. Protected SEO files, archive regression, quote route and lockfile unchanged against baseline.

## Remaining owner gates — production HOLD

1. Independently approve a separate production Worker target/account, repository-local config and approval reference through a reviewed future change. Provisioning and actual release need separate authorization.
2. Verify runtime bindings/secrets and target account permissions in Cloudflare. Offline validation cannot inspect encrypted dashboard values, remote D1 identity, Wix authentication/permissions, Brevo settings or collection existence. Runtime wrong-collection overrides fail closed rather than write to another environment.
3. Verify production `QuoteRequests`, staging `QuoteRequestsStaging`, any independently scoped notification ledger, required secrets, analytics/consent configuration and rollout/rollback ownership without copying staging resources into production.
4. Re-run the changed development CI only after separately authorized push. No evidence of a new remote deployment is claimed here.
5. Resolve or independently verify remaining availability, production-host SEO and rollback gates from the original readiness audit. This change does not establish a cause for intermittent upstream/resource-limit failures or authorize launch.

Repository entrypoints are guarded; a privileged direct Wrangler/API/dashboard operation can bypass repository scripts. Owner access controls and release approvals remain essential.
