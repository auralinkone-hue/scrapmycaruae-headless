# Ras Al Khaimah location page QA

Initial application commit: `f567f69bec3b0a167d899d49f71597aa16910cc5`.
Initial staging workflow: [39249024746](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39249024746), successful build and Cloudflare preview deployment.
Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/ras-al-khaimah/

## Responsive review

Cloud browser has no viewport override capability. A temporary staging-only, noindex review route rendered the real page in same-origin frames at the five requested widths, each 1100px high. All measurements were taken inside each frame and verified its actual inner width. The review route was removed from final source and build.

| Width | H1 lines | Horizontal overflow | Captions | Layout |
| --- | --- | --- | --- | --- |
| 390 | 2 | None | 14px, dark on white | Heading, description, form, then feature points; readable access panel and native expanders |
| 430 | 2 | None | 14px, dark on white | Comfortable controls and readable photo/caption treatment |
| 768 | 2 | None | 14px, dark on white | Broad hero/form; photographic background and inset white access panel |
| 1024 | 2 | None | 14px, dark on white | Balanced hero columns, photo overlay and compact mobility information |
| 1440 | 2 | None | 14px, dark on white | Wide commercial photo, site brief and horizontal planning process |

No out-of-bounds headings, paragraphs, captions, summaries, buttons or pill CTAs. All pill CTAs have labels and icons. The access panel stays above the caption. Both optimized WebPs loaded after scrolling. Visual review covered mobile/tablet photo crops, desktop composition, contrast and spacing. A final phone-only commercial-frame refinement uses a 3:2 aspect ratio with 240px minimum height to show more of the vehicle/recovery scene; desktop composition is unchanged. Screenshot: `docs/qa/ras-al-khaimah-desktop.jpg`.

## Interactions

- TOYOTA selection enables the shared Wix-backed model selector. No enquiry submitted or Wix records written.
- Outer-area guide updates the hash, opens the matching expander and focuses its summary. Enter closes it. FAQ expansion checked.
- Native expanders are used; no additional tabs or animation library.
- Both RAK hub references point to `/locations/ras-al-khaimah/`, and the coverage CTA opens the page. No old RAK anchor remains for hub navigation.
- Desktop reveal completes at opacity 1; image hover zoom reaches 1.075, progress updates and restrained parallax is active. Shared script bounds shift to 12px and disables parallax below 981px.
- Reduced-motion CSS/script guards and no-JavaScript readability reviewed in source. System reduced-motion preference was not emulated.

## SEO, scope and checks

Exact requested title and production canonical verified in the staging DOM. Staging robots remains `noindex,nofollow`. BreadcrumbList and FAQPage rendered, with eight visible FAQs matching eight schema entries. No LocalBusiness schema. Existing project data supports Ras Al Khaimah at emirate level; collection settings do not imply invented district coverage, branches, addresses, pins or fixed collection times. All service routes exist and the sitemap manifest includes the new route once.

After the phone-frame refinement and QA-route removal: `npm test` passed all 114 tests; staging `npm run build` passed; `git diff --check` passed. Development preview workflow remains unchanged, with staging enquiry collection and analytics disabled. Changes are confined to development/staging; no main, release, production, DNS or Wix production data writes.
