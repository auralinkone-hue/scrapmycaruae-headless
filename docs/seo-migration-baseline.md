# Scrap My Car UAE — SEO Migration Baseline

This is the pre-migration SEO baseline for the headless rebuild.

## Confirmed inventory

- Published Wix Blog posts: **584**
- Wix Editor static pages with individual SEO overrides: **8**
- Existing blog URL format: `/post/{slug}`
- Existing published blog slugs must be preserved exactly.

## Static-page SEO records

| Wix Page ID | Current SEO title |
| --- | --- |
| c1dmp | Scrap My Car UAE — Free Quote & Collection - Dubai |
| rhkft | Scrap My Car UAE — Free Scrap Car Quote - Free Collection |
| ko5wl | Blogs — Scrap My Car Uae |
| daid7 | FAQs — Scrap My Car UAE - Scrap Car For Cash |
| ol0ux | Contact Us — Scrap My Car UAE |
| aghyj | Thankyou — Scrap My Car UAE |
| qpr68 | Privacy Policy — Scrap My Car UAE |
| jcgq0 | Terms & Conditions — Scrap My Car UAE |

All eight currently have page-level SEO overrides in Wix.

## Export the full blog SEO inventory

Run:

```bash
npm run seo:inventory
```

The exporter retrieves all published Wix Blog posts and crawls their current live pages. It writes:

- `seo-inventory/blog-seo-inventory.csv`
- `seo-inventory/blog-seo-inventory.json`

The export contains the post ID, title, slug, current URL, publication dates, cover image, focus keyword, Wix SEO overrides, rendered title, rendered meta description, canonical URL, robots tag, Open Graph tags, JSON-LD count, and crawl status.

## Migration rules

- Preserve the current `/post/{slug}` URL format.
- Do not change existing published blog slugs unless a redirect is deliberately planned.
- Preserve current SEO titles and descriptions unless a change is deliberately approved.
- Preserve canonical URLs at cutover.
- Render equivalent Open Graph metadata.
- Render equivalent structured data where present.
- Any URL that cannot be preserved must receive an explicit 301 redirect.
- Keep the development Worker separate from the live Wix frontend until final cutover.
