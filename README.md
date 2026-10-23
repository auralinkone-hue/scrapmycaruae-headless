# Scrap My Car UAE Headless

## SEO environments

SEO behavior is controlled at build time:

- Staging and preview: `PUBLIC_SEO_ENV=staging`. Pages emit `noindex,nofollow`, `robots.txt` disallows all crawling, and the sitemap returns 404.
- Production: `PUBLIC_SEO_ENV=production` and `PUBLIC_SITE_URL=https://www.scrapmycaruae.com`. Canonical-host pages emit `index,follow`, `robots.txt` allows crawling, and the dynamic sitemap includes public pages plus every published Wix Blog post.

Deployment is separate from SEO mode. `npm run deploy:staging` targets only the existing
`smc-headless-worker`; `npm run deploy` is **blocked** because
`deployment-targets.json` deliberately has no approved production target. Changing
`PUBLIC_SEO_ENV` does not approve a Worker. A runtime guard also returns 503 if a
staging build is served from the production hostname.

### Deployment safety gates

Both supported deployment commands require the `development` branch, explicit
`DEPLOYMENT_WORKER_NAME` and `DEPLOYMENT_CONFIG_FILE` matching the checked-in target
manifest, and complete environment settings. They validate before running tests or
building, run tests and the build, revalidate the generated Worker target and actual
prerendered SEO output, then upload using an explicit `--name` and Wrangler’s verified
`.wrangler/deploy/config.json` redirect. Do not pass source `--config` to upload;
it bypasses the generated Astro deployment configuration.
Any failed prerequisite stops upload. Additional command-line overrides are rejected.

Staging configuration:

- `DEPLOYMENT_WORKER_NAME=smc-headless-worker`
- `DEPLOYMENT_CONFIG_FILE=wrangler.jsonc`
- `PUBLIC_SEO_ENV=staging`
- `PUBLIC_SITE_URL=https://www.scrapmycaruae.com`
- Existing `PUBLIC_WIX_CLIENT_ID`
- `PUBLIC_ANALYTICS_ENABLED=false`
- `WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequestsStaging`

Safe offline checks (no upload):

```bash
npm run deployment:verify -- staging
# After building with the same explicit environment:
npm run deployment:verify -- staging --built
```

The development CI workflow enforces the same settings and runs tests before building.
It checks both source configuration and generated adapter output before the upload
step. No production secrets or targets are added to that workflow.

A future production release requires a separate owner-reviewed change recording an
independently approved Worker name, a separate repository-local Wrangler JSON config,
and an `approvalReference` in the production manifest entry. No name is reserved or
created by these scripts. Production must explicitly use `QuoteRequests`, production
SEO, the existing canonical origin, and an explicit analytics setting (with GTM if
analytics is enabled). `DEPLOYMENT_CONFIG_FILE` is also passed to the Astro Cloudflare
adapter so build and upload use the same config; generated output must confirm that.
These gates do not authorize a production release.

**Runtime bindings remain an owner verification gate.** Offline validation can inspect
plain Wrangler vars, but cannot read encrypted dashboard secrets, account permissions,
remote D1 resources or existing Worker bindings. Before any future release, verify
these independently on the approved target. Runtime quote collection overrides are
validated against the compiled SEO environment: staging permits only
`QuoteRequestsStaging`, production only `QuoteRequests`. A mismatch fails closed before
CMS access. No credentials or remote settings are changed by these checks. Raw manual
Wrangler/API/dashboard operations bypass repository scripts and remain restricted to
separately approved release procedures.

## Quote request collection

The server-side `/api/quote` route requires `WIX_QUOTE_REQUESTS_COLLECTION_ID`.
This variable is intentionally not public and must never use a `PUBLIC_` prefix.

- Development and Cloudflare preview: `WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequestsStaging`
- Production: `WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequests`

The development preview workflow sets the staging collection explicitly. Production
deployments must set the production value explicitly; if the variable is missing or
invalid or mismatched to the build environment, quote submission fails closed without exposing configuration to the browser.

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
