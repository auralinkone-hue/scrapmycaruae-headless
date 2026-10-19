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

## Compact layout revision

User screenshot review: reduce oversized photos and improve the mobile guide buttons and commercial layout. Page-specific markup/CSS only; existing assets, shared buttons, form, navigation and analytics remain unchanged.

- At 1440px the recovery feature is 460px tall (previously 780px), with a compact text panel beside its photo. The fleet image is 420px tall (previously 625px) with the brief alongside; the complete fleet section is about 692px tall.
- At 390px the guide links use two columns, 12.5px labels, 46px touch targets and smaller icon circles; the complete guide group is 212px tall rather than seven full-width rows. Nearby location links also use compact two-column navigation.
- Mobile fleet information is tighter, with concise copy and the action after the details. The recovery entrance note is an integrated compact row. Tablet recovery uses a full-width photo above two compact information areas, preserving the front of the vehicle.
- Actual rendered checks repeated at 390, 430, 768, 1024 and 1440px: no horizontal overflow, clipped text or out-of-viewport actions; two-line hero preserved. Both images load, no captions. Coverage pointer/keyboard selection and FAQ expander rechecked. Reduced-motion guards retained. Viewport override reset.
- 135 tests and staging build passed after the final adjustment. Application staging workflow 39307518122 succeeded for 4d0eafd9d78618015e5efdfd997ff795a23a655d.

Updated evidence: `dip-compact-desktop.jpg` and `dip-compact-mobile.jpg`. Earlier screenshot retained as the original implementation record.

Outstanding issues: none identified.
