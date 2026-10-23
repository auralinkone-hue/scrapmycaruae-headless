# Phase 4 — Minimal staging blog failure diagnostics — 23 October 2026

**Production HOLD. Local-only change; no push or deployment.**

Baseline: `4910f2b9dac731ff06e36abe1bb0bb75bf53314e`, branch `development`.

## Historical evidence and access

Ran one local `wrangler whoami` check: no authenticated Cloudflare session. Historical GET blog invocation logs for **22 October 2026, 14:45–14:56 PKT / 09:45–09:56 UTC** could not be retrieved here. No repeated access attempts, diagnostic workflow dispatches or website probes occurred.

No additional failure-matched evidence was obtained. The preceding investigation recorded 20 Cloudflare resource-limit pages and 15 application-generated 503s, timeline-correlated with `805bc909` / Worker version `de3f2424…`. CPU versus memory, subrequest limits and actual Wix/network failure causes remain unproven. Existing success-only diagnostics cannot establish their cause.

## Implemented diagnostics

A small server-only helper starts an operation timer and returns a best-effort failure recorder. It emits only when an existing catch calls it and only when the **compiled SEO environment is explicitly `staging`**. Production, missing and unknown environments are silent.

Instrumented operations:

- Article: essential post-by-slug retrieval and existing malformed-response validation.
- Archive: category navigation lookup and essential post-list retrieval/validation.
- Category page: category identity and essential category-post list, with separate operation timers.
- Author page: identity failures that propagate to the route and optional post-list failure. Existing confirmed-missing behavior is unchanged.

No successful operation emits a diagnostic. Expected missing identities returned as null/empty successful lookups are not artificially turned into exceptions or extra requests. Existing deeply caught optional author/category/related/catalogue helpers are not comprehensively instrumented; this is a minimal route-level diagnostic patch, not full tracing.

Example structured application record:

```json
{
  "event": "blog_load_failure",
  "operation": "post-by-slug",
  "routeType": "article",
  "responseStatus": 503,
  "upstreamStatus": 503,
  "classification": "upstream_http",
  "durationMs": 25
}
```

- Operation and route type are fixed allowlisted categories, never a slug, URL or query string.
- Numeric upstream status includes the installed SDK's `response.status` shape. Missing/invalid status is null, not an invented provider status.
- Response status reflects the response policy at that failure point. Optional failures can record 200; use the platform invocation for the final HTTP status if later work also fails.
- Classifications are fixed labels: not_found, rate_limited, authorization, upstream_http, timeout, aborted, network, invalid_json, malformed_response or unknown. An arbitrary TypeError is not assumed to be a network failure.
- No error object, exception message/stack, arbitrary provider code/body, credential, request header, customer data, phone, IP or raw query is serialized. Known messages/codes are used only to select fixed labels.
- Timer, extraction and synchronous/asynchronous sink failures are swallowed. No awaited logger/network call, retry, cache, extra Wix API call or changed response behavior is introduced.
- Application diagnostics can be absent when a platform CPU/memory termination aborts execution. They cannot replace platform invocation logs, CPU/memory outcomes or profiling.

## Validation executed

- Focused mocked diagnostics and actual-frontmatter regressions: **73 passed**, zero failed/skipped.
- Complete `npm test`: **369 passed**, zero failed/skipped (30 additional tests over baseline 339).
- Explicit staging `npm run build`: **PASS**.
- Existing `npm run deployment:verify -- staging --built`: **PASS**. Checks existing target, actual generated entrypoint, compiled `QuoteRequestsStaging` fallback, staging SEO/canonicals/noindex and route separation.
- Built-output inspection: diagnostic marker exists in a server module only; absent from client JS and HTML.
- Tests exercise actual article/category/author/archive frontmatter with real diagnostic factory and mocked Wix calls: success silence, SDK status, missing/malformed responses, optional degradation, unchanged 404/503/headers and request budgets, production silence, redaction and broken log sinks.
- Protected URL inventory, SEO helpers/metadata/templates, CMS integration, form/quote/notification handling, retry/cache behavior and deployment configuration are unchanged. No new dependency.

No live failure injection, form submission, crawl, stress test or new production-readiness claim.

## Exact files in this local fix

1. `src/lib/blog-failure-diagnostics.ts`
2. `src/pages/post/[slug].astro`
3. `src/pages/blogs.astro`
4. `src/pages/blogs/category/[slug].astro`
5. `src/pages/author/[slug].astro`
6. `tests/blog-failure-diagnostics.test.mjs`
7. `tests/blog-resource-failures.test.mjs`
8. `tests/blog-archive-failures.test.mjs`
9. `tests/blog-archive-categories.test.mjs`
10. `docs/qa/phase4-503-diagnostics-2026-10-23.md`

The original untracked readiness audit and preceding untracked investigation report/evidence are excluded from this fix. Original readiness-audit SHA256 remains `b04a758c4c2ca4bb48c18c90ddb06446b31015d3c2bea1e747f8f2bededf70fa`.

## Capture during the next failure — after separately approved staging deployment

1. In Cloudflare, select **smc-headless-worker → Observability**. Find the failing invocation by time and public route, and correlate its application `blog_load_failure` record. Application records themselves intentionally omit request identities; platform log context supplies correlation. No synthetic load is required.
2. Retain sanitized invocation timestamp, final HTTP status, outcome (`exceededCpu`, `exceededMemory` or actual other outcome), Worker version, CPU/wall duration, exception category and request/Ray correlation ID if available. Include subrequest/error details or memory metrics only if actually provided.
3. Retain the bounded application event above. Distinguish `responseStatus` from `upstreamStatus`; app HTTP 503 does not prove Wix returned 503. A null upstream status remains unknown. Do not export full provider bodies or request metadata containing sensitive fields.
4. Include current read-only CPU-limit/plan and sampling settings for interpretation. Do not raise limits or change plans.
5. If resource termination prevented an application event, use the platform outcome and a separately approved local profile. Do not infer CPU versus memory from the HTML error page or network duration alone.

Historical logs, if retained, should still be exported for the earlier 14:45–14:56 PKT window. No safe code patch can reconstruct missing historical CPU/memory/Wix status evidence.
