# Pre-launch audit — 22 October 2026

## Decision: HOLD — production readiness is not yet established

This audit ran on `development` only. It found two confirmed implementation defects and fixes them without redesigning approved UI. A complete browser/responsive/accessibility/performance sign-off remains blocked. Do not treat successful unit tests or HTTP responses as proof that every interaction passed.

Audited starting commit: `3329c9205efd6bcd360dc7b54b946769957036b3` (includes the five latest Blog UI fixes). Development preview: https://smc-headless-worker.hussain-gscx.workers.dev/ . Fix deployment is triggered by the accompanying development commit; its GitHub Actions result is reported separately after push. Post-deployment HTTP/browser verification is pending the access limitations below.

No main/release branch, production Worker, DNS, production CMS data or live Wix page was changed. PR #4 was not merged or modified.

## Latest follow-up — lightweight reliability check

See `blog-lightweight-2026-10-22.md` and its before/after JSON evidence. Five sequential baseline article requests and two post-fix checks all returned valid 200 articles, with at least three seconds between requests and no retries. No resource/upstream errors were reproduced. The article-only unused author-biography request was removed; author-page biographies remain intact. All 213 tests and the staging build passed. Runtime commit `0399081b2ef2985129b75831e39039dd3eaf977a` deployed successfully (workflow 39760977879).

The historical failures below remain recorded, with CPU-versus-memory and exact upstream cause unconfirmed. This limited normal-browsing HTTP sample is encouraging but does not establish production readiness or a measured speedup. Per the revised task, no full crawl or stress test was repeated; the earlier recommendation for another 588-URL crawl is not an instruction for this lightweight follow-up.

## Follow-up — completed protected-blog recheck (22 October 2026)

**Decision remains HOLD.** The environment's server-side staging access recovered. All 46 original failures now return valid articles, but a completed 588-URL pass still had two unavailable articles. A later two-URL confirmation recovered both; this is evidence of intermittent availability, not a clean completed pass.

| Check | Result | Executed evidence |
| --- | --- | --- |
| Original 46 failures | PASS | 46/46 valid HTTP 200 on first attempts, no retries; 09:42:02–09:42:41 UTC. Per-URL timings, titles, canonicals and outcomes in `blog-url-recheck-2026-10-22-failed.json`. |
| All 588 protected URLs | FAIL | All 588 tested, none untested; 586 valid final 200, two final 503 after three attempts. 26 URLs recovered on retry. No 404 observed. Run 09:42:53–09:55:57 UTC. |
| Request pacing | EXECUTED | Three workers, globally spaced request starts at least 750ms apart, 30s timeout, at most three attempts, 2s/8s backoff, Retry-After respected (60s where supplied), maximum retry wait 120s. |
| Attempt-level results | FAIL / availability | 626 attempts: 591 HTTP 200 (five without article content, rejected and retried), 35 HTTP 503. Of the 503s, 15 were application responses with Retry-After: 60 / Cache-Control: no-store; 20 were Cloudflare “Worker exceeded resource limits” pages without application retry headers. |
| Later confirmation | PASS, limited | The two unresolved paths returned valid 200 on first attempts at 09:59:20 UTC using one worker. These separate results do not overwrite the failed complete pass. |
| Genuine missing negative control | PASS | `/post/prelaunch-recheck-genuine-missing-article-20261022` returned 404, “Article not found”, no article body and staging noindex. No placeholder or redirect. |
| Temporary-error status policy | PASS for observed application responses | All 15 observed application 503 attempts had the expected retry/no-store headers. Cloudflare resource-limit errors occur outside that route handling and did not supply Retry-After. |
| Worker diagnostic | INCONCLUSIVE root cause | Read-only sanitized Wrangler tail captured 15 successful article events, 12–70ms CPU, 322–846ms wall time; no failing event captured. Five explicit probes returned 200. CPU versus memory exhaustion cannot be inferred from successful events. Workflow 39759082902 succeeded. |
| Automated tests / staging build | PASS | 210 tests passed, zero failed/skipped; production-style staging build succeeded with `QuoteRequestsStaging`. |
| Staging deployment | PASS | Tooling commit `413790d544bb03cdd93050979ccc5583e46c139d`, workflow 39759082935 succeeded. Application code was unchanged from `805bc909d65a5877559aabb6938fcc347d158309`; accompanying evidence-only commit deploys the same runtime. |

### Unresolved paths from the complete pass

- `/post/maximizing-your-car-s-resale-value-tips-and-tricks`: three Cloudflare resource-limit 503s; 606ms, 677ms, 1774ms response times, 14,940ms total including pacing/backoff. Later valid 200.
- `/post/top-money-making-vehicle-parts-in-the-uae-what-scrap-dealers-pay-for`: three Cloudflare resource-limit 503s; 292ms, 458ms, 2103ms response times, 12,859ms total including pacing/backoff. Later valid 200.

No protected post is confirmed permanently missing. Every protected path returned a valid 200 across these checks, but **not all within one completed pass**, and recurring 503s remain unresolved. Do not mark the acceptance criteria or production readiness PASS.

### Investigation and changes

The earlier application fix correctly distinguishes temporary failures from missing articles; live responses now corroborate that policy. Current route inspection shows additional per-request Wix catalogue, author, category and related/latest-post work. Those are profiling candidates, not proven causes. No speculative runtime change, artificial redirect, content substitute, aggressive cache or Worker account-limit adjustment was introduced.

Added a reusable staging-restricted crawler, regression coverage for audit retry/body classification, and a read-only CI diagnostic that emits only public paths, status/outcome, timings and exception names. Request headers, credentials, query strings and raw runtime logs are excluded. Original crawl results remain intact below and in the evidence JSON.

**Remaining high-priority blocker:** capture a failing Worker event with its CPU/memory outcome and correlate safe upstream Wix status/code before selecting a runtime or resource-limit remedy. Then repeat all 588 with controlled pacing. The exact upstream failure cause and CPU-versus-memory limit remain unproven; successful diagnostic requests cannot settle them. The browser, accessibility, performance and production-configuration limitations of the original audit remain open.

Detailed artifacts:

- `blog-url-recheck-2026-10-22-all.json`: every protected URL, attempt status, response time, retry delay, canonical/title and final outcome.
- `blog-url-recheck-2026-10-22-failed.json`: original 46 independently rechecked.
- `blog-url-recheck-2026-10-22-confirmation.json`: later two-URL recovery, kept separate.
- `blog-url-recheck-2026-10-22-controls.json`: genuine missing control and all observed application 503 headers.
- `blog-url-recheck-2026-10-22-worker-diagnostics.json`: sanitized tail/probe results and workflow reference.

Times measure complete fetch/body response, not isolated origin TTFB or Core Web Vitals. The full-crawl process predates the more specific resource-error classifier; its retained raw titles identify all 20 Cloudflare resource errors even where the historical classification reads `temporarily-unavailable`.

## Original audit record (historical results and limitations)

## Executed checks

| Area | Result | Evidence and limits |
| --- | --- | --- |
| Complete automated suite | PASS | `npm test`: 207 passed, zero failed/skipped; includes six new regression cases for the two fixes. Baseline latest-development suite had 201 passing tests. |
| Production-style staging build | PASS | `PUBLIC_SEO_ENV=staging PUBLIC_SITE_URL=https://www.scrapmycaruae.com WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequestsStaging npm run build`. Compiled Worker/client output succeeded. No production build was deployed. |
| All 51 indexable static routes | PASS (HTTP/SEO) | Existing `seo:qa` executed against staging. All 51 passed HTTP 200, title, description, exactly one H1/canonical, expected canonical URL and staging robots meta. Includes all 10 makes, 18 location detail pages, service pages, hubs and general pages. Visual/interaction coverage is separate. |
| Compatibility redirects | PASS | Executed 301 checks for `/blog` → `/blogs` and `/privay-policy` → `/privacy-policy`; destinations match the route manifest. |
| Staging sitemap | PASS | Live staging sitemap correctly returned 404 with noindex. This is intentional; it is not a broken published page. |
| Production safety checks | PASS (configuration tests) | Production deployment guard rejects staging; accepts only the explicit canonical production URL/environment. New header regression test verifies production does not receive the staging rule. Production sitemap response and DNS cutover were not executed. |
| Protected migration URLs | FAIL / RECHECK REQUIRED | Initial crawl fetched every one of 588 manifest paths: 542 returned 200 and 46 returned 404. Two failures subsequently returned 200 on an independent recheck. All 588 still exist among the 591 current published Wix posts. The evidence JSON lists every initially failing URL. Their complete post-fix recheck is blocked. |
| Complete initial HTTP crawl | PARTIAL | 646 URLs fetched: 598 HTTP 200, 48 HTTP 404. The 48 consist of 46 protected articles, the intentionally nonexistent test route, and the intentionally disabled staging sitemap. The crawler followed redirects; status counts do not prove redirect code correctness (covered separately). |
| Rendered SEO and schema sample | PASS (104 pages) | Second crawl parsed 104 successful HTML documents: no missing titles/descriptions/noindex meta, no duplicate/missing canonical, no multiple/missing H1, no JSON-LD parse errors. It parsed one intentional 404 too. Later network tunnel denial prevented 555 requested fetches; these are access failures, not site HTTP failures. |
| Wix SEO parity | PASS (64 rendered posts) | Separate `getPostBySlug` calls with SEO fieldset confirmed exact title, description and canonical agreement for all 64 successfully parsed articles, with no API errors. This is current Wix data comparison, not a complete re-crawl of historical live Wix HTML. |
| Wix content parity examples | PASS | Existing `validate-blog-parity.mjs`: 10/10 articles passed title, retained slug, rich content, SEO fallbacks and cover checks. |
| FAQ schema matching | PASS (34 documents) | Every checked FAQ question and answer matched the rendered HTML text outside script/style elements. Schema parsing and content matching are not a Google Rich Results validation. |
| Images and anchors | PASS (sample/local existence) | 243 unique image source URLs found; all 87 local paths exist. No missing `alt` attributes, duplicate IDs or unresolved same-page fragment links in the 105 parsed documents. External CDN URLs, image decoding on every page, cross-page fragments and every responsive source variant are not fully verified. |
| Vehicle CMS catalogue | PASS | Read-only queries returned 64 active makes, 674 active models and 42 active years, each with `hasNext=false`. Current data is not being truncated by the 1,000-item query limit. |
| Homepage empty-form validation | PASS (browser) | Submit flagged make/model/year/name/phone, displayed error text and focused make. Selecting Toyota populated real CMS models; Camry and 2013 could be selected. |
| Successful form → WhatsApp | PASS (browser flow) | One synthetic `Staging Audit Test` submission using a reserved test phone reached the expected WhatsApp URL with matching make/model/year/name/phone after the form's confirmed-save branch. No WhatsApp message was sent. This demonstrates the API-confirmed save path; independent dashboard inspection of the exact CMS row, email acceptance and mailbox receipt remain pending. Test row was not deleted. |
| Duplicate/failure/email logic | PASS (automated), live fault injection PENDING | Existing tests cover loading, duplicate email claims, notification failures, configuration blocking and preservation of CMS success. No live provider outage or request timeout was induced. Raw HTTP API probes received Cloudflare 403/1010 rather than application validation responses; those probes are not counted as API validation passes. |
| Blog archive mobile More | PASS (390px browser) | More opened, the overflow category was readable and selectable, its query URL returned seven matching articles, and Escape closed the menu. No horizontal overflow observed in that tested category view. |
| Blog media and reading progress | PASS (sample browser) | Twelve archive image wrappers finished loading; inspected article images had no decoded failures. A below-fold lazy figure was still waiting as expected. Reading bar increased from 0 to about 0.0326 after scrolling 850px. Shimmer CSS/reduced-motion paths reviewed; a throttled first-load animation trace was not captured. |
| Desktop menus, mobile drawer, all page interactions | PENDING | Further browser actions stopped when the permission check could not grant frame access. Share-dialog action was blocked, not shown to be broken. Desktop hover/bridge/closing, mobile drawer/back/focus trap, make explorers, pagination click-through and every CTA are not signed off by this audit. Earlier-turn checks are not substituted for current audit execution. |
| Responsive visual audit | PARTIAL / PENDING | 390px Blog category/article checks above ran. The complete mobile/tablet/desktop sweep across all templates did not run. No blanket responsive, alignment or spacing PASS is claimed. |
| Accessibility and console | PARTIAL / PENDING | H1/ID/alt/FAQ checks, form error focus and Blog Escape were executed. Full keyboard audit, screen-reader/contrast checks, console/network review and automated accessibility scan remain pending. |
| Performance / Core Web Vitals | PENDING | No Lighthouse trace, CrUX report, LCP/CLS/INP measurement or mobile CPU/network profile was executed. HTTP audit timings include proxy/TLS/CMS work (median 3.94s, p95 5.52s); they are not Core Web Vitals or isolated origin TTFB. |

## Confirmed fixes

### High — temporary upstream article errors became 404

The post route previously assigned HTTP 404 for every exception from Wix. During the initial crawl 46 protected article paths returned 404, while two independently rechecked paths subsequently returned 200. The exact upstream cause of those failures was not established; it must not be assumed to be rate limiting.

Added `blogLoadErrorStatus`: genuine Wix HTTP 404 / `POST_NOT_FOUND` stays 404; other statuses, network errors and malformed errors become 503. A 503 adds `Retry-After: 60` and `Cache-Control: no-store`, with a temporary-unavailability message. Regression tests cover 404, 401/403, 429, upstream 5xx and malformed/network errors. This fixes incorrect status classification, not upstream availability itself. The complete 46-URL live recheck is still required.

### Medium — static staging HTML lacked the noindex response header

Contact and FAQ HTML had correct noindex meta tags but lacked the dynamic middleware's `X-Robots-Tag`. Static assets can bypass Worker middleware. Added a build integration that writes a staging-only `/*` noindex rule to Cloudflare's generated `_headers`, preserving immutable hashed-asset caching. Production output is left unchanged. The built staging artifact contains the expected rule; live asset-header verification after deployment remains pending access recovery.

## Remaining issues by priority

| Priority | Status | Required action |
| --- | --- | --- |
| Critical | None confirmed; audit incomplete | No claim that unexecuted checks are safe. Do not launch on this report alone. |
| High | OPEN | Recheck all 588 protected URLs, especially the listed 46, against the fixed deployment. Investigate repeated Wix/upstream availability failures if any remain. A correct 503 is preferable to a false 404 but is still unavailable content. |
| High | OPEN | Finish browser QA across header menus, drawer/focus, all ten model explorers and make changes, pagination/categories, share/copy, cookie preferences, FAQs, CTAs and representative service/location/article templates at 360/390/430/768/1024/1280/1440px. |
| High | REQUIRED BEFORE CUTOVER | Confirm production-only SEO/Worker/collection/notification/analytics configuration in its own release process. This audit deliberately did not change those settings or PR #4. |
| Medium | OPEN | Obtain lab performance measurements and production field CWV once eligible; assess repeated per-page Wix catalogue/enrichment calls before adding any cache. No cache/TTFB improvement is claimed. |
| Medium | OPEN | Complete external link/image delivery checks, accessibility/contrast and console audit after browser/network access is restored. |
| Medium | MANUAL CHECK | Independently confirm the synthetic enquiry is only in `QuoteRequestsStaging`; inspect Brevo/D1 acceptance and delivery logs if staging-test notifications are enabled. No email arrival or Wix Inbox delivery is claimed. |
| Low | CONTENT SIGN-OFF | CMS review cards use generic “Customer feedback” attribution. Ratings exist in CMS, but provenance/authenticity was not independently substantiated. Business owner should confirm source and attribution before public launch; no reviews were fabricated or modified by this audit. |
| Low | ADVISORY | Shared icons depend on an external Phosphor stylesheet. Consider a later local subset if performance/availability testing demonstrates a problem; no icon redesign was made. |

## Production configuration checklist — no settings changed

- Keep this Worker and build on staging (`PUBLIC_SEO_ENV=staging`, `QuoteRequestsStaging`, analytics disabled). Never reuse a production enquiry collection for development tests.
- In a separately approved production release, verify `PUBLIC_SEO_ENV=production`, `PUBLIC_SITE_URL=https://www.scrapmycaruae.com`, the correct Wix client and `WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequests`. Then validate index/follow, dynamic sitemap and all protected URLs on the actual production hostname.
- Verify runtime Brevo key and verified sender secrets, production-isolated D1 binding/migrations and the intended notification mode before enabling live email. Staging `staging-test` subjects are prefixed `[STAGING TEST]` and target the configured test mailbox; no real customer notification was intentionally sent.
- Confirm consent-based GTM/GA4 configuration separately; staging analytics are intentionally disabled. This audit does not establish Wix dashboard pageview parity or Search Console migration completion.
- Independently verify Wix Inbox dashboard automation and delivery if required. No Inbox API or automation was invented or changed here.

## Access limitations and evidence

The browser reported that its permission request could not complete and frame access was not granted. Subsequent server crawl requests also encountered `Tunnel connection failed: 403 Forbidden`; these are environment-level denials, not evidence of a broken site route. No alternate browser, security bypass or repeated retry loop was used.

Raw page bodies, synthetic form data and credentials are not committed. Compact public evidence is in `prelaunch-2026-10-22-evidence.json`, including the exact 46 URLs requiring recheck. Fixes, tests and this report are committed on development; deployment outcome is supplied in the final audit response.
