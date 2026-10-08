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

## CRM contact synchronization

After a quote is saved, the server can create or reuse a Wix CRM contact by normalized UAE mobile number and apply the environment label. This secondary step never blocks the saved quote or its WhatsApp handoff.

Configure these as Cloudflare Worker **secrets** (never `PUBLIC_` variables):

- `WIX_CRM_API_KEY` — Wix API key with **Read Contacts**, **Manage Contacts**, and **Manage Contact Labels** scopes.
- `WIX_CRM_SITE_ID` — the existing Wix site ID, required for this API-key CRM integration.

The development collection applies `Headless Staging Test`; production applies `Website Valuation Lead`.

The development preview workflow sets the staging collection explicitly. Production
deployments must set the production value explicitly; if the variable is missing or
invalid, quote submission fails closed without exposing configuration to the browser.


## Migration route and metadata QA

The protected production route manifest lives in `src/lib/site-routes.ts`. It preserves
the live Wix canonical routes, including `/post/{slug}`, `/terms-conditions` and
`/privacy-policy`. It also records only deliberate one-hop 301 compatibility redirects.

Run the rendered SEO audit against a local server, preview URL or production candidate:

```bash
PUBLIC_SEO_ENV=staging SEO_AUDIT_URL=http://localhost:4321 npm run seo:qa
```

For a production-candidate check, set both `PUBLIC_SEO_ENV=production` and
`SEO_AUDIT_URL=https://www.scrapmycaruae.com`. Optional representative post paths can
be supplied through `SEO_AUDIT_POST_PATHS=/post/example-one,/post/example-two`.
