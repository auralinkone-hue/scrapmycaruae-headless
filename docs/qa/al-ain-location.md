# Al Ain location page QA

Initial application commit: `348b5471c66f814afaf89bacf329a78ba90609c1`.
Initial successful staging workflow: [39253594559](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39253594559).
Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/al-ain/

## Responsive checks

The cloud browser has no viewport override capability. A temporary noindex staging review route rendered the real page in same-origin frames at 390, 430, 768, 1024 and 1440px widths, each 1100px high. Measurements inside the frames verified each actual width. The temporary route was removed from final source/build.

| Width | H1 lines | Horizontal overflow | Captions | Layout |
| --- | --- | --- | --- | --- |
| 390 | 2 | None | 14px, dark on white | Heading, description, QuoteForm, feature points; readable photo/panels |
| 430 | 2 | None | 14px, dark on white | Comfortable controls, photo crops and workshop handover panel |
| 768 | 2 | None | 14px, dark on white | Broad collection photo, inset access tray, compact mobility content |
| 1024 | 2 | None | 14px, dark on white | Balanced hero, workshop photo and floating handover panel |
| 1440 | 2 | None | 14px, dark on white | Wide photography, four-column access notes and dark-green planning section |

No out-of-bounds headings, copy, summaries, captions, buttons or pill CTAs. Every pill CTA has an icon and label. Both photos loaded. The access tray and workshop panel remain above their respective caption bounds. Visual review covered contrast, spacing, phone/tablet crops and desktop composition. Final phone gradient refinement removes the visible edge of the collection-copy background without changing geometry. Screenshot: `docs/qa/al-ain-desktop.jpg`.

## Interactions and SEO

TOYOTA selection enables the shared Wix-backed model selector; no enquiry submitted or Wix records written. Workshop navigation opens the matching expander, changes the hash and focuses its summary. Enter closes it. FAQ expansion checked. This page uses native expanders rather than extra tabs.

Desktop reveals complete at opacity 1; hover zoom reaches 1.075; progress and restrained parallax update. Reduced-motion CSS/shared-script guards and no-JavaScript readability reviewed in source; system motion preference was not emulated. No animation libraries added.

Both Al Ain hub references point to `/locations/al-ain/`; coverage CTA opens the page. Requested title, production canonical and staging noindex/nofollow verified in DOM. BreadcrumbList and FAQPage only, with eight visible FAQs matching eight schema entries. Sitemap manifest includes the route once. All service destinations exist. Coverage derives from the existing Al Ain city entry; access settings do not invent district coverage or branches. No fake addresses, map pins, times or LocalBusiness schema added.

## Validation and scope

117 tests passed; staging build passed, including after the gradient refinement and QA-route removal. `git diff --check` passed. Development/staging only. Existing deployment workflow remains unchanged; no main, release, production, DNS or Wix production writes.
