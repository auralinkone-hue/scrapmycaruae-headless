# Cloudflare Web Analytics activation

This integration is dormant on development/staging. No production activation,
Cloudflare dashboard changes or GTM changes are part of this implementation.

## Future approved production build

Set these **at build time**, only in the independently approved production
deployment configuration (runtime secrets cannot enable compiled client code):

```dotenv
PUBLIC_SEO_ENV=production
PUBLIC_SITE_URL=https://www.scrapmycaruae.com
PUBLIC_ANALYTICS_ENABLED=true
PUBLIC_GTM_ID=GTM-TFQ7BDGX
PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED=true
PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=49956eb062ca47e2b1c53997795bee44
```

The token is a public website identifier, not an API credential. Existing GA4
`G-C7Q56MNMZN` remains managed by the existing GTM container; no second GA4 loader
or tag is added. Production deployment still requires its separate approved
Worker/configuration and `QuoteRequests`, as enforced by the existing safeguards.
No production target is created or approved by enabling this feature.

Staging retains `PUBLIC_ANALYTICS_ENABLED=false`,
`PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED=false`, `PUBLIC_SEO_ENV=staging`, noindex
and `QuoteRequestsStaging`. An absent Cloudflare flag also means disabled.

## Owner checks before activation

1. Use **manual installation** for `scrapmycaruae.com` in Cloudflare Web Analytics.
   Keep Cloudflare automatic beacon injection disabled. Keep any Cloudflare
   beacon tag in GTM disabled/absent. Do not change the existing GA4 tag.
2. Keep this shared-layout loader as the sole installation owner. It detects
   already-present automatic/GTM snippets, versioned URLs and the beacon's
   initialized state, and installs only once per document. Application code
   cannot reliably stop an independently injected third-party script from
   executing first or a future GTM tag from bypassing consent. Therefore these
   external settings are a required activation gate, not a code-only guarantee.
3. If a production CSP exists outside this repository, allow
   `https://static.cloudflareinsights.com/beacon.min.js` in `script-src` and
   `https://cloudflareinsights.com` in `connect-src`, retaining existing sources.
   No repository CSP is currently configured; no CSP settings were changed.
4. On the approved production host, verify no beacon request before consent or
   after a saved decline, one installation after acceptance, and the existing
   GTM/GA4 behavior. Do not submit a customer enquiry to verify analytics.

## Consent, privacy and behavior

Only HTTPS `scrapmycaruae.com` and `www.scrapmycaruae.com` on the default port are
allowed. Preview subdomains, `workers.dev`, localhost and unrelated hosts fail
closed, even if production HTML is served there.

The loader reads the existing `smc_cookie_preferences_v1` preference and listens
to the existing `smc:analytics-consent` event. Unknown/declined choices load
nothing. Withdrawal after loading reloads the document to clear the official
beacon's observers; it has no supported unload API. Previously sent metrics
cannot be undone. No form content, contact details or custom tracking payloads
are read or supplied. The official beacon strips URL query strings/fragments;
the script request additionally uses an origin-only referrer policy. No
third-party networking is necessary in automated tests.

The module is asynchronous. SPA tracking is disabled because this site uses
full-document navigation. Blocked analytics must not interrupt customer flows.

References: [Cloudflare FAQ and CSP](https://developers.cloudflare.com/web-analytics/faq/),
[manual setup](https://developers.cloudflare.com/web-analytics/get-started/),
[SPA options](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/).
