# Batch 2 location audit

Audit date: 20 October 2026. Branch: `development` only.

**Verdict: READY for Batch 3.** All 19 published location routes were audited. No unresolved Critical or High findings remain. This is a staging readiness assessment, not a production deployment or launch approval.

Application fixes: `3d0dd09098ea540ca30c55bef0e774effc9097f5` and `70b296958cce8ba49f002359b05a0a33bc81383a`. The latter deployed successfully through [development preview workflow 39431644355](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39431644355). The final report/evidence commit follows these application commits.

Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/

## Scope and route results

Paths below are relative to `https://www.scrapmycaruae.com`. They were tested on the equivalent staging host. FIXED means a targeted finding affected the route; PASS means no page-specific correction was needed. Shared navigation and guide styling were also checked across the section.

| Route | Status | Notes |
| --- | --- | --- |
| `/locations/` | FIXED | Compact mobile service guide pills; approved geographic layout retained |
| `/locations/dubai/` | FIXED | Compact mobile service guide pills; five child links verified |
| `/locations/dubai/al-quoz/` | FIXED | Compact photo features and mobile image containment |
| `/locations/dubai/ras-al-khor/` | FIXED | Compact photo features and mobile image containment |
| `/locations/dubai/jebel-ali/` | FIXED | Compact recovery/fleet features and non-overlapping mobile information |
| `/locations/dubai/dubai-investments-park/` | FIXED | Visible current breadcrumb matches schema name |
| `/locations/dubai/al-qusais/` | PASS | Compact reference layout preserved |
| `/locations/abu-dhabi/` | FIXED | Mobile guide pills; all three child links verified |
| `/locations/abu-dhabi/musaffah/` | FIXED | Nearby links point directly to published MBZ/Khalifa pages |
| `/locations/abu-dhabi/mohammed-bin-zayed-city/` | FIXED | Current breadcrumb and direct Khalifa City link |
| `/locations/abu-dhabi/khalifa-city/` | PASS | Residential compact reference preserved |
| `/locations/sharjah/` | FIXED | Mobile guide pills; both published child links verified |
| `/locations/sharjah/sajaa/` | FIXED | Correct 1440×810 intrinsic image dimensions; direct Industrial Area link |
| `/locations/sharjah/industrial-area/` | FIXED | Visible current breadcrumb matches schema name |
| `/locations/ajman/` | FIXED | Mobile guide pills; parent identity retained |
| `/locations/ras-al-khaimah/` | FIXED | Mobile guide pills; parent identity retained |
| `/locations/al-ain/` | FIXED | Mobile guide pills; parent identity retained |
| `/locations/fujairah/` | FIXED | Mobile guide pills; parent identity retained |
| `/locations/umm-al-quwain/` | FIXED | Mobile guide pills; parent identity retained |

## SEO and sitemap

- Live HTML: 19/19 direct HTTP 200; exactly one meaningful H1; unique non-empty titles and descriptions; one absolute canonical per page using `https://www.scrapmycaruae.com` and the correct route.
- Staging retains `noindex,nofollow`. The existing SEO CLI passes all 43 checks, including staging sitemap protection and existing compatibility redirects. No production deployment occurred.
- Production policy was executed locally for every location route: production host resolves to `index,follow`; preview hosts remain `noindex,nofollow`. The production configuration guard passes.
- The real sitemap handler was exercised with isolated read-only Wix fixtures: all 19 location URLs occur exactly once on the production origin, with no missing or duplicate location routes. Staging sitemap returns 404 intentionally.
- BreadcrumbList linked names/URLs and current labels match visible breadcrumbs. FAQPage questions and answers match the visible expandable content on all 19 pages.
- No fabricated location LocalBusiness schema was found. No conflicting canonical, new branch/address, collection guarantee or operating-hour claim was introduced.
- Search snippets may truncate long place names/descriptions; there is no fixed Google character limit requiring speculative copy changes. Unique and relevant metadata was retained.

## Internal links and navigation

- 39 distinct internal destination paths linked from the location section return direct HTTP 200 after fixes, including shared navigation/footer destinations.
- UAE hub discovers the eight published main location pages. Dubai discovers five children; Sharjah two; Abu Dhabi three. Every child links to its parent. No orphan location page was found.
- Nearby navigation and condition guides resolve to published routes. Remaining in-page setting links have real targets; they are useful expanders/coverage anchors, not `#` placeholders or unpublished child-page links.
- Replaced nearby parent-anchor shortcuts where a matching child is now published. Shared contact/FAQ/terms links now use their direct trailing-slash destinations instead of a redundant 307 normalization hop.
- Global Locations navigation remains the approved nine hub/parent items, with no individual sublocations added. Parent Locations remains clickable.
- Browser checks: desktop Enter opens Locations, Escape closes it and retains summary focus. Abu Dhabi stays highlighted on Khalifa City. Mobile drill-in, Back and Escape work at 390/430/768; Escape restores the opener focus. Sell and Scrap panels retain their existing contents and behavior.

## Responsive and visual QA

Actual rendered DOM measurements were collected twice: baseline and after deployment. Final evidence covers all 19 pages at all five widths, 95 samples total, using a 1000px-tall viewport. Screenshots and original image contact sheets were visually inspected during the audit, including the changed industrial features. Measurements are recorded in `batch2-location-responsive.json`.

| Width | Routes checked | Result |
| --- | --- | --- |
| 390 | 19/19 | PASS: two-line H1, description/form/features order; two-column service guide pills; no horizontal overflow |
| 430 | 19/19 | PASS: same phone ordering, readable labels and compact responsive spacing |
| 768 | 19/19 | PASS: tablet layout, navigation, guide layout and photo bounds |
| 1024 | 19/19 | PASS: navigation fits; compact child photos; readable side information |
| 1440 | 19/19 | PASS: desktop composition and balanced compact features |

No document horizontal overflow or audited controls below 44px were found in the final 95 samples. Secondary service pills use light green, minimum 46px height on mobile and consistent icon circles; primary actions keep the existing strong green treatment. All H1s measured as two lines at the tested widths. Phone hero order passed throughout.

The three older child implementations had oversized photographic features. Scoped CSS now contains the approved photos, keeps desktop useful information alongside them, and avoids negative panel overlap on smaller screens. Both features on Al Quoz, Ras Al Khor and Jebel Ali measure approximately 460px at 1024/1440. Mobile images use their natural 3:2 composition where changed, preserving the main vehicles. Parent photo sections were not forced into child dimensions.

The hub/Dubai planning list `scrollWidth` detector flags intentional connector pseudo-elements at tablet/desktop sizes. Text remains readable and document width does not overflow; these are not clipped-copy defects.

Each route's final FAQ was opened in the browser, 19/19 successfully. Coverage uses the existing accessible tab/expander architecture. Focus styles and keyboard/reduced-motion guards remain in place. Reduced motion was verified through CSS and observer early-return logic; the browser's OS media preference was not emulated. No animation library was added.

## Images and assets

- 39 unique section assets load successfully as WebP; network bytes matched the approved local files. Maximum asset size: 238,206 bytes (under 239KB).
- Intrinsic dimensions were compared with decoded WebP canvases. Sajaa's first image is 1440×810, not 1440×814; markup, existing regression expectation and asset documentation were corrected.
- Existing lazy loading and intrinsic sizing remain. Lazy images outside the viewport need not be loaded during a geometry sample; separate network checks verified their paths.
- Descriptive alt text is present. No illustrative image captions/figcaptions were found or added. Useful adjacent section copy is retained.
- Visual review of all assets found no reason to regenerate approved imagery. UAE workshop/residential environments and variation across sedans, SUVs, pickups, vans, hatchbacks, MPVs and crossovers remain. No apparent readable plates, manufacturer logos or baked-in text required replacement.
- The approved UAE geographic artwork remains a coverage illustration, not a set of fabricated branch pins. No new or larger images were added.

## QuoteForm and functional regression

PASS within the non-submission scope authorized for this audit:

- One shared QuoteForm per location route; no duplicate audited form/control IDs. Live make/year data available on every route (65 make options and 43 year options including placeholders).
- Browser interaction on all 19 routes: choose TOYOTA → enabled matching model choices → COROLLA → year 2016; enter invalid phone `123`, blur → `aria-invalid="true"`. All passed. No enquiry was submitted.
- Existing validation, dependency handlers, UAE phone validation and error messaging remain unchanged.
- Shared form, quote API, Wix field mappings and WhatsApp handoff code were not modified. Existing regression tests verify the CMS-save-before-WhatsApp contract, field mapping, fail-closed collection configuration and staging collection separation.
- Staging workflow continues to use `QuoteRequestsStaging` with analytics disabled. No production collection writes or analytics changes occurred.
- Live successful CMS submission/WhatsApp navigation was intentionally not executed. This report does not claim a new end-to-end enquiry was saved; architecture and automated regression evidence cover that unchanged path.

## Content and trust

Local names, industrial versus residential context, keys/mobility, permissions and handover wording were reviewed. Coverage stays within project data. No offices, branches, addresses, collection times or guaranteed prices were invented.

Some neighbouring pages share general FAQ explanations about keys, documents and assessment. These are consistent service facts, not duplicated local coverage sections. Local access/coverage content and all titles/descriptions remain differentiated; entire pages were not rewritten merely to change wording.

## Findings and fixes

Counts group related findings rather than counting repeated occurrences as separate issues.

| ID | Severity | Verified finding | Fix/files |
| --- | --- | --- | --- |
| H1 | High | Al Quoz oversized photo features/overlapping trade composition | Scoped compact desktop and image-first containment in `src/pages/locations/dubai/al-quoz.astro` |
| H2 | High | Ras Al Khor oversized recovery/trade photography | Scoped compact features in `src/pages/locations/dubai/ras-al-khor.astro` |
| H3 | High | Jebel Ali oversized recovery/fleet photography and small-screen panel overlap | Compact contained photos and fleet details in `src/pages/locations/dubai/jebel-ali.astro` |
| M1 | Medium | Legacy service guides used repetitive single-column mobile actions | Location-scoped secondary guide styles in `src/components/LocationsMotion.astro`; script unchanged |
| M2 | Medium | Sajaa intrinsic height did not match WebP canvas | Sajaa page, `tests/sajaa-page.test.mjs`, `docs/assets/sajaa-images.md` |
| M3 | Medium | Three shortened current breadcrumb names differed from schema | DIP, MBZ City and Sharjah Industrial Area visible breadcrumb labels |
| M4 | Medium | Nearby links used parent anchors despite published destination children | Musaffah, MBZ City and Sajaa contextual links |
| M5 | Medium | SEO CLI compared production canonicals against preview transport origin | `scripts/seo-route-audit.mjs` uses configured production canonical origin; fixture regression added |
| L1 | Low | Shared contact/FAQ/terms links incurred avoidable slash redirects | Destination spelling only in `src/components/SiteHeader.astro` and `SiteFooter.astro` |

Discovered: **Critical 0 / High 3 / Medium 5 / Low 1**. Fixed: **9**. Remaining blockers: **0**. No speculative refactor, redesign, dependency upgrade, image regeneration or unrelated service-page edits.

## Automated verification

| Check | Result |
| --- | --- |
| `npm test` | 152 passed / 0 failed / 0 skipped |
| Staging `npm run seo:qa` with production canonical origin | 43 PASS / 0 failures |
| `PUBLIC_SEO_ENV=production` build, analytics disabled | PASS locally; never deployed |
| Production SEO configuration guard | PASS |
| Staging build, analytics disabled | PASS |
| Deployed server HTML/schema/link audit | 19 routes, 39 direct internal destinations, 0 issues |
| Final rendered responsive measurements | 95 samples, 0 document overflows, 0 audited undersized controls |
| Live non-submitting QuoteForm checks | 19/19 PASS |
| Browser FAQ expansion | 19/19 PASS |

Added five focused tests in `tests/batch2-location-audit.test.mjs`: published route/manifest parity and parent discovery; WebP dimensions/size/no captions; real SEO policy on production and preview hosts; actual sitemap handler with isolated Wix fixtures; preview transport versus production canonical handling. Existing per-page, form, navigation and SEO tests remain in the suite. No new dependency.

Evidence: `batch2-location-server.json` contains live route metadata/schema status and destination results. `batch2-location-responsive.json` contains five-width geometry, hero ordering, guide heights and non-submitting form checks. These evidence files describe the audited application commit, not a production deployment.

## Remaining limits and readiness

No Critical/High issue remains open. Live CMS writes/WhatsApp launch, OS-emulated reduced motion, cross-browser certification and a production deployment are outside the executed checks. These limits are explicit; no production data was used as test data.

Batch 2 is **READY** to proceed to Batch 3 within the audited Astro/Wix architecture. Production, DNS, analytics configuration and release branches were not modified.
