# Khalifa City — staging QA

- Route `/locations/abu-dhabi/khalifa-city/`; exact requested title, canonical, H1, intro and feature points.
- Actual rendered checks at 390 / 430 / 768 / 1024 / 1440px. No page overflow, clipped text, overlaps or photo captions.
- Heading two lines at all checked widths. Phone hero order: heading → description → QuoteForm → feature points.
- Full main crossover and sedan visible in responsive green rounded frames; original photo proportions retained.
- Desktop recovery feature 461.6px. Community handover 477.1px at 1024 and 461.6px at 1440. Phone images approximately 233–260px.
- Six relevant condition links: two-column phone pills in three balanced rows, minimum 46px touch height; tablet/desktop minimum 48px. Light-green secondary links, labelled primary site CTAs with icons.
- Wix makes and years loaded; Toyota selection enabled model dropdown. No form submitted. QuoteForm, validation, CMS and WhatsApp functionality unchanged.
- Native coverage expander opens with pointer, closes with Enter; focus-visible confirmed. Second FAQ opens.
- Parent Abu Dhabi Khalifa City coverage CTA followed successfully; area navigation also links directly to child. Nearby links use existing Abu Dhabi, Musaffah, MBZ City and UAE hub.
- Rendered SEO: one H1, four-entry BreadcrumbList, FAQPage matching eight visible FAQs, staging noindex,nofollow. No LocalBusiness; child absent from global dropdown.
- Sitemap route added through existing indexableStaticRoutes manifest.
- Existing CSS/IntersectionObserver motion reused; reduced-motion CSS and script guards reviewed. System preference not emulated.
- 147 tests passed; staging build passed; git diff --check passed.
- Application staging workflow 39405314972 succeeded. Final QA documentation workflow reported in completion response.
