# Ajman location page QA

Initial application commit: `a43a560909c9e37d96940147348f3bd4a54f4eec`.
Successful staging workflow: [39245619354](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39245619354).
Verified preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/ajman/

## Responsive review

The cloud browser has no viewport override capability. A temporary staging-only review route rendered the real page in same-origin frames at 390, 430, 768, 1024 and 1440px widths, each 1100px high. Measurements were taken inside each frame, verifying the actual inner width. The temporary review route was removed from the final source and build.

| Width | H1 lines | Horizontal overflow | Captions | Checked layout |
| --- | --- | --- | --- | --- |
| 390 | 2 | None | 14px, dark on white | Heading → description → QuoteForm → features; city coverage and readable expanders |
| 430 | 2 | None | 14px, dark on white | Vehicle/recovery context visible in both photo crops; inset handover panel stays above caption |
| 768 | 2 | None | 14px, dark on white | Single-column hero, broad workshop photo and stacked handover information |
| 1024 | 2 | None | 14px, dark on white | Balanced hero and form; bounded headings, controls and supporting copy |
| 1440 | 2 | None | 14px, dark on white | Wide photographic sections, compact mobility information and two-column handover panel |

No out-of-bounds headings, copy, captions, summaries, buttons or pill CTAs found at any width. Every CTA has a label and icon. The handover panel and caption bounds do not overlap. Both WebP images loaded after scrolling. Mobile/tablet crops, text contrast and desktop photo treatment were visually reviewed. The final collection-photo heading was shortened to avoid awkward phone line breaks. Screenshot evidence: `docs/qa/ajman-desktop.jpg`.

## Interactions and motion

- TOYOTA selection enables the shared Wix-backed model control; no enquiry submitted and no Wix records written.
- Workshop expander opens correctly. The Industrial yards guide opens its matching expander, changes the hash and focuses its summary. Enter closes the focused expander.
- FAQ expanders work; first question is open by default. This page uses native expanders, not tabs.
- Hub audit before implementation confirmed both Sharjah navigation links already point to `/locations/sharjah/`, with no old Sharjah anchor or tab.
- Final hub audit finds both Sharjah links correct and both Ajman links pointing to `/locations/ajman/`; no old Sharjah/Ajman anchors remain. The Ajman coverage link opens the dedicated route.
- Desktop hover zoom reaches scale 1.075; scroll progress updates and revealed content reaches opacity 1. Parallax is restrained to 12px and disabled on phones.
- Reduced-motion CSS and shared-script guards, plus no-JavaScript readability, reviewed. System motion preference was not changed. No animation dependencies added.

## SEO and validation

- Exact title: Sell or Scrap My Car Ajman | Free Valuation.
- Canonical: https://www.scrapmycaruae.com/locations/ajman/.
- Ajman-specific description and staging `noindex,nofollow` rendered correctly.
- BreadcrumbList and FAQPage only. Nine visible FAQs use the same data as schema. No LocalBusiness, invented branches, map pins, addresses or guaranteed collection times.
- Coverage derives only the existing Ajman city entry. Residential parking, workshops and industrial yards are collection settings, not invented neighbourhoods.
- Sitemap manifest includes the route once. Both hub entry points link directly to Ajman. All service routes exist, no unbuilt child routes linked.
- `npm test`: 111 passed, 0 failed after final copy refinement and review-route removal.
- Staging `npm run build`: passed after final copy refinement and review-route removal.
- `git diff --check`: passed.
- Writes restricted to development. Existing preview workflow uses QuoteRequestsStaging and analytics disabled. Main, release, production, DNS and Wix production data unchanged.
