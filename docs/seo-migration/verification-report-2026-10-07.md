# SEO migration verification report — 2026-10-07

## Scope

This report records the verification completed on
`feature/astro-wix-seo-migration` before it was promoted to `development`.
It does not represent a production launch.

## Protected URL inventory

- Published Wix Blog posts inventoried: **588**.
- Protected route shape: `/post/{slug}`.
- Non-`/post/` source URLs: **0**.
- Complete manifest: `protected-wix-blog-url-manifest.txt`.
- Cutover rule: every manifest URL must either resolve at the identical route or
  have an explicitly approved permanent redirect.

## Live Wix comparison

- Successful live page responses: **541**.
- Existing live crawl failures: **47** (11 HTTP 403, 35 HTTP 500, 1 HTTP 504).
- On successful live pages, the inventory found 28 missing descriptions, 18
  missing canonical tags, and 18 missing title tags. These are source-site
  content issues to resolve in Wix before production cutover, not changes made
  by the headless branch.

## Route and SEO checks

- `/post/{slug}` is retained by the headless application.
- `/blog` is permanently redirected to `/blogs`.
- `/privay-policy` is permanently redirected to `/privacy-policy`.
- Staging emits `noindex,nofollow` and blocks `robots.txt` crawling.
- Staging disables the sitemap endpoint. Production-mode configuration enables
  the dynamic sitemap with indexable static routes and retained Wix Blog posts.

## Tests completed

- `npm run seo:inventory` completed with all 588 published posts.
- `npm run seo:audit` completed.
- `npm run build` passed.
- Rendered staging SEO audit passed for static routes, redirects, robots, and
  staging sitemap behaviour.

## Known verification limitation

The local Worker emulator could not resolve `www.wixapis.com`, so a local
rendered `/blogs` check returned HTTP 500. The standalone inventory accessed
Wix successfully from the Node environment. This is a local emulator DNS
limitation; it must be rechecked on the eventual Wix-managed staging hostname.

## Existing unrelated test failure

The quote-route test has 5 passing cases and 1 failing stale field-mapping
regex. The same failure is present on `development`; it was not changed by the
SEO migration.
