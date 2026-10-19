# Al Quoz staging QA

Page: `/locations/dubai/al-quoz/`

- Native browser viewport checks: 390, 430, 768, 1024 and 1440px. No horizontal overflow or clipped text; the hero heading uses two lines. Mobile order is heading, description, QuoteForm, then feature points.
- Recovery photo and distinct trade assessment photo inspected. Both load at 1440px source width. Captions are 14px dark text on white; floating trade panel stays above its caption.
- All section CTAs have labels and icons. Workshop access expander responds to pointer and keyboard; FAQ expander opens. Shared Wix make selector enables the model list (Toyota: 31 models). No enquiry submitted.
- Dubai parent guide opens the child route. Global navigation excludes Al Quoz; Dubai retains its active style on the child route without an incorrect page-current attribute.
- Browser metadata confirms the requested title/canonical, four-level BreadcrumbList and eight FAQPage entries. No LocalBusiness schema.
- Hover photo scale verified at 1.075; reveals and restrained parallax use the shared lightweight motion component. Reduced-motion protection reviewed in source.
- 128 automated tests passed. Staging build and whitespace checks passed. Initial staging workflow 39293324563 succeeded for d509362631aa56691af69e9c12cacae9f4a80989.
- Desktop browser evidence: `al-quoz-desktop.jpg`. Browser viewport override restored after QA.

Image prompts and optimized asset paths: `docs/assets/al-quoz-images.md`.
