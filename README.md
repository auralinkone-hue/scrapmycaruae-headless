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

## Analytics foundation

Google Tag Manager is the sole frontend analytics loader. The existing GA4 measurement
ID is `G-C7Q56MNMZN`; it is retained for GTM configuration and documentation only.
Do not add a direct `gtag.js` loader or create another GA4 property.

Analytics loads only when both of these public build variables are set:

```bash
PUBLIC_GTM_ID=GTM-TFQ7BDGX
PUBLIC_ANALYTICS_ENABLED=true
```

The development preview explicitly uses `PUBLIC_ANALYTICS_ENABLED=false`. The browser
helper sends only minimal, non-PII events through `window.dataLayer`: `generate_lead`,
`whatsapp_handoff`, `whatsapp_click`, `phone_click`, and `quote_cta_click`.
It never delays CMS saving, navigation, or the WhatsApp handoff.


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
