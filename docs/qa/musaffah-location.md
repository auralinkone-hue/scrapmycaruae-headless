# Musaffah location page — staging QA

- Route `/locations/abu-dhabi/musaffah/`; exact requested title, canonical, H1, description and feature points.
- Actual rendered checks at 390 / 430 / 768 / 1024 / 1440px. No page overflow, clipped copy, overlap or image captions.
- Two-line heading at all checked widths. Mobile order: heading → description → shared QuoteForm → points.
- Full main pickup and crossover visible. Images retain original proportions; contain treatment protects complete vehicle silhouettes in compact green frames.
- Desktop recovery feature 461.6px; handover 477.1px at 1024 and 461.6px at 1440. Phone photos 233–260px; tablet photos 477px.
- Mobile service pills: two columns, 44px minimum height; tablet/desktop 48px. Secondary navigation light green; primary CTAs retain labelled site pill styling and icons.
- Shared Wix vehicle data loaded; selecting TOYOTA enabled model dropdown. No form submitted, no production data written.
- Native coverage expander opens on click and closes with Enter; focus-visible confirmed. Second FAQ opens correctly.
- Parent Abu Dhabi CTA followed successfully to Musaffah; area navigation links directly to child. Nearby links point to existing Abu Dhabi, MBZ City/Khalifa City parent panels and UAE hub.
- Rendered SEO: one H1, four-entry BreadcrumbList, FAQPage matching eight visible FAQs, staging noindex,nofollow. No LocalBusiness; child absent from global dropdown.
- Sitemap registered through existing indexableStaticRoutes manifest.
- Existing CSS/IntersectionObserver motion reused. Reduced-motion CSS and shared script guards reviewed; system preference not emulated.
- QuoteForm, validation, Wix integration, WhatsApp handoff, shared header and motion component untouched.
- 143 tests passed, staging build passed, git diff --check passed.
- Application workflow 39400148319 succeeded. Final QA documentation deployment reported in completion response.
