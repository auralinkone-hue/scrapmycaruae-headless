# Dubai Investments Park staging QA

Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/dubai/dubai-investments-park/

Application commit: 9f4d209d85ab66e83925f4360e1d61aa72b3e130. Staging workflow 39304638826 succeeded. Final evidence commit and workflow are reported in the completion message.

- Native browser inspection at 390, 430, 768, 1024 and 1440px: two-line H1; no horizontal overflow or clipped text/buttons. Phone order is heading, description, shared QuoteForm and then feature points.
- Both new photos inspected at phone, tablet and desktop sizes. Silver mid-2010s sedan recovery and a separate compact-sedan/SUV workshop scene; both load at 1440px source width. Mobile images preserve complete main vehicles. No visible captions or explanatory image sentences. Rounded frames, high-contrast recovery copy and floating commercial panel remain readable.
- Coverage tabs: pointer selection displays the corresponding panel; ArrowRight selects the next tab and Home returns to the first. Keyboard focus-visible and solid focus outline confirmed. FAQ expander opens.
- Unchanged Wix-backed QuoteForm: Toyota selection enables 31 model choices plus placeholder. No enquiry submitted. Existing validation, CMS save and WhatsApp handoff implementation remains untouched.
- All section CTAs use labelled shared pill buttons with icons. Dubai's DIP guide link was verified and followed into the page. Nearby links resolve to existing routes; no global DIP navigation item. Dubai retains its active style.
- Browser confirms requested title and canonical, one H1, four breadcrumb levels, eight FAQ entries and staging `noindex,nofollow`. No LocalBusiness schema. DIP appears once in the existing route manifest consumed by the sitemap generator; preview sitemap safeguards remain unchanged.
- Shared lightweight CSS/IntersectionObserver motion; hover image scale measured at 1.075. Reduced-motion protection reviewed in source. Browser viewport override restored after QA.
- 135 tests passed; staging build and whitespace checks passed. Existing all-location caption regression remains passing. No dependency, shared form, header/footer, analytics or Wix data changes.

Files: new DIP page, two WebP assets, DIP route/asset tests and image prompt record; Dubai parent links and existing route manifest updated. The all-location caption test now avoids a fixed page count so new published location pages are included automatically.

Desktop evidence: `dip-desktop.jpg`. Built-in imagegen prompts and final asset paths: `docs/assets/dip-images.md`.

Outstanding issues: none identified.
