# Sharjah Industrial Area — staging QA

- Route `/locations/sharjah/industrial-area/`; exact requested title, meta and canonical.
- Rendered checks completed at 390 / 430 / 768 / 1024 / 1440px. No page overflow, clipped text or captions.
- Two-line phone heading; description, QuoteForm, then feature points. Nissan make/model dependency enabled correctly; no submission performed.
- Phone guide links have two columns and 44px minimum height (48px at tablet/desktop). Secondary guides light green; labelled primary CTAs retain site styling.
- Desktop recovery and commercial photo features: 461.6px each; photo frames 460px. Phone photos 233–260px. Full main vehicles visible at checked widths.
- Distinct bronze SUV / blue commercial van WebP imagery. No repeated sedan scene or second recovery truck. Original proportions retained.
- Coverage expander opens on click, closes on Enter, focus-visible confirmed. FAQ second item opens correctly.
- Sharjah Industrial Area tab and its CTA followed successfully to child page; area navigation also points to child. Nearby links use published Sharjah, Sajaa, Al Nahda parent panel and UAE hub.
- Metadata verified in rendered page: one H1, BreadcrumbList with four entries, FAQPage matching eight visible FAQs, staging noindex,nofollow. No LocalBusiness. Child absent from global dropdown.
- Sitemap route registered in existing indexableStaticRoutes architecture; sitemap consumes this manifest.
- Reduced-motion CSS disables reveals, hover transforms and progress; shared IntersectionObserver/parallax skips reduced motion. Guards reviewed in source; system preference not emulated.
- Shared QuoteForm, validation, Wix integration, WhatsApp handoff, header and motion component unchanged.
- 141 tests passed; staging build passed; git diff --check passed.
- Application deployment workflow 39398272424 succeeded. Final documentation deployment reported in completion response.
