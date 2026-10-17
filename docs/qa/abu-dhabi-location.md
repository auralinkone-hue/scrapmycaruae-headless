# Abu Dhabi location page QA

Application after responsive photo refinement: `34fd6dab8a5292d307017d475b8061124b674254`.
Successful staging workflow: [39069631668](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39069631668).
Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/abu-dhabi/

## Responsive checks

| Width | Heading | Overflow | Captions | Main checks |
| --- | --- | --- | --- | --- |
| 390 | 2 lines | None | 14px, dark on white | Heading → description → QuoteForm → features; readable expandable coverage guides |
| 430 | 2 lines | None | 14px, dark on white | Revised residential photo band clearly shows car/operator/truck; Musaffah image and floating panel remain readable |
| 768 | 2 lines | None | 14px, dark on white | Single-column hero; coverage and photo bands; compact access and planning layouts |
| 1024 | 2 lines | None | 14px, dark on white | Balanced hero/form layout; no clipped labels or controls |
| 1440 | 2 lines | None | 14px, dark on white | Bottom editorial photo overlay; distinct dark-green industrial section with left floating white panel |

DOM checks found no out-of-bounds headings, copy, captions, summaries, buttons or shared CTAs. Every pill CTA has a label and icon. Both WebP assets loaded after scrolling. Measured site-panel and caption bounds do not overlap at any checked width. Mobile/tablet photo heights were refined after visual inspection to retain the vehicle/recovery context. The final desktop screenshot is saved as `docs/qa/abu-dhabi-desktop.png`.

## Interactions and motion

- Native coverage expanders work; Mohammed Bin Zayed City guide displays its community areas.
- Area navigation opens the matching guide, sets the URL hash and focuses its summary. Enter closes the focused summary.
- UAE hub Abu Dhabi link points to the new route; return navigation to the hub works.
- Selecting TOYOTA enables the shared Wix-backed model control (31 models). No enquiry was submitted and no Wix records were written.
- Desktop hover zoom reaches scale 1.075; scroll progress updates and revealed content reaches opacity 1. Parallax remains capped at 12px and disabled on mobile.
- Reduced-motion CSS/script behavior and no-JavaScript content readability reviewed; the system motion preference was not changed during QA. This page uses native expanders, not tabs.

## SEO and validation

- Requested title, production-domain canonical and Abu Dhabi meta description rendered correctly. Staging remains `noindex,nofollow`.
- BreadcrumbList and FAQPage are the only page schemas. Nine visible FAQs are generated from the same FAQ data as schema. No fake branch or LocalBusiness schema.
- All 13 existing Abu Dhabi location names retained exactly once in coverage groups.
- Sitemap manifest includes the route once; hub has a direct link. No unfinished child routes linked.
- All requested internal service destinations exist.
- `npm test`: 105 passed, 0 failed after image-layout changes.
- Staging `npm run build`: passed after image-layout changes.
- `git diff --check`: passed.
- Writes limited to development; staging deployment uses QuoteRequestsStaging with analytics disabled. Main, release, production, DNS and Wix production data were not changed.
