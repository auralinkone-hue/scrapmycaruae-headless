# Focused desktop/mobile user experience QA — 22 October 2026

**Decision: HOLD — partial audit; remaining browser checks are pending.**

Starting commit: `4cc8b363c7a4ee09525337567d6d4ba879b3755a`, branch `development`. Target: https://smc-headless-worker.hussain-gscx.workers.dev/ . No production, main, PR #4, DNS or Wix content changes. No 588-blog crawl or stress test ran.

The connected Chrome browser initially supported navigation, screenshots, viewports and interactions. Later a screenshot after WhatsApp handoff stalled; returning to staging recovered enough to test BMW. The subsequent Sell My Car navigation stalled and browser session state reset. One reconnection attempt also stalled, so further page checks stopped. These are **browser-tool limitations, not confirmed site HTTP failures**. No bypass or alternate browser was used.

## Completed checks

| Check | Result | Observed evidence / limit |
| --- | --- | --- |
| Desktop header at 1440px | PASS, focused interactions | Sell My Car, Scrap My Car and Locations opened on hover. Trigger-to-panel movement retained the menu. Moving between groups kept only one open. Escape closed it. Keyboard Enter opened Scrap My Car with a visible 2.4px focus outline. Full Tab traversal remains pending. |
| Desktop click outside | PENDING | The intended outside target was covered by the open menu; Fleet Disposal navigation occurred. This is not a confirmed application bug or a click-outside pass. |
| Mobile drawer at 390px | PASS, focused interactions | Open → Scrap My Car → Choose a manufacturer → Back worked. Manufacturer choice was first. All ten SVGs loaded; names, correct hrefs and All car makes appeared. Measured manufacturer rows were 57px high. Escape closed and restored focus to Open navigation; body scrolling changed from hidden back to visible. |
| Mobile remaining navigation | PARTIAL | Sell My Car submenu opened. Its overview-link action later stalled. All manufacturer links were inspected, not individually clicked. Locations submenu and full focus-trap cycling remain pending. |
| Homepage empty form at 360px | PASS | All five required fields became aria-invalid with red styling; Make received focus. |
| Homepage vehicle selection | PASS | TOYOTA populated 31 real model options; CAMRY and 2013 could be selected. |
| Staging synthetic submission | PASS for application-confirmed save/handoff | One `Staging UX Audit` enquiry used a reserved UK test number. Saving disabled the button and showed its saving status. The browser reached the expected WhatsApp URL with matching vehicle and synthetic contact details. No WhatsApp message was sent. The exact CMS row/request ID and email/Inbox arrival were not independently inspected. |
| Submission limits | PARTIAL | API source and deployed workflow preserve QuoteRequestsStaging and save-before-handoff. The brief checkmark state was not directly captured; no repeat live submission or provider failure injection ran. |
| BMW make/model synchronization | PASS | Form preselected BMW. Switching to NISSAN populated Nissan models. Selecting the 5 Series explorer tab then set BMW / 5 SERIES, preserving 2013 and entered name/phone. No second enquiry was submitted. |
| Homepage/BMW viewport geometry | PASS, measured scope | At 360, 390, 768 and 1440px, document scroll width equalled client width. No completed visible image had zero natural width in those observations. Unreached lazy images are not counted as loaded. |
| Visual samples | PASS, sampled views | Homepage desktop hero and mobile invalid form; BMW mobile hero/form at 390px. BMW order was heading/description → form → image. No clipping or overlap was observed in those inspected views. This is not complete visual sign-off at all widths. |
| Console | PASS, limited sample | Error/warning log inspection after the homepage save/handoff flow returned no entries. No site-wide console-clear claim. |
| Automated suite | PASS | 213 passed, zero failed/skipped. |
| Staging build | PASS | `PUBLIC_SEO_ENV=staging PUBLIC_SITE_URL=https://www.scrapmycaruae.com WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequestsStaging npm run build`. |

Raw compact observations are in `ux-focused-2026-10-22-evidence.json`. No real customer details or credentials are included. One synthetic staging enquiry was created; it was not deleted. Notification receipt was not claimed.

## Required checks that did not finish

- Sell My Car and Scrap My Car page responsiveness and interactions.
- Representative location `/locations/dubai/` at all four widths.
- Blog archive/category More menu, pagination, individual article reading progress and image loading.
- Contact Us and Free Quote layouts, CTA click-throughs and field usability.
- Full homepage/BMW scroll-through, remaining interactive sections and all primary CTAs.
- Complete keyboard Tab order, focus trap, focus/contrast review and console coverage.
- Layout-shift measurement and lazy-image decoding. Geometry and screenshots are not a CLS trace.
- Independent inspection of the synthetic QuoteRequestsStaging row and notification delivery.

No confirmed functional/responsive defect was established in the executed subset, so **no UI or runtime fixes were made**. The report-only commit triggers development staging deployment of the unchanged runtime; its final SHA/workflow outcome is supplied with the delivery report. Production readiness remains unestablished, including the historical resource/upstream reliability uncertainties recorded in the prior audits.
