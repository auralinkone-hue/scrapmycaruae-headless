# Nissan manufacturer page QA

Date: 20 October 2026. Scope: `/cars/nissan/` on `development` only.
Preview: https://smc-headless-worker.hussain-gscx.workers.dev/cars/nissan/

## Result

PASS — distinct Nissan manufacturer experience, live catalogue integration, shared QuoteForm synchronisation, six condition states and advisory recovery readiness. No unresolved release-blocking issues found within this task's scope. Production was not deployed.

Implementation verified on staging at `0b5cc3fec13b2785332082f52d682371adf67e4e`. The subsequent report/screenshots commit does not change application code.

## Design and scope

- Charcoal staggered hero places the headline above the SUV, with the white form vertically balanced beside it on desktop. Mobile prioritises headline, intro, form and assurances before photography.
- A light condition studio precedes a white model directory; recovery prompts have a separate advisory section. Valuation factors accompany a second photograph. The journey is a compact vertical sequence; searchable FAQs use two desktop columns.
- This changes Toyota's hero composition, section order, condition treatment and model presentation without modifying Toyota, location layouts or global navigation.
- Shared `ManufacturerInteractions.astro`, `manufacturer-models.ts`, QuoteForm, quote API, Wix integration and WhatsApp handoff are reused unchanged. Nissan content and recovery logic are separate files.

## Responsive browser verification

Actual staging page inspected in Chrome at all requested viewport widths. Measurements use the viewport override; screenshots exclude browser scrollbars. Visual screenshots and DOM bounding checks were used together.

| Width | Result | Evidence |
| --- | --- | --- |
| 390 | PASS | Two-line H1; heading → intro → form → assurances → image. Submit bottom about 796px in an 844px viewport. Photos about 339×226px with complete vehicle framing. |
| 430 | PASS | Same conversion order; full-width make/model controls; year and name share a row. Photos about 379×253px. Mobile proof saved. |
| 768 | PASS | Full-width form avoids a narrow tablet column; two-line H1; no out-of-bounds main content. |
| 1024 | PASS | Desktop split, two-line H1, model control about 187px wide. Images about 512×341px and 489×326px, retaining complete vehicles. |
| 1440 | PASS | Staggered hero and balanced form; complete SUV about 678×452px. Secondary image about 597×398px. Desktop proof saved. |

No document horizontal overflow at any width. Condition controls are at least 54px high on phones; model choices are 47px high. Native controls and primary CTAs meet minimum touch sizes. No decorative image captions. Disclosure expansion intentionally changes content height; reserved image aspect ratios prevent image-loading shifts. All six condition results measured the same 535px panel height at 390px, avoiding selection jumps.

Reduced-motion safeguards were inspected in CSS and the shared interaction controller: reveal/transition effects are disabled and quote-anchor scrolling becomes instant. An OS-level reduced-motion override was not exercised in the browser tool.

## Live models and interaction results

The existing live Wix vehicle catalogue supplied 24 Nissan models. Preferred entries present: Patrol, X-Trail, Pathfinder, Sunny, Altima and Navara. Kicks was absent and is not displayed. Other available models remain selectable through the native all-model control, with safe general guidance. No body-type grouping was invented from names alone.

Verified through browser controls:

- Explorer Navara → form `NAVARA`; selected year `2016` preserved.
- Form `ALTIMA` → explorer Altima; year preserved.
- Full catalogue `URVAN` → form `URVAN`; generic guidance and accessible panel label update correctly; year preserved.
- Pointer selection of X-Trail works. Model Home/End and condition arrow wrap-around move focus and selection correctly.
- All six condition states update heading, checks and the correct published service destination. One selected tab and corresponding panel label are maintained.
- Rolling/keys/access set to restricted/missing update three practical recovery messages. Unit tests cover all 27 answer combinations. Answers are client-side only, outside the quote form, without new field names, network requests, storage or pricing/acceptance logic.
- FAQ search for `documents` returns one of eight questions. Keyboard expansion works. No-match state and clear-to-eight work.
- Valuation anchors return to the shared form and focus the next vehicle control without submission.
- Invalid phone `123` shows the existing UAE mobile validation and `aria-invalid=true`. No enquiry was submitted.

## SEO and links

- Exactly one H1: “Scrap Your Nissan Car in the UAE”.
- Title: “Scrap Nissan Car in UAE | Free Valuation | Scrap My Car UAE”. Unique 156-character description.
- One absolute canonical: `https://www.scrapmycaruae.com/cars/nissan/`.
- Staging meta robots verified `noindex,nofollow`. Production SEO configuration verification passes; existing production/staging policy tests pass.
- BreadcrumbList: Home → Scrap my car → Nissan, matching visible breadcrumbs. No unbuilt `/cars/` hub.
- FAQPage's eight questions and answers compared exactly with visible FAQ DOM: PASS.
- Existing sitemap architecture includes the manifest route once; production sitemap handler regression passes. Staging sitemap remains blocked with 404 and noindex.
- Existing SEO audit: **45 PASS, 0 FAIL**, including Nissan, existing routes, redirects and staging sitemap protection.
- Condition links resolve to published accident, engine, gearbox, non-running, flood and old-car guides. Contextual links use existing scrap-value, damaged-car, car-removal, locations and contact pages. No unbuilt manufacturer destinations.
- No LocalBusiness, invented office, manufacturer endorsement, fabricated price or collection guarantee.
- No duplicate IDs in the rendered main content; exactly one quote form.

## Photography

Two new built-in-generated scenes were visually reviewed: graphite Patrol-style SUV in warm outdoor forecourt light; silver Altima-style sedan from a rear three-quarter angle at a workshop in softer daylight. Distinct class, composition and environment; modest wear, no readable plates, text or marketing overlays. No Toyota photographs reused.

| Asset | 1440×960 | 960×640 | 640×427 |
| --- | ---: | ---: | ---: |
| `nissan-patrol-assessment` | 151,208 B | 82,746 B | 44,030 B |
| `nissan-altima-workshop` | 130,572 B | 72,840 B | 39,990 B |

All six assets are WebP in `public/sections/`. Both images have explicit dimensions, responsive srcset/sizes and descriptive alt text. Hero uses high fetch priority; secondary is lazy/async. Natural 3:2 frames with contain preserve the full vehicles. Both assets loaded successfully during browser QA. Prompts and generation method: `docs/assets/nissan-images.md`.

## Fixes during rendered QA

1. Dynamic model-check list items created by the shared controller lacked Astro scope attributes. Nissan's scoped parent now applies child styling through `:global`, restoring the intended flex spacing. Verified computed display `flex` and gap `9px` after model selection.
2. Desktop form alignment adjusted to centre within the staggered hero, reducing unused space below the form. Mobile reading order is preserved.

## Automated validation and deployment

- `npm test`: **165 passed, 0 failed**, including six focused Nissan regressions and existing Toyota/location/quote suites.
- Staging build: PASS after final application changes.
- Production-mode local build: PASS; no production deployment.
- `seo:verify-production`: PASS for the configured production origin.
- Staging `seo:qa`: **45 checks passed**, zero failures.
- Implementation workflow: https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39454106881 — SUCCESS.
- Final UI verification workflow: https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39455266167 — SUCCESS.
- Report/screenshots commit triggers the same existing development preview workflow. Its final SHA and workflow result are reported with delivery.

## Limitations and safety

No end-to-end enquiry was submitted, so this task does not claim a new live CMS-save/WhatsApp-delivery test. Existing automated quote regressions pass and integration code is unchanged. No production collections, analytics, DNS, main/release branches or production deployments were modified. No new dependency or infrastructure.

Proof: `docs/qa/nissan-manufacturer-desktop.jpg` and `docs/qa/nissan-manufacturer-mobile.jpg`.
