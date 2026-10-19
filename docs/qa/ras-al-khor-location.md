# Ras Al Khor staging QA

Route: `/locations/dubai/ras-al-khor/`

- Native browser checks at 390, 430, 768, 1024 and 1440px: two-line H1, no horizontal overflow or out-of-viewport text/buttons. Phone order is heading, description, QuoteForm, then feature points.
- Inspected recovery and automotive-yard scenes. Photos load at 1440px source width. Captions use 14px dark text on white. Mobile yard stage has no forced aspect ratio, keeping the complete information panel and caption in flow.
- All section CTAs have text labels and icons. Coverage expander opens with a click and closes with Enter; FAQ expander opens. Toyota selection enables 31 model choices plus placeholder. No enquiry submitted.
- Dubai area-guide link verified and followed to the child page. Parent expander and Al Quoz context also link to the published route. Global menu contains no Ras Al Khor child item; Dubai keeps its active style.
- Browser confirms requested title/canonical, staging `noindex,nofollow`, four breadcrumb levels and eight FAQ entries. No LocalBusiness schema.
- Hover zoom measured at 1.075; shared CSS/IntersectionObserver motion and desktop parallax used with source-reviewed reduced-motion guards. Viewport override reset after QA.
- 130 tests, staging build and whitespace check pass. Application deployment workflow 39297348302 succeeded for db13cd4ba148b8414787816f3eb9df1ddb3667cc.

Evidence: `ras-al-khor-desktop.jpg`. Image paths and final built-in imagegen prompts: `docs/assets/ras-al-khor-images.md`.
