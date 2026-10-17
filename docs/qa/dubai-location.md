# Dubai location page QA

Application commit: `d460e6ab4389ea260449877c4aca7bb353185e47`.
Initial staging workflow: [39068212882](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39068212882), successful.
Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/dubai/

## Responsive and visual checks

| Width | Heading | Horizontal overflow | Captions | Layout |
| --- | --- | --- | --- | --- |
| 390 | 2 lines | None | 14px, dark on white | Heading, description, form, feature points; photo space above readable overlay |
| 430 | 2 lines | None | 14px, dark on white | Recovery photo above floating white checklist; no clipped controls |
| 768 | 2 lines | None | 14px, dark on white | Single-column hero; expanded coverage panel, two-column supporting notes |
| 1024 | 2 lines | None | 14px, dark on white | Balanced side-by-side hero and form; compact desktop information layout |
| 1440 | 2 lines | None | 14px, dark on white | Full-width automotive scenes, legible gradients, floating recovery panel |

Rendered DOM checks found no out-of-bounds headings, paragraphs, captions, summaries, buttons or pill CTAs at any width. Every shared CTA has a visible label and icon. Both 1440 × 960 WebP assets loaded after scrolling. Image crops and text contrast were visually inspected on mobile and desktop. The final wording refinement changes the area introduction and labels the expansion control “More Dubai areas”.

## Interactions

- ArrowRight selects and focuses Neighbourhoods from Industrial & yards.
- End selects City & coast; Home returns to Industrial & yards.
- Exactly one panel remains visible; hidden panels use `display: none`.
- City & coast and Neighbourhoods extra-area lists expand correctly.
- Ras Al Khor guide button opens the matching details, updates the hash and focuses its summary; Enter closes it.
- UAE hub Dubai button navigates to `/locations/dubai/`; return navigation works.
- Selecting TOYOTA enables the Wix-backed model control, displaying 31 available models. No enquiry submitted and no Wix records written.
- Desktop image hover transform reached scale 1.075; scroll progress updated and revealed content reached opacity 1. Desktop parallax is capped at 12px. Reduced-motion handling and no-JavaScript readability were reviewed in the CSS and shared script; system motion preference was not changed during QA.

## SEO, content and checks

- Exact requested title, meta and production-domain canonical; staging robots remain `noindex,nofollow`.
- BreadcrumbList and FAQPage only; nine rendered questions match the FAQ data. No invented LocalBusiness branch schema.
- Sitemap manifest includes the route once. Existing UAE hub now links to Dubai.
- All 40 existing Dubai areas retained once; requested Ras Al Khor and Jebel Ali added. Future child destinations use same-page guides, with no links to unbuilt routes.
- All requested service destinations exist in the project.
- `npm test`: 102 passed, 0 failed.
- Staging environment `npm run build`: passed after final copy refinements.
- `git diff --check`: passed.
- Work and branch writes limited to development. Deployment uses the existing development preview workflow with staging quote collection and analytics disabled.
