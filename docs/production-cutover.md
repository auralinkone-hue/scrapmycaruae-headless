# Production cutover and rollback record

## Release identity

- **Production domain:** `https://www.scrapmycaruae.com`
- **Current Wix Site ID:** `ce9a835f-dc65-4b92-ac85-6fa4a0ac6b75`
- **Current live frontend:** Wix Editor
- **Staging Worker:** `smc-headless-worker`
- **Production Worker:** `smc-headless-production`
- **Current main SHA at release preparation:** `2fa3e53eca88a9dd21ff1eb9db6adab6b17d6613`
- **Release reconciliation SHA:** `a007ac2c79160303b38a92515c98c8711d1f1b2b`

The reconciliation SHA is the merge that restored the approved `development` tree after the
historical merge/revert pair on `main`. Record the final PR merge SHA in the release ticket
when this branch is approved.

## Publicly verified DNS — 2026-10-11

The following was obtained through read-only public DNS queries. It is not a substitute for
capturing the complete domain-provider configuration before a cutover.

| Record | Public result |
| --- | --- |
| `scrapmycaruae.com` NS | `ns8.wixdns.net`, `ns9.wixdns.net` |
| `scrapmycaruae.com` A | `185.230.63.171`, `185.230.63.186`, `185.230.63.107` |
| `www.scrapmycaruae.com` CNAME | `cdn3.wixdns.net` |
| `cdn3.wixdns.net` CNAME | `cfd.wixdns.net` |
| `cfd.wixdns.net` A | `162.159.143.12`, `172.66.3.8` |

## Manual capture required before cutover

**Do not proceed with cutover until the exact existing Wix/domain configuration has been
recorded.** Public DNS does not reveal dashboard-only settings.

Capture and attach the following from Wix and the DNS/domain provider:

1. Every DNS record (type, hostname, target/value, TTL, priority and proxy mode).
2. Wix domain assignment, primary-domain setting, `www`/apex redirect behaviour and any
   connected-domain verification details.
3. Any CDN, redirect, forwarding, email, SPF, DKIM, DMARC, TXT and verification records.
4. The existing Wix frontend routing configuration and screenshots of the working homepage,
   representative blog URLs, forms and HTTPS redirect.
5. The exact account and change window used for the cutover, with a named rollback owner.

## Production candidate before domain cutover

The manual production workflow deploys only the separate
`smc-headless-production` Worker. It does not add a route or custom domain.

If Cloudflare enables a `workers.dev` URL for that Worker, it may be used for a controlled
functional smoke test. Its host remains intentionally non-indexable: production builds only
allow indexing on `www.scrapmycaruae.com`, and the sitemap is unavailable on any other host.
Do not weaken that guard for a preview.

To test the final production hostname and indexed SEO behaviour, use the actual approved
custom-host/domain cutover window (or a separately approved temporary custom hostname with
its own DNS verification). Neither option is part of this release-preparation change.

## Cutover preconditions

- The release PR is reviewed and merged deliberately.
- The production workflow is run manually from `main` and its distinct Worker is smoke-tested.
- The manual capture above is complete and a rollback owner is available.
- No staging configuration, `QuoteRequestsStaging` collection, or staging Worker route is
  reused for production.
- GTM is implemented with `GTM-TFQ7BDGX`; confirmation that it forwards to GA4
  `G-C7Q56MNMZN` is still an external-account check.

## Rollback procedure

1. Stop production changes.
2. Remove or disable **only** the headless production route/custom domain.
3. Restore the recorded pre-cutover Wix routing/DNS exactly.
4. Confirm `www.scrapmycaruae.com` resolves to Wix.
5. Verify the homepage.
6. Verify Wix blog URLs.
7. Verify Wix forms and business functionality.
8. Verify HTTPS and the `www` redirect.
9. Keep the headless Worker deployed but disconnected for diagnosis.

Do not delete Wix during rollback. Wix remains the backend/source of truth, and the existing
Wix frontend is deliberately retained throughout launch and rollback.
