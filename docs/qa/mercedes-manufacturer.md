# Mercedes-Benz quick QA

Route: `/cars/mercedes-benz/`. Branch: development. Scope: new page/content/assets and sitemap manifest only; existing designs and navigation unchanged.

- Existing suite plus focused route/content/image checks: **169 passed, 0 failed**.
- Staging build: **PASS**.
- Live catalogue read: 22 Mercedes-Benz models under `MERCEDES-BENZ`. Explorer options are filtered against those entries at request time; QuoteForm receives the complete makes/models/years catalogue.
- Uses the unchanged shared manufacturer controller for default make, explicit explorer make/model updates, reverse synchronisation and preserving other form values. The all-manufacturer catalogue regression passes.
- One H1, canonical, breadcrumb/FAQ data and one manifest route verified by tests. Deployment and rendered HTTP SEO verification are reported at delivery.
- Two new scenes; six optimized responsive WebPs with intrinsic dimensions. Prompts/paths: `docs/assets/mercedes-images.md`.
- **OPEN — browser checks:** actual 390px/1440px overflow/form visibility and another-make → Mercedes explorer interaction were not exercised. Browser automatic approval review was previously blocked by a usage limit; no alternate browser route was used to bypass it.
- No test enquiry, production CMS write, production deployment, paid dependency or API/schema change.
