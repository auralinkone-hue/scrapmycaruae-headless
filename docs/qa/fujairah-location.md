# Fujairah location page QA

Initial application commit: `828dbf4475f6f60bed9706738019737f32092e5f`.
Initial successful staging workflow: [39255961606](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39255961606).
Verified preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/fujairah/

## Responsive review

The cloud browser has no viewport override capability. A temporary noindex staging route rendered the real page in same-origin frames at 390, 430, 768, 1024 and 1440px, each 1100px high. Each actual width was verified inside its frame. The temporary route was removed from final source/build.

| Width | H1 lines | Overflow | Captions | Layout |
| --- | --- | --- | --- | --- |
| 390 | 2 | None | 14px, dark on white | Heading, description, form, features; photo followed by inset white panel |
| 430 | 2 | None | 14px, dark on white | Readable controls, photo crops and compact industrial brief |
| 768 | 2 | None | 14px, dark on white | Floating photo panel, broad coverage guide and compact access notes |
| 1024 | 2 | None | 14px, dark on white | Balanced hero, wide industrial image and three-part site brief |
| 1440 | 2 | None | 14px, dark on white | Wide collection background, dark-green access section and two-column planning steps |

No out-of-bounds headings, copy, captions, summaries, buttons or pill CTAs. Every pill CTA has a label and icon. Collection panel/site brief stay above caption bounds. Both images loaded. Visual review covered crops, spacing, contrast and photographic treatment. Screenshot: `docs/qa/fujairah-desktop.jpg`.

## Interaction and motion

TOYOTA selection enables the shared Wix-backed model control; no enquiry submitted or Wix records written. Workshop guide updates the hash, opens its matching expander and focuses its summary. Enter closes it; FAQ expansion also checked. Native expanders used, no extra tabs.

Desktop reveals complete at opacity 1; hover zoom reaches 1.075; progress and restrained parallax update. Shared script limits parallax to 12px and disables it below 981px. Reduced-motion CSS/script guards and no-JavaScript readability reviewed in source; system preference not emulated. No animation libraries added.

Both Fujairah hub references point directly to `/locations/fujairah/`; the coverage CTA opens the page. No obsolete Fujairah anchor remains in hub navigation.

## SEO and scope

Requested title, production canonical and staging noindex/nofollow verified in DOM. BreadcrumbList and FAQPage only, with eight visible FAQs matching eight schema entries. Sitemap route appears once; internal service routes exist. Coverage derives only from the existing Fujairah entry. Parking-setting guides do not invent district coverage or branches. No fake addresses, map pins, collection times or LocalBusiness schema added.

120 tests and staging build passed, including after QA-route removal. `git diff --check` passed. Changes confined to development/staging; deployment workflow unchanged. Main, release, production, DNS and Wix production data untouched.
