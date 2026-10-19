# Jebel Ali and location caption QA

Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/dubai/jebel-ali/

Application commit: 216bb521223c6f965e935ca774c946d95dc50008. Staging workflow 39300907097 succeeded. Final QA evidence commit and its workflow are reported in the completion message.

## Caption audit completed before new page implementation

Inspected all ten existing pages recursively under `src/pages/locations/`, plus the UAE hub. Removed 23 decorative figcaptions and their CSS; single-track figure grids replace caption-dependent two-track grids. No replacement captions. These were explanatory image captions rather than legally necessary disclosures; useful operational information remains in the existing content.

| Existing page inspected and cleaned | Captions removed | Image elements / alt text |
| --- | ---: | --- |
| `src/pages/locations/abu-dhabi.astro` | 2 | Preserved |
| `src/pages/locations/ajman.astro` | 2 | Preserved |
| `src/pages/locations/al-ain.astro` | 2 | Preserved |
| `src/pages/locations/dubai/al-quoz.astro` | 2 | Preserved |
| `src/pages/locations/dubai/ras-al-khor.astro` | 2 | Preserved |
| `src/pages/locations/dubai.astro` | 2 | Preserved |
| `src/pages/locations/fujairah.astro` | 2 | Preserved |
| `src/pages/locations/ras-al-khaimah.astro` | 2 | Preserved |
| `src/pages/locations/sharjah.astro` | 2 | Preserved |
| `src/pages/locations/umm-al-quwain.astro` | 2 | Preserved |
| `src/pages/locations.astro` | 3 | Preserved |

A source comparison verified existing image elements unchanged and non-parent pages changed only through caption removal and dependent CSS. The Dubai parent also gains the requested child links. All eleven existing pages were opened on staging and checked for zero figcaptions, zero decorative caption text and no horizontal overflow. Images and descriptive alt text remained present. Additional visual checks covered Abu Dhabi's industrial frame, Al Quoz's mobile trade panel and the UAE hub's mobile access image. Existing image assets were not changed.

## Jebel Ali responsive and functional QA

Native browser inspection at 390, 430, 768, 1024 and 1440px: two-line heading, no horizontal overflow or out-of-viewport text/buttons. Phone order is heading, description, QuoteForm, feature points. Recovery and fleet images have distinct compositions; phone layouts retain complete vehicle images. No decorative captions or caption spacing. Labels and icons are present on all section CTAs.

The unchanged QuoteForm uses Wix vehicle data. Toyota selection enabled 31 model choices plus the placeholder. No enquiry was submitted. The JAFZA coverage expander opens by pointer and closes using Enter; FAQ expander opens. Dubai's Jebel Ali guide was verified and followed to the child. Existing Al Quoz, Ras Al Khor and Dubai links are used; no unpublished child routes. Global navigation contains no Jebel Ali child item; Dubai's active style remains. Shared header, footer, form, analytics and CMS configuration were not changed.

Keyboard focus styles and reduced-motion guards reviewed in source. Shared LocationsMotion provides CSS/IntersectionObserver reveals and restrained desktop parallax; hover image scale measured at 1.075. Temporary viewport override restored after QA.

## SEO and checks

One H1; requested title, exact meta description and canonical verified in browser. Four breadcrumb levels and eight FAQ entries; no LocalBusiness schema. Staging remains `noindex,nofollow`. Jebel Ali appears once in the existing static route manifest consumed by the production sitemap generator. The existing preview sitemap safeguard remains disabled with a 404 and noindex header; no alternate sitemap mechanism was added.

133 automated tests passed. Local build passed with staging isolation and analytics disabled; whitespace check passed. No production deployment or Wix data writes.

## Files created

- `src/pages/locations/dubai/jebel-ali.astro`
- `public/sections/jebel-ali-warehouse-recovery.webp`
- `public/sections/jebel-ali-commercial-fleet.webp`
- `tests/jebel-ali-page.test.mjs`
- `docs/assets/jebel-ali-images.md`
- `docs/qa/jebel-ali-location.md`
- `docs/qa/jebel-ali-desktop.jpg`

## Files modified

All eleven existing page files listed in the audit table, plus `src/lib/site-routes.ts` and `tests/locations-page.test.mjs`. Dubai parent links changed in both the guide navigation and local expander CTA. Existing fragments remain available. The obsolete caption-style test now expects no figcaption; the new test checks every location page and its descriptive alt attributes.

Outstanding issues: none identified. Desktop evidence: `jebel-ali-desktop.jpg`. Final built-in imagegen prompts and asset paths: `docs/assets/jebel-ali-images.md`.
