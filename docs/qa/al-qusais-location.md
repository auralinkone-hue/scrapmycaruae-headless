# Al Qusais staging QA

Preview: https://smc-headless-worker.hussain-gscx.workers.dev/locations/dubai/al-qusais/

Application commit: 1749699a3102808a5195d05966affb3e83a9c616. Application workflow 39310178959 succeeded. Final QA evidence commit and deployment are reported in the completion message.

- Actual browser inspection at 390, 430, 768, 1024 and 1440px. Phone hero order: two-line heading, description, shared QuoteForm, feature points. No horizontal overflow or clipped text/actions. Guide buttons use two columns on phones, readable labels and 44–46px targets; secondary guides use light green.
- Both distinct 1440×960 WebP photos load: sedan recovery in a residential setting and a separate workshop SUV scene. Main vehicles remain visible, without captions or overlapping panels. Desktop recovery feature measures 440px at 1024 and 460px at 1440; workshop feature is 440px at both desktop widths. Tablet photo and three-column brief visually inspected after resuming QA.
- Shared Wix selector enables 31 Toyota models plus placeholder. No enquiry submitted. Existing validation, CMS saving and WhatsApp implementation unchanged. Coverage expander opens by pointer and closes with Enter; focus-visible confirmed. FAQ expander opens.
- Dubai's Al Qusais guide was verified and followed to the child route. Header excludes a global Al Qusais item; Dubai remains active. All contextual destinations are existing pages checked by tests. Parent fragment remains available.
- Browser confirms requested title/canonical, one H1, four breadcrumb levels, eight FAQ entries and staging `noindex,nofollow`. No LocalBusiness schema. Existing route manifest includes Al Qusais once for sitemap generation; preview sitemap safeguard remains unchanged.
- Shared CSS/IntersectionObserver reveals, image hover and restrained desktop parallax retained. Reduced-motion guards reviewed in source. Browser viewport override restored after QA.
- 137 automated tests, staging build and whitespace checks passed; tests/build rerun after resuming. No shared form, global header/footer, analytics, DNS or Wix data changes.

Evidence: `al-qusais-desktop.jpg`. Final imagegen prompts and asset paths: `docs/assets/al-qusais-images.md`.

Outstanding issues: none identified.
