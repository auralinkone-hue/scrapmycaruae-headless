# Lightweight blog reliability check — 22 October 2026

Starting branch/commit: `development`, `02514312d9546b8570bfdabbd1e5135cd69e4e3a`.
Target: https://smc-headless-worker.hussain-gscx.workers.dev/ . Development only; no production, DNS, CMS content, paid resources, hosting plan, main or PR #4 changes.

## Limited baseline

Five representative article URLs were fetched exactly once, sequentially, with a three-second pause after each response before starting the next. Both previously troublesome URLs were included. No retries, parallel requests, full crawl or stress test ran.

**5/5 returned HTTP 200 with real article content, expected production canonicals and staging noindex.** Response times were 4367, 691, 502, 399 and 448ms (median 502ms). These measure full response/body retrieval, including network; they are not isolated Worker CPU, origin TTFB or Core Web Vitals. The first slower response does not establish its cause. No resource-limit error or application 503 was reproduced. Normal sequential article loading appeared reliable in this limited HTTP sample; browser interaction was not tested.

Per-request timestamps, titles, canonicals, HTTP status, timing and Cloudflare Ray IDs are in `blog-lightweight-2026-10-22-before.json`.

## What the prior evidence establishes

- The previous full crawl recorded 20 Cloudflare-generated 503 pages explicitly titled “Worker exceeded resource limits”. Resource exhaustion is confirmed for those historical requests; CPU versus memory is **not** determined by that HTML.
- Fifteen other historical 503s were application-generated and had `Retry-After: 60` and `Cache-Control: no-store`. The route emits these when essential Wix retrieval throws a non-not-found error. This establishes a failed upstream retrieval path, not whether the cause was Wix throttling, a service outage, authentication or network transport. No safe error status/code was captured then.
- Existing sanitized Worker diagnostics captured only successful outcomes (12–70ms CPU, 322–846ms wall time). They do not identify the failure limit or prove that audit traffic caused the previous errors.
- Therefore, neither “the site is broken during normal browsing” nor “the audit alone caused all failures” is supported. Earlier failures remain genuine observations; this small pass does not erase them.

## Request-flow review and smallest safe change

| Work on an article request | Finding / action |
| --- | --- |
| Essential post retrieval | One `getPostBySlug` call; URL/SEO/rich content/text fields serve real metadata, article rendering and text fallback. Kept unchanged. |
| Author | Public member lookup supplies the visible name, photo and profile URL. It also fetched an About biography that the article never reads. **Confirmed unnecessary dependent API round trip removed for article bylines.** |
| Author profile page | Biography is displayed here. Its default loading behavior remains unchanged. |
| Category breadcrumb | Up to one category lookup, only when the post has a category. It supplies visible navigation and schema; kept. |
| Related articles | Up to four bounded eight-candidate facet/fallback queries; short-circuits once three valid recommendations are found. Not an unconditional four-query fetch. Kept; no demonstrated duplicate-query bottleneck established. |
| Latest articles | One bounded eight-candidate query supplies the distinct latest sidebar. Related and latest have different selection/SEO requirements; no speculative merging. |
| Vehicle catalogue | Visitor-token generation and three CMS collection queries provide all current makes/models/years to the shared sidebar QuoteForm. No duplicate catalogue load within the article route found. Kept complete and uncached. |
| Optional enrichment failures | Existing settled/caught loaders preserve article rendering if optional requests fail. Error status policy unchanged. |

`getBlogAuthor` now accepts `includeAbout: false` for article bylines. Other callers retain the default biography lookup. Behavior tests execute the real loader against a fake Wix client and confirm **two author-data calls become one**, with identical name/photo/slug, while author pages retain the biography. Invalid IDs still make no calls. This confirms avoidable work, not that this request caused the resource-limit incidents. No speculative cache, hidden retries, fake responses, added concurrency or plan changes.

## Verification and remaining uncertainty

- Automated suite: **213 passed, zero failed/skipped**; three new behavior tests make no HTTP requests.
- Staging build: **PASS**, with `PUBLIC_SEO_ENV=staging`, production canonical base, `QuoteRequestsStaging`.
- Post-deployment check: **2/2 passed**, one request per affected URL, sequential with a three-second pause. Both had article content, unchanged title/canonical and staging noindex. Times: 4477ms and 520ms versus 4367ms and 691ms before. This is not sufficient for a speedup claim. Per-request evidence: `blog-lightweight-2026-10-22-after.json`.
- Total staging article traffic in this task: **seven requests**, five before and two after; no retries or resource-limit errors.
- Runtime optimisation commit: `0399081b2ef2985129b75831e39039dd3eaf977a`; staging deployment [39760977879](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39760977879) succeeded. The subsequent report-only commit deploys the same runtime.
- Root cause: exact Worker CPU/memory limit and upstream error cause remain unconfirmed. No quantitative speedup or complete reliability claim from the small sample.
- Launch remains **HOLD** for unexplained historical resource/upstream failures and the previously outstanding browser/accessibility/performance and production-configuration checks. This task deliberately does not repeat the 588-URL crawl; its acceptance record remains historical.
