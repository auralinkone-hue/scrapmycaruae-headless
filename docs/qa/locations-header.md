# Locations header navigation QA

Initial application SHA: e689442ad2912e09334b76f7f7dea300c8a1bb11.
Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/

Locations follows Scrap My Car, with a clickable desktop parent and a native details dropdown containing only the eight completed routes. Mobile reuses the existing drawer, dedicated drill-in, Back button and focus controller. The first mobile item reads “View all UAE locations”. Umm Al Quwain is omitted. Sell/Scrap route arrays are unchanged.

## Responsive and interaction review

Cloud browser lacks a viewport override. A temporary noindex staging route rendered the real page in same-origin frames at 390, 430, 768, 1024, 1120, 1280 and 1440px. Measurements verified actual frame width. The temporary route was removed from final source/build.

- 390 / 430 / 768 / 1024: mobile Locations opens with all eight links, correct overview label and Fujairah active state. Settled panels have no horizontal overflow or out-of-bounds controls. Early measurements during the slide transition were excluded; settled transform is none.
- 1120 / 1280 / 1440: desktop navigation fits on one line; actions remain separate from navigation; dropdown remains within viewport. Header overflow is absent. Existing mobile breakpoint remains 1100px.
- Desktop Locations opens by mouse and Enter. Escape closes the dropdown and returns focus to its summary. Parent link opens `/locations/`.
- All seven city links were followed in the browser: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah and Al Ain. Each renders its matching active child with aria-current=page and an active Locations parent. The hub marks All UAE Locations active.
- Mobile Back returns focus to Locations. Escape closes the drawer, restores opener focus and removes body scroll lock. Shift+Tab from Close wraps to WhatsApp, and Tab wraps back to Close.
- Mobile Sell retains all eight completed service links; Scrap retains its five existing links. Unfinished Old / Unwanted pages remain absent. Native desktop dropdown grouping remains unchanged.
- Reduced-motion guards reviewed in source, including disabled dropdown animation and transitions. System reduced-motion preference was not emulated.

Screenshot: docs/qa/locations-header-desktop.jpg.

## Validation and scope

122 tests passed and staging build passed, including after temporary QA route removal. git diff --check passed. Changes restricted to development/staging; no main, release, production or DNS changes.
