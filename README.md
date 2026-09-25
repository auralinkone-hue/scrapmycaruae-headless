# Scrap My Car UAE Headless

## SEO environments

SEO behavior is controlled at build time:

- Staging and preview: `PUBLIC_SEO_ENV=staging`. Pages emit `noindex,nofollow`, `robots.txt` disallows all crawling, and the sitemap returns 404.
- Production: `PUBLIC_SEO_ENV=production` and `PUBLIC_SITE_URL=https://www.scrapmycaruae.com`. Canonical-host pages emit `index,follow`, `robots.txt` allows crawling, and the dynamic sitemap includes public pages plus every published Wix Blog post.

Use `npm run deploy` for production. It refuses to build or deploy unless both production SEO values are explicitly correct. Use `npm run deploy:staging` only for non-production preview deployments. A runtime guard also returns 503 if a staging build is ever served from the production hostname.

## Quote request collection

The server-side `/api/quote` route requires `WIX_QUOTE_REQUESTS_COLLECTION_ID`.
This variable is intentionally not public and must never use a `PUBLIC_` prefix.

- Development and Cloudflare preview: `WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequestsStaging`
- Production: `WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequests`

The development preview workflow sets the staging collection explicitly. Production
deployments must set the production value explicitly; if the variable is missing or
invalid, quote submission fails closed without exposing configuration to the browser.
