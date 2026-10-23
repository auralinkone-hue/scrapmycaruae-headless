# Phase 4 — Wix Blog temporary-error handling fix

23 October 2026 (Asia/Karachi). Development only. Baseline: `bf19a67b57acfd7d077df8b663fa369dc9cb2828`.

The pre-existing, uncommitted `phase4-production-readiness-2026-10-23.md` is preserved unchanged and excluded from this fix commit. Its historical findings remain the audit baseline, not a claim that this targeted repair closes all launch gates.

## Confirmed cause and correction

| Request path | Prior behavior | Corrected behavior |
|---|---|---|
| Category identity → category article list | Every caught failure became 404. A successful but malformed category response also became 404. | Confirmed missing identity stays 404; essential temporary/malformed responses become 503. A list failure cannot mark an already confirmed category missing. |
| Author slug/member-ID → public member identity → optional biography | Lookup swallowed all exceptions as null, which the route converted to 404. | Empty, successful member query or confirmed 404 stays missing. Other failures propagate to the route as 503; malformed identity/query responses are temporary failures. |
| Individual post → essential getPostBySlug → optional enrichment | Thrown upstream failures already used 503, but empty/malformed successful responses were treated as missing. | Malformed essential responses become 503; confirmed not-found status/code still gives 404. Valid Wix article records/rendering are unchanged. |
| Shared error classifier | A POST_NOT_FOUND code could override a contradictory explicit upstream status. | Explicit status takes precedence: e.g. HTTP 503 cannot become 404 through a conflicting error code. Existing code-only POST_NOT_FOUND handling remains. |

503 route responses use `Retry-After: 60` and `Cache-Control: no-store`, generic retry copy and noindex. Successful category/author metadata, canonicals, query budgets, UI and pagination are retained. No extra API calls, client scripts, dependencies, retries, cache or placeholder content.

Optional article bylines/category breadcrumbs/related/latest/catalogue enrichment still degrades without losing a valid article. Optional author biography and author-page article-list failure retain the existing usable profile behavior (200 after identity succeeds); these are not classified as missing resources. Genuine invalid author slugs are rejected locally without a request.

## Other callers traced, not redesigned

The same Wix client serves the archive, article/category/author pages, sitemap, homepage/latest/service-guide discovery and optional breadcrumbs. Archive essential query errors currently use 500; optional category loading is caught separately. The sitemap already uses 503/no-store with a 300-second retry after essential retrieval failure. Optional loaders use their established caught/settled fallbacks. These paths are not changed by this focused repair. Archive pagination/error masking and other audit observations are not silently represented as fixed.

## Verification

- Full suite: **278 passed, zero failed/skipped** (266 previous + 12 new tests).
- Staging build: **PASS**, with staging SEO, canonical production base and `QuoteRequestsStaging`.
- New tests execute actual category/author frontmatter, the real author loader and the essential post frontmatter against mocked Wix transports. Cases: HTTP 502/503/504, timeout, network error, malformed success, confirmed 404, empty valid author query, category-list failure after confirmed identity, valid empty lists, metadata/canonical preservation, optional degradation and error-state UI/noindex wiring.
- Existing tests retain protected-slug/link mappings, form/storage/email isolation, robots, sitemap and generated production/staging HTML checks. The old source-only malformed-post-as-404 assertion was corrected and replaced by behavioral route coverage.
- No application outage was induced in staging. Real failure response behavior is verified with isolated mocks, not claimed as live fault injection.
- Postdeployment limited HTTP checks and development workflow outcome are reported after deployment.

## Separate investigation: historical intermittent 503s

The retained October recheck evidence recorded 20 Cloudflare resource-limit 503 pages and 15 application upstream-failure 503s. Successful-only Worker diagnostics (12–70ms CPU) do not distinguish CPU from memory failure. Later bounded article samples recovered. The unused author biography request was already removed for bylines; this task adds no speculative performance change.

No authenticated Cloudflare observability connector is available here, and no Cloudflare token/account credentials are present in the process environment. No current failing Worker event or upstream Wix status/code was obtained. Therefore the underlying cause remains **unconfirmed**; this classification fix does not prove that outages are resolved or caused by Wix throttling, audit traffic, CPU, memory or a hosting plan. Failure-matched sanitized observability remains required. No paid-resource changes or full 588-blog crawl.

## Scope and release status

No Wix CMS/body/SEO edits, forms/enquiries, email or WhatsApp sends, production/main/DNS/configuration/secrets/PR #4 changes. The approved 588 slugs, 29 contextual mappings and row-20 skip, robots/sitemap/redirect configuration and successful page content are preserved. Development staging only. **Production launch remains HOLD** for the other recorded availability, configuration, UX and owner-review gates.
