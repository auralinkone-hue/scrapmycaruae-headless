# Mohammed Bin Zayed City — staging QA

- Route `/locations/abu-dhabi/mohammed-bin-zayed-city/`; exact requested title, canonical, H1, hero description and feature points.
- Actual rendered checks: 390 / 430 / 768 / 1024 / 1440px. No horizontal page overflow, clipped copy, overlaps or photo captions.
- Two-line heading at all checked widths. Phone order: heading → description → QuoteForm → feature points.
- Desktop recovery feature 461.6px; community MPV feature 460px. Phone photos 233–261px; tablet photos approximately 477px.
- Full main vehicles visible; original photo proportions retained using contain within subtle green rounded frames.
- Phone guide links: two columns, 44px minimum height; tablet/desktop minimum 48px. Labelled icon pills, light-green secondary guides and strong primary CTAs.
- Wix makes/years loaded; Nissan selection enabled the model dropdown. No form submitted. Shared QuoteForm, validation, CMS and WhatsApp functionality unchanged.
- Native coverage expander opens by click and closes by Enter; focus-visible confirmed. Second FAQ opens.
- Abu Dhabi MBZ coverage expander CTA followed successfully to child page; area navigation also points directly to child. Nearby links use published Abu Dhabi, Musaffah, Khalifa City parent panel and UAE hub.
- Rendered SEO: one H1; four-entry BreadcrumbList; FAQPage matching eight visible FAQs; staging noindex,nofollow. No LocalBusiness. MBZ absent from global dropdown.
- Sitemap route registered through existing indexableStaticRoutes architecture.
- Existing CSS/IntersectionObserver motion retained; reduced-motion CSS and script guards reviewed in source. System preference not emulated.
- 145 tests passed, staging build passed, git diff --check passed.
- Application workflow 39402454200 succeeded. Final QA documentation deployment reported in completion response.
