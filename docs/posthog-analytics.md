# PostHog EU: controlled Astro integration

PostHog project: EU data region; public project ID 318178.

## Current release status
- On **development/staging**, `PUBLIC_POSTHOG_ENABLED=false`; no PostHog SDK script, events, session replay or network requests.
- No production Worker/domain is yet approved. This commit **does not activate PostHog**.
- PostHog uses a **public project token** (prefix `phc_`), not a personal API key.

## Production-only approved build
Set at **build time** in a separate owner-approved production configuration:
```dotenv
PUBLIC_SEO_ENV=production
PUBLIC_ANALYTICS_ENABLED=true
PUBLIC_POSTHOG_ENABLED=true
PUBLIC_POSTHOG_PROJECT_TOKEN=<public project token supplied by owner>
```
Only on HTTPS `scrapmycaruae.com` and `www.scrapmycaruae.com` can the config render. This feature also requires the existing GTM consent mode to be enabled. Never add PostHog in GTM or install the onboarding wizard as a second copy. If a Content Security Policy is later applied, review PostHog documented script/connect/worker sources first.

## Consent and privacy
- PostHog code only loads **after the user's saved analytics permission** (or explicit grant). `opt_out_capturing_by_default` and `opt_out_persistence_by_default` are enabled. Revocation opts out then reloads to stop recording.
- No `identify` call, no name, phone, email, VIN, quote ID, WhatsApp destination URL, raw form value or request payload is submitted.
- Disable element autocapture; report only pageviews and allowlisted anonymous funnel events (`quote_form_start`, `generate_lead`, `whatsapp_handoff`, clicks). Existing Wix/Brevo lead submission behavior is unchanged.
- Mask all text and all input values for session replay; disable replay for URLs that include query parameters; scrub URL queries/referrers from event payloads.
- PostHog's default browser SDK may capture additional standard properties; verify actual outgoing payloads, DOM snapshot privacy, and consent behavior **before enabling production**.

## Owner checks before approval
1. Confirm the Free PostHog plan and EU project.
2. Check no PostHog script before consent, and exactly one after acceptance.
3. Test decline/revoke, confirm SDK traffic stops; no staging calls.
4. Inspect actual event network payloads and recordings for sensitive data, especially URL query strings/DOM data and form field values.
5. Confirm analytics data appears in EU project 318178 and new events are useful for funnels.
6. Check GA4/GTM and Cloudflare analytics separately, avoid duplicates, and preserve original Wix CMS data model.
