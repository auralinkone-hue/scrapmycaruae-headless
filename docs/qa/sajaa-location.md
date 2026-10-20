# Sajaa location page — staging QA

- Route: `/locations/sharjah/sajaa/`.
- Actual rendered checks: 390, 430, 768, 1024 and 1440px.
- Phone heading: two lines; description → shared QuoteForm → feature points.
- Desktop recovery feature: 461.6px; trade feature: 460px. Phone images approximately 219–245px; tablet images approximately 403px.
- Mobile guide links: two columns, minimum 44px touch height, labelled icon pills in light green. Primary actions retain site styling.
- Two distinct generated WebP scenes; no captions. Recovery asset retains its original aspect ratio.
- Vehicles, typography, spacing and image crops visually reviewed; no horizontal page overflow or clipped copy.
- Coverage native expander: pointer opens, Enter closes and focus-visible is present. FAQ interaction works.
- Shared Wix vehicle make/model dependency checked using TOYOTA; model enabled. No form submitted.
- Parent Sharjah coverage CTA followed to Sajaa; area navigation also points directly to child route. Industrial Area and Al Nahda link to existing parent panels.
- SEO: exact title/canonical, one H1, BreadcrumbList with four entries, FAQPage matching eight visible FAQs. No LocalBusiness. Staging noindex,nofollow.
- Sajaa absent from global Locations dropdown. Header, form and shared motion files untouched.
- Motion uses existing CSS/IntersectionObserver implementation; reduced-motion rules reviewed in source (system preference not emulated).
- Tests: 139 passed, 0 failed. Staging build passed; git diff --check passed.
- Initial application deployment workflow 39395964657 succeeded. Final commit/workflow reported in completion response.
