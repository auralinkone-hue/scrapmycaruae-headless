# Pre-launch audit — 22 October 2026

## Decision: HOLD — production readiness is not yet established

This audit ran on `development` only. It found two confirmed implementation defects and fixes them without redesigning approved UI. A complete browser/responsive/accessibility/performance sign-off remains blocked. Do not treat successful unit tests or HTTP responses as proof that every interaction passed.

Audited starting commit: `3329c9205efd6bcd360dc7b54b946769957036b3` (includes the five latest Blog UI fixes). Development preview: https://smc-headless-worker.hussain-gscx.workers.dev/ . Fix deployment is triggered by the accompanying development commit; its GitHub Actions result is reported separately after push. Post-deployment HTTP/browser verification is pending the access limitations below.

No main/release branch, production Worker, DNS, production CMS data or live Wix page was changed. PR #4 was not merged or modified.

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
