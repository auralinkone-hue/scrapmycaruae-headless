# Umm Al Quwain location page QA

Initial page commit: 62a53a4a64ba1b62cf1c6a499de68a2cb61c7f1b.
Initial staging workflow: [39290406515](https://github.com/auralinkone-hue/scrapmycaruae-headless/actions/runs/39290406515), successful.
Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/umm-al-quwain/

## Native responsive QA

Browser viewport overrides tested the real page directly. No temporary QA route was added. The viewport override was reset after testing.

| Width | Height | Hero lines | Overflow | Captions |
| --- | --- | --- | --- | --- |
| 390 | 844 | 2 | None | 14px, dark on white |
| 430 | 932 | 2 | None | 14px, dark on white |
| 768 | 1024 | 2 | None | 14px, dark on white |
| 1024 | 1000 | 2 | None | 14px, dark on white |
| 1440 | 1000 | 2 | None | 14px, dark on white |

Phone order: heading, description, QuoteForm, feature points. No out-of-bounds headings, text, captions, summaries, buttons or pill CTAs at any width. Every pill CTA has a label and icon. The workshop handover panel stays above its caption. Both WebP images load. Visual review covered phone/tablet/desktop crops, contrast and section spacing. Screenshot: docs/qa/umm-al-quwain-desktop.jpg (normal desktop viewport after override reset).

## Interactions, navigation and motion

TOYOTA selection enables the shared Wix-backed model selector; no enquiry submitted or Wix records written. Workshop guide opens the matching expander, updates the hash and focuses its summary. Enter closes it; FAQ expansion checked. Native details used rather than additional tabs.

Both hub references point directly to /locations/umm-al-quwain/. The coverage CTA and desktop Locations item were followed to the page. Desktop menu has an active Locations category and UAQ aria-current=page item. Mobile includes UAQ after Al Ain with the correct href/active state and no out-of-bounds links. Back restores focus to Locations and Escape closes the drawer. Existing header interaction controller remains unchanged.

Desktop reveals settle at opacity 1; hover reaches scale 1.075; progress and restrained parallax update. Reduced-motion CSS/script guards and no-JavaScript readability reviewed in source; system preference not emulated. No new animation dependencies.

## SEO and scope

Requested title, production canonical, staging noindex/nofollow and BreadcrumbList/FAQPage verified in DOM. Eight visible FAQs use shared schema data. Sitemap includes the route once. All internal service routes exist. Project coverage supports UAQ at emirate level; collection-setting guides do not invent districts or branches. No LocalBusiness, fake pins, addresses or guaranteed times added.

125 tests passed and staging build passed. git diff --check passed. Changes confined to development/staging; main, release, production, DNS and Wix production data untouched.
