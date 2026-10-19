# Sharjah location page QA

Application commit: `76184150b3da96cec2d6a2f353eda0db9da8a38f`.
Successful initial staging workflow: [39242433030](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39242433030).
Verified direct preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/sharjah/

## Responsive review

The available cloud browser has no viewport override capability. A temporary staging-only responsive review page rendered the real Sharjah route in same-origin iframes at each requested width (1100px height). Measurements were taken inside each frame; the reported `innerWidth` matched each requested size. The temporary review route was removed before the final commit and is absent from the final build.

| Width | H1 lines | Horizontal overflow | Captions | Layout checks |
| --- | --- | --- | --- | --- |
| 390 | 2 | None | 14px, dark on white | Heading → description → form → feature points; labelled area tabs and readable collection panel |
| 430 | 2 | None | 14px, dark on white | Industrial image keeps vehicle, flatbed and technician context; copy below the image band |
| 768 | 2 | None | 14px, dark on white | Single-column hero, compact coverage guide and wide collection scene with inset panel |
| 1024 | 2 | None | 14px, dark on white | Desktop hero/form arrangement; controls and text stay within bounds |
| 1440 | 2 | None | 14px, dark on white | Wide photographic sections, balanced coverage panel and compact information layouts |

No out-of-bounds headings, copy, captions, summaries, buttons or pill CTAs were found. All shared CTAs have labels and icons. The inset collection panel ends before the caption begins at every checked width. Both optimized WebP assets loaded after scrolling. Visual review covered phone/tablet photo crops and desktop overlays, spacing and contrast. Screenshot evidence: `docs/qa/sharjah-desktop.jpg`.

## Interactions and motion

- Selecting TOYOTA enables the shared Wix model field. No valuation request was submitted and no Wix records were written.
- ArrowRight moves selection from Sajaa to Industrial Area; End moves to Al Nahda. Exactly one coverage panel is visible, hidden panels use `display: none`.
- The Al Nahda guide link selects its panel, updates the hash to `#al-nahda` and focuses the panel.
- FAQ expanders open correctly; the first question is open by default.
- All UAE locations returns to the hub; the hub Sharjah button points to and opens the new route.
- Desktop image hover reaches scale 1.075, scroll progress updates and revealed content reaches opacity 1. Desktop parallax remains capped at 12px.
- Reduced-motion and no-JavaScript readability reviewed in CSS/shared script. No system preference was changed. No animation dependencies were added.
- Computed body/copy typography inherits the existing Inter/system font stack.

## SEO and validation

- Exact title: Sell or Scrap My Car Sharjah | Free Valuation.
- Canonical: https://www.scrapmycaruae.com/locations/sharjah/.
- Sharjah-specific meta description and staging `noindex,nofollow` verified.
- Page schema: BreadcrumbList and FAQPage only. Nine questions rendered from the same data as the FAQ schema. No LocalBusiness or fabricated branch data.
- Sitemap manifest includes the route once. Hub links directly to Sharjah. All requested service destinations exist; no unbuilt child pages linked.
- Shared location data retains Al Sajaa Industrial Area and adds the explicitly requested Sharjah Industrial Area and Al Nahda. No other named areas or branch addresses invented.
- `npm test`: 108 passed, 0 failed after removing the temporary review route.
- Staging `npm run build`: passed after removing the temporary review route.
- `git diff --check`: passed.
- Branch writes limited to development. The existing preview workflow uses QuoteRequestsStaging and analytics disabled. Main, release, production, DNS and Wix production data were not changed.
