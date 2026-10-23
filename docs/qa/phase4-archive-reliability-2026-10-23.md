# Phase 4 — targeted blog archive reliability repair

23 October 2026 (Asia/Karachi). Branch: `development`. Baseline: `ccf69da9108cb3c69707ac99cb51b6d9e72d2dbf`.

## Root causes and corrected behavior

| Defect | Root cause | Previous behavior | Corrected behavior |
|---|---|---|---|
| A: failed pagination redirected | Failure left totalCount at zero; the out-of-range redirect ran regardless of query success. | Page-2 retrieval error became 302 to `/blogs`. | Essential retrieval failures return 503 with `Retry-After: 60`, `Cache-Control: no-store` and noindex; invalid-page redirects run only after a successful validated response. |
| B: failed category showed all posts | Category failure left activeCategory undefined; the post query then ran without its filter. | A requested category could display an unfiltered HTTP-200 archive. | Requested-category failure returns 503 and makes **zero post queries**. Valid category filtering is retained and mismatched returned category records are rejected. |
| C: malformed response looked empty | Parser replaced missing/non-array posts with an empty array and missing totals with array length. | Malformed essential data produced an empty HTTP-200 page or misleading redirect. | Validate the list, essential slug/title/category fields and finite nonnegative integer total. Invalid data throws into the controlled 503 path. Valid empty lists with total zero remain successful. |

No retries, SDK calls, query limits, sorting changes, packages or architectural layers were added. Normal requests still make one category-list lookup and one post query; a failed required category lookup stops before the post query.

## Deliberately preserved semantics

- Confirmed absent category in a valid category list: existing intentional 302 to `/blogs`, without querying posts. No new category redirect or permanent URL change.
- A failed **collection query**, including an API 404, does not prove that a particular category or archive page is missing; it returns 503. The single-resource classifier is therefore not used to turn list-endpoint errors into resource 404s. Existing single-post/category/author missing-resource handling is unchanged.
- All Articles without a category filter may still show its valid posts when only optional category navigation fails; no requested filter is substituted. Filtered requests cannot use this fallback.
- Known categories with postCount zero remain valid when selected, even though empty categories are omitted from navigation. Their empty post lists render the legitimate category empty state.
- Successful invalid-page behavior, page offsets, query-string pagination, category filters, canonical `/blogs`, title and description are unchanged.
- Transient errors use the existing retry paragraph, hide the article grid, force robots/Googlebot noindex, and retain middleware error headers. They do not masquerade as an empty category or mark All Articles as the selected category after a failed filtered request.

## Files changed

1. `src/pages/blogs.astro` — validate category discovery; block unfiltered fallback for requested categories; return controlled 503s; gate invalid-page redirects; error-only rendering/noindex controls.
2. `src/lib/blog-archive-query.ts` — validate essential post/pagination data and optional requested-category consistency; return original Wix objects.
3. `tests/blog-archive-categories.test.mjs` — add real slug/title fields to the existing valid-response fixture so it matches the now-enforced essential record contract. Existing assertions retained.
4. `tests/blog-archive-failures.test.mjs` — **19 new mocked behavioral tests** executing the actual frontmatter, parser, layout SEO and middleware.
5. This separate readiness addendum. The original uncommitted audit is not edited or included in the commit.

## Executed verification

- Focused archive tests: **30 passed**, zero failed (19 new plus 11 existing).
- Complete `npm test`: **298 passed**, zero failed/skipped; previous baseline **279**.
- `PUBLIC_SEO_ENV=staging PUBLIC_SITE_URL=https://www.scrapmycaruae.com WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequestsStaging npm run build`: **PASS**. This is a local build, not a deployment.
- Behavioral cases cover page 1/page 2 success; HTTP 502/503/504, timeout and network failures; confirmed missing category; valid category filters; malformed categories, lists, records and totals; legitimate empty archives/categories; out-of-range pages; exact pagination links; zero extra requests/retries; original Wix object/image/link identity; error headers and noindex/canonical policy in both environment modes.
- Category-filter consistency is checked without locally filtering, inventing posts or making another query.
- Manual byte comparison against the baseline confirmed unchanged article-card rendering, archive scripts/styles, protected URL manifest, article mappings/post route, quote form/API/notifications, BaseLayout/SEO/middleware, robots/sitemap/routes, Wrangler/deployment workflow and both dependency manifests. All **588** protected URL lines remain unique and unchanged.
- `git diff --check`: PASS.
- The original `phase4-production-readiness-2026-10-23.md` SHA-256 remains `b04a758c4c2ca4bb48c18c90ddb06446b31015d3c2bea1e747f8f2bededf70fa`.

No live Wix outage injection, HTTP crawl, browser session, form enquiry, email or WhatsApp send was performed. Mock transports make no live Wix requests. Actual production/staging-host rendering of this new commit is not claimed verified because pushing/deployment is explicitly prohibited.

## Updated Phase 4 readiness assessment

The three confirmed archive control-flow/parser defects are **resolved locally with regression coverage**. This addendum updates their assessment without replacing the historical uncommitted audit. Deployment of this repair remains pending explicit approval; the existing staging Worker has not received this local commit.

**Production launch remains HOLD.** This repair does not diagnose or remediate historical Worker resource exhaustion/Wix upstream failures. Their CPU-versus-memory/network/rate-limit causes remain unproven; failure-matched, sanitized evidence is still needed. Production target isolation, bindings/permissions, rollback/artifact retention, legacy-route decisions, remaining UX/performance checks and owner content review remain separate release gates.

Remaining boundaries: optional All Articles category navigation and optional author/article enrichment retain their established graceful degradation. This parser validates essential archive fields, not every optional Wix field; no complete optional-data schema audit or new runtime profiling is claimed. Existing category query limits and live CMS permissions are unchanged. There is no confirmed remaining instance of the three repaired defects in the exercised paths.

Only a local commit is permitted. **No push, deployment, merge, main change, live Wix/CMS edit, DNS change, production setting/binding change or rollback action.**
