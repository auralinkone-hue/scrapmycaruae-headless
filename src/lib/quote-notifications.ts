import { countryDialOptions } from './country-codes.ts';

/** Server-only delivery. A permanent D1 claim provides at-most-once dispatch across isolates. */
export interface NotificationEnv {
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  QUOTE_EMAIL_MODE?: string;
  QUOTE_NOTIFICATIONS_DB?: Pick<D1Database, 'prepare'>;
}
export interface SavedQuote {
  requestId: string;
  submissionId?: string;
  collectionId: string;
  make: string;
  model: string;
  year: string;
  customerName: string;
  whatsapp: string;
  /** Original validated format, notification-only; CMS storage stays unchanged. */
  contactPhoneInput?: string;
  sourcePath: string;
  savedAt: string;
}
const PRODUCTION_RECIPIENT = 'info@scrapmycaruae.com';
// Staging test mailbox only; production notifications keep the established business inbox.
const STAGING_TEST_RECIPIENT = 'hussain.gscx@gmail.com';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const singleLine = (value: string) => value.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').trim();

const dialPrefixes = [...new Set(countryDialOptions.map(country => country.dial.slice(1)))];

export function customerContactLinks(quote: SavedQuote): { whatsapp: string; call: string } | null {
  const raw = (quote.contactPhoneInput ?? quote.whatsapp).trim();
  // Never infer a country from a local number or a bare digit string.
  if (!/^(?:\+|00)[\d ().-]+$/.test(raw) || raw.includes('(0)')) return null;
  const originalDigits = raw.replace(/\D/g, '');
  const savedDigits = quote.whatsapp.replace(/\D/g, '');
  // Original formatting may identify the prefix, but cannot change the saved recipient.
  if (originalDigits !== savedDigits) return null;
  const digits = raw.startsWith('00') ? originalDigits.slice(2) : originalDigits;
  if (!/^[1-9]\d{6,14}$/.test(digits) || !dialPrefixes.some(prefix => digits.startsWith(prefix))) return null;
  // A national trunk zero is not part of an international UAE/UK number.
  if (/^(?:971|44)0/.test(digits)) return null;
  const message = `Hi ${singleLine(quote.customerName)}, this is Scrap My Car UAE regarding your ${singleLine(quote.year)} ${singleLine(quote.make)} ${singleLine(quote.model)} valuation enquiry.`;
  return { whatsapp: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`, call: `tel:+${digits}` };
}

export function quoteSourcePath(request: Request): string {
  try {
    const source = new URL(request.headers.get('referer') || '');
    return source.origin === new URL(request.url).origin ? source.pathname.slice(0, 300) : 'Not supplied';
  } catch { return 'Not supplied'; }
}

export async function notificationKey(quote: SavedQuote): Promise<string> {
  // Edited details are a new enquiry, even if a caller reuses its submission ID.
  const identity = JSON.stringify([quote.collectionId, uuidPattern.test(quote.submissionId || '') ? quote.submissionId!.toLowerCase() : quote.requestId,
    quote.make, quote.model, quote.year, quote.customerName, quote.whatsapp]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function buildQuoteEmail(quote: SavedQuote, sender: { email: string; name: string }, staging: boolean, key: string) {
  const rows = [
    ['Customer', quote.customerName], ['Phone / WhatsApp', quote.whatsapp],
    ['Make', quote.make], ['Model', quote.model], ['Year', quote.year],
    ['Enquiry ID', quote.requestId], ['Saved at (UTC)', quote.savedAt],
    ['Source', 'Headless Website'], ['Page', quote.sourcePath], ['CMS collection', quote.collectionId]
  ];
  const heading = `${staging ? '[STAGING TEST] ' : ''}New Car Valuation Enquiry`;
  const intro = staging ? 'Staging test enquiry only. Do not treat this as a live customer lead.' : 'A new website valuation enquiry has been saved successfully. Please review the details and contact the customer.';
  const contact = customerContactLinks(quote);
  const contactNote = 'Confirm the customer’s international country code before contacting them. No contact link was generated for this number.';
  const contactText = contact
    ? `WhatsApp Customer: ${contact.whatsapp}\nCall Customer: ${contact.call}`
    : contactNote;
  const contactHtml = contact
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:24px"><tr><td align="center" bgcolor="#128C45" style="background:#128C45;border-radius:8px;mso-padding-alt:16px 20px"><a href="${escapeHtml(contact.whatsapp)}" style="display:block;padding:16px 20px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:22px;color:#fff;text-decoration:none;border-radius:8px">WhatsApp Customer</a></td></tr><tr><td height="12" style="height:12px;font-size:0;line-height:0">&nbsp;</td></tr><tr><td align="center" bgcolor="#184D2B" style="background:#184D2B;border-radius:8px;mso-padding-alt:16px 20px"><a href="${escapeHtml(contact.call)}" style="display:block;padding:16px 20px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:22px;color:#fff;text-decoration:none;border-radius:8px">Call Customer</a></td></tr></table>`
    : `<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#647263">${escapeHtml(contactNote)}</p>`;
  // Brevo accepts a UUID idempotency key. D1 supplies permanent protection beyond its TTL.
  const providerKey = `${key.slice(0, 8)}-${key.slice(8, 12)}-4${key.slice(13, 16)}-8${key.slice(17, 20)}-${key.slice(20, 32)}`;
  return {
    sender, to: [{ email: staging ? STAGING_TEST_RECIPIENT : PRODUCTION_RECIPIENT, name: 'Scrap My Car UAE' }],
    subject: `${heading} — ${singleLine(quote.make)} ${singleLine(quote.model)}`,
    headers: { idempotencyKey: providerKey }, tags: [staging ? 'quote-staging-test' : 'quote-enquiry'],
    textContent: `${heading}\n\n${intro}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\n${contactText}\n\nThis is an internal enquiry notification. Email acceptance does not confirm customer contact or vehicle collection.`,
    htmlContent: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body style="margin:0;padding:16px;background:#f3f6f2;font-family:Arial,sans-serif;color:#24372a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #dce7d8;border-radius:12px"><tr><td style="padding:24px"><p style="color:#285d35;font-weight:bold">SCRAP MY CAR UAE</p><h1 style="font-size:23px;line-height:1.3">${escapeHtml(heading)}</h1><p style="line-height:1.6">${escapeHtml(intro)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;table-layout:fixed">${rows.map(([label, value]) => `<tr><th width="38%" style="padding:10px 8px;border-bottom:1px solid #e5ece2;text-align:left;font-size:13px;vertical-align:top">${escapeHtml(label)}</th><td style="padding:10px 8px;border-bottom:1px solid #e5ece2;font-size:14px;overflow-wrap:anywhere;word-break:break-word">${escapeHtml(value)}</td></tr>`).join('')}</table>${contactHtml}<p style="font-size:12px;line-height:1.6;color:#647263">Internal notification following a successful CMS save. Review the enquiry before arranging any next steps.</p></td></tr></table></td></tr></table></body></html>`
  };
}

export async function notifySavedQuote(env: NotificationEnv, quote: SavedQuote, seoEnvironment: string, fetcher: typeof fetch = fetch): Promise<string> {
  let key = '';
  let claimed = false;
  const db = env.QUOTE_NOTIFICATIONS_DB;
  try {
    if (!env.QUOTE_EMAIL_MODE || env.QUOTE_EMAIL_MODE === 'off') return 'disabled';
    const staging = seoEnvironment === 'staging' && quote.collectionId === 'QuoteRequestsStaging';
    const production = seoEnvironment === 'production' && quote.collectionId === 'QuoteRequests';
    if (!((staging && env.QUOTE_EMAIL_MODE === 'staging-test') || (production && env.QUOTE_EMAIL_MODE === 'live'))) {
      console.warn('Quote email skipped: environment/collection/mode mismatch.'); return 'blocked';
    }
    const email = env.BREVO_SENDER_EMAIL?.trim() || '';
    const name = singleLine(env.BREVO_SENDER_NAME || '');
    if (!db || !env.BREVO_API_KEY?.trim() || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !name || !quote.requestId) {
      console.warn('Quote email skipped: notification configuration or saved request ID missing.'); return 'unconfigured';
    }
    key = await notificationKey(quote);
    const result = await db.prepare(`INSERT INTO quote_email_deliveries (notification_key, wix_request_id, collection_id, state)
      VALUES (?, ?, ?, 'sending') ON CONFLICT DO NOTHING`).bind(key, quote.requestId, quote.collectionId).run();
    if (!result.success) throw new Error('Delivery claim failed');
    if (result.meta.changes !== 1) return 'duplicate';
    claimed = true;
    const response = await fetcher('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', accept: 'application/json', 'api-key': env.BREVO_API_KEY.trim() },
      body: JSON.stringify(buildQuoteEmail(quote, { email, name }, staging, key))
    });
    if (!response.ok) {
      // Do not log provider bodies, credentials or customer details.
      await db.prepare("UPDATE quote_email_deliveries SET state = 'failed', failure_code = ?, updated_at = CURRENT_TIMESTAMP WHERE notification_key = ?")
        .bind(`http_${response.status}`, key).run();
      console.warn('Quote email rejected; CMS enquiry preserved.'); return 'failed';
    }
    const accepted = await response.json().catch(() => ({})) as { messageId?: string };
    await db.prepare("UPDATE quote_email_deliveries SET state = 'accepted', provider_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE notification_key = ?")
      .bind(typeof accepted.messageId === 'string' ? accepted.messageId.slice(0, 300) : '', key).run();
    return 'accepted';
  } catch {
    if (claimed && db) {
      try {
        await db.prepare("UPDATE quote_email_deliveries SET state = 'failed', failure_code = 'delivery_or_ledger_error', updated_at = CURRENT_TIMESTAMP WHERE notification_key = ?")
          .bind(key).run();
      } catch { /* Retain the original permanent claim if bookkeeping is unavailable. */ }
    }
    console.warn('Quote email unavailable; CMS enquiry preserved.');
    return 'failed';
  }
}
