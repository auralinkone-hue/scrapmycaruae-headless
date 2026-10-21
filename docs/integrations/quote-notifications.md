# Website valuation enquiry notifications

Only `/api/quote` schedules email, after Wix confirms insertion into the configured quote collection. Existing validation, Wix field mapping, customer details and WhatsApp response are preserved. A Brevo or ledger failure cannot change a successful save into a customer error. Direct WhatsApp links, visits, honeypots and rejected submissions do not dispatch email.

## Current deployment

Development preview only. Email is **off unless explicitly configured**. No real email was sent during implementation or tests. All Brevo and Wix test requests were mocked; tests execute the actual route and SQL ledger against an in-memory SQLite database.

Recipients are fixed server-side by environment: **staging tests** go to `hussain.gscx@gmail.com`; **production** remains `info@scrapmycaruae.com`. This staging-only change does not enable delivery or affect production. No extra recipient secret is required. There is no customer email subscription or marketing-list integration. The email includes name, phone, make, model, year, saved Wix enquiry ID, UTC save time, source page path and collection. URL query strings are discarded. Credentials, phone numbers and provider response bodies are not logged by the notification code.

## Manual setup — development preview only

### 1. Brevo

1. Enable transactional email access in the Brevo account and ensure sending is permitted.
2. Select an already verified sender address and its display name. Authenticate the sender domain if Brevo requires it. DNS changes were not made by this implementation.
3. Create a transactional API key (not an SMTP password). Enter it only in the Cloudflare secret below, never in chat, source code, a public variable or a frontend build variable.
4. No template ID is needed: the application sends its own HTML and plain-text template.

### 2. Dedicated Cloudflare staging notification ledger

1. In Cloudflare D1, create a **new staging-only** database named `smc-quote-notifications-staging`. Do not reuse a production database or the Wix CMS collection.
2. Open that database's Console and run the contents of `migrations/quote-notifications/0001_quote_email_deliveries.sql` from this repository. This creates only the notification ledger, with no customer name or phone columns.
3. In GitHub repository **Settings → Secrets and variables → Actions → Variables**, add repository variable `QUOTE_NOTIFICATIONS_DATABASE_ID` with this new staging database's UUID. This ID is not a credential.
4. Re-run **Deploy development preview** on `development`. CI adds the D1 binding named `QUOTE_NOTIFICATIONS_DB` to the preview Worker. It does not create or migrate databases. A direct manual Wrangler deploy must supply the same binding too; use the development workflow for repeatable deployments.
5. Confirm the preview Worker's D1 binding points to the new staging database before enabling email.

### 3. Cloudflare runtime secrets

On Worker **`smc-headless-worker` only**, open **Settings → Variables and Secrets**, add the following as **Secret** values, then deploy the settings:

| Secret | Value |
| --- | --- |
| `BREVO_API_KEY` | Brevo transactional API key |
| `BREVO_SENDER_EMAIL` | Exact verified sender email address |
| `BREVO_SENDER_NAME` | `Scrap My Car UAE` (or the approved verified sender name) |
| `QUOTE_EMAIL_MODE` | Keep `off` until an authorised test; then `staging-test` |

`QUOTE_EMAIL_MODE` absent or `off` disables delivery. `staging-test` requires both the staging build environment and the `QuoteRequestsStaging` collection. Every staging subject starts `[STAGING TEST]`, and the email body explicitly says it is a test. `live` is rejected on staging. No production settings were changed.

The existing workflow keeps `WIX_QUOTE_REQUESTS_COLLECTION_ID=QuoteRequestsStaging` and `PUBLIC_SEO_ENV=staging`. Leave both unchanged. Brevo secrets are read at Worker runtime using `cloudflare:workers`; they are not copied into GitHub Actions or browser bundles.

After explicit authorisation, use synthetic customer details for one staging form submission, confirm the Wix staging row and WhatsApp URL, inspect Brevo transactional logs and the business mailbox, and return `QUOTE_EMAIL_MODE` to `off` if further tests are not intended. Real email delivery remains pending until that authorised test.

## Duplicate protection and failure handling

The shared form blocks simultaneous submits and reuses a UUID when unchanged details are retried within that mounted form. Editing details produces a new UUID. This does not change the fields written into Wix.

After a successful Wix insert, an atomic SQL claim prevents concurrent notification attempts for the same submission/details/collection. A separate unique constraint prevents another notification for the same saved Wix item. The permanent claim is stored **before** the Brevo call; no in-memory locks or eventually consistent KV checks are used. Brevo also receives a deterministic UUID idempotency key as a second safeguard.

This is **at-most-once dispatch**, not guaranteed inbox delivery. The Brevo request has an 8-second timeout and runs under Cloudflare `waitUntil`, without delaying the WhatsApp response. There are deliberately no automatic email retries that could duplicate an ambiguously accepted email. A Worker interruption after claiming can leave a `sending` row without an email. `accepted` means Brevo accepted the API request, not that the mailbox received it. Failures remain visible in the ledger and Worker warnings; the Wix enquiry remains the source of truth.

For failures or stuck `sending` records, review Brevo transactional logs and the saved Wix enquiry before any manual follow-up. Do not delete ledger claims or blindly resend after a timeout. Provider acceptance followed by a ledger outage is ambiguous and must also be checked against Brevo logs. Keep the ledger intact to retain duplicate protection.

A full page reload/new form instance creates a new submission identity; it is a new enquiry. Legacy clients without the new UUID are deduplicated per saved Wix item. The ledger prevents duplicate **notifications**; it does not deduplicate Wix CMS rows if an ambiguous HTTP response causes the form to retry the original CMS insert.

## Wix Inbox investigation and dashboard configuration

Supported documentation confirms two pieces:

- Wix CMS **Item added** can trigger an automation scoped to a selected collection: https://support.wix.com/en/article/cms-creating-automations-for-collection-items
- Wix Automations has a **Show in Inbox** action with Form name and Fields for form notifications: https://support.wix.com/en/article/wix-forms-choosing-who-gets-notified-about-form-submissions

The existing API creates a CMS data item, not a Wix Forms submission. It therefore must not be assumed to receive the default Wix Forms Inbox automation. No fabricated Inbox endpoint, fake visitor message or production automation was added.

Required dashboard check/setup:

1. In the site's **Automations**, create a draft from scratch named `[STAGING TEST] Headless valuation enquiry`.
2. Choose **Wix CMS → Item added → QuoteRequestsStaging**. Add a condition `source` equals `Headless Website`.
3. Check whether **Show in Inbox** is available for this trigger in this site's builder. If available, set Form name to `[STAGING TEST] Website valuation`, and map `customerName`, `whatsapp`, `make`, `model`, `year` and the CMS item ID into the displayed fields. Use the builder's supported contact mapping if it requires one; the current form has no customer email address, so never fabricate an email/contact ID.
4. If the action or required contact mapping is unavailable for this CMS trigger, leave the draft inactive and report that limitation. The documentation does not prove that every site supports combining these two features; CMS-trigger-to-Inbox compatibility and actual delivery require dashboard verification.
5. Do not add an additional **Send an email** action to this automation: Brevo owns the internal email notification, avoiding two emails per enquiry. Grant staff Wix Inbox permissions if needed.
6. Activate only the staging-scoped automation when ready for an authorised synthetic test. Confirm that a real headless CMS insert appears in its run history and Inbox. Keep all production collections/automations untouched.

Wix Inbox setup and the end-to-end email test are pending manual configuration. No new Wix API, CMS field, collection permission or production data change is required for the Brevo implementation.
