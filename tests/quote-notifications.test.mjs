import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { buildQuoteEmail, notificationKey, notifySavedQuote, quoteSourcePath } from '../src/lib/quote-notifications.ts';
import { requireQuoteRequestsCollectionId } from '../src/lib/quote-collection.ts';
import { normalizePhoneNumber } from '../src/lib/phone.ts';

const schema = await readFile(new URL('../migrations/quote-notifications/0001_quote_email_deliveries.sql', import.meta.url), 'utf8');
const quote = {
  requestId: 'wix-enquiry-1', submissionId: 'fe2a2db8-adc1-4ee1-99de-c57e4fd060f2', collectionId: 'QuoteRequestsStaging',
  customerName: 'Test Customer', whatsapp: '971501234567', make: 'TOYOTA', model: 'CAMRY', year: '2014',
  savedAt: '2026-10-21T09:00:00.000Z', sourcePath: '/cars/toyota/'
};
function setup() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(schema);
  const db = { prepare(query) { return { bind(...values) { return { async run() {
    const result = sql.prepare(query).run(...values);
    return { success: true, meta: { changes: Number(result.changes) } };
  } }; } }; } };
  const env = { QUOTE_EMAIL_MODE: 'staging-test', BREVO_API_KEY: 'mock-only-key', BREVO_SENDER_EMAIL: 'verified@example.test', BREVO_SENDER_NAME: 'Scrap My Car UAE', QUOTE_NOTIFICATIONS_DB: db };
  return { env, sql };
}
const accepted = () => Promise.resolve(Response.json({ messageId: 'mock-message-id' }, { status: 201 }));

test('successful saved enquiry produces escaped, complete staging email to the authorised test inbox', async () => {
  const { env, sql } = setup();
  let outbound;
  const result = await notifySavedQuote(env, quote, 'staging', async (url, init) => { outbound = { url, ...init }; return accepted(); });
  assert.equal(result, 'accepted');
  assert.equal(outbound.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(outbound.headers['api-key'], 'mock-only-key');
  const email = JSON.parse(outbound.body);
  assert.deepEqual(email.to.map(to => to.email), ['hussain.gscx@gmail.com']);
  assert.equal(email.subject, '[STAGING TEST] New Car Valuation Enquiry — TOYOTA CAMRY');
  for (const value of [quote.customerName, quote.whatsapp, quote.make, quote.model, quote.year, quote.requestId, quote.sourcePath, quote.collectionId]) assert.ok(email.textContent.includes(value));
  assert.match(email.headers.idempotencyKey, /^[\da-f-]{36}$/);
  assert.equal(sql.prepare('SELECT state FROM quote_email_deliveries').get().state, 'accepted');
  const escaped = buildQuoteEmail({ ...quote, customerName: '<img src=x onerror=alert(1)>', model: 'X\r\nInjected' }, { email: 'verified@example.test', name: 'SMC' }, false, await notificationKey(quote));
  assert.deepEqual(escaped.to.map(to => to.email), ['info@scrapmycaruae.com']);
  assert.doesNotMatch(escaped.htmlContent, /<img/);
  assert.match(escaped.htmlContent, /&lt;img/);
  assert.doesNotMatch(escaped.subject, /[\r\n]/);
  assert.equal(escaped.subject.startsWith('New Car Valuation Enquiry —'), true);
  sql.close();
});

test('atomic ledger suppresses concurrent/replayed retries even with separate Wix insert IDs', async () => {
  const { env, sql } = setup(); let sends = 0;
  const fetcher = async () => { sends++; return accepted(); };
  const result = await Promise.all([
    notifySavedQuote(env, quote, 'staging', fetcher),
    notifySavedQuote(env, { ...quote, requestId: 'wix-enquiry-retry' }, 'staging', fetcher)
  ]);
  assert.deepEqual(result.sort(), ['accepted', 'duplicate']);
  assert.equal(await notifySavedQuote(env, quote, 'staging', fetcher), 'duplicate');
  assert.equal(sends, 1);
  // The same saved Wix item cannot be notified again under another submission ID either.
  assert.equal(await notifySavedQuote(env, { ...quote, submissionId: 'a45f9bca-c32d-49bb-a1ea-b5813266f739' }, 'staging', fetcher), 'duplicate');
  assert.equal(sends, 1);
  sql.close();
});

test('changed vehicle details form a different notification identity; old clients fall back to saved Wix item ID', async () => {
  assert.notEqual(await notificationKey(quote), await notificationKey({ ...quote, model: 'COROLLA' }));
  assert.notEqual(await notificationKey({ ...quote, submissionId: undefined }), await notificationKey({ ...quote, submissionId: undefined, requestId: 'different-wix-id' }));
});

test('off, missing credentials/ledger and unsafe environment combinations never contact Brevo', async () => {
  const { env, sql } = setup(); let sends = 0;
  const fetcher = async () => { sends++; return accepted(); };
  const cases = [
    [{ ...env, QUOTE_EMAIL_MODE: undefined }, quote, 'staging', 'disabled'],
    [{ ...env, BREVO_API_KEY: '' }, quote, 'staging', 'unconfigured'],
    [{ ...env, QUOTE_NOTIFICATIONS_DB: undefined }, quote, 'staging', 'unconfigured'],
    [{ ...env, BREVO_SENDER_EMAIL: 'bad\r\nsender' }, quote, 'staging', 'unconfigured'],
    [{ ...env, QUOTE_EMAIL_MODE: 'live' }, quote, 'staging', 'blocked'],
    [env, { ...quote, collectionId: 'QuoteRequests' }, 'staging', 'blocked'],
    [env, quote, 'production', 'blocked'],
    [env, { ...quote, requestId: '' }, 'staging', 'unconfigured']
  ];
  for (const [settings, data, stage, expected] of cases) assert.equal(await notifySavedQuote(settings, data, stage, fetcher), expected);
  assert.equal(sends, 0);
  assert.equal(sql.prepare('SELECT COUNT(*) AS total FROM quote_email_deliveries').get().total, 0);
  sql.close();
});

test('Brevo rejection and network/timeout errors retain the permanent claim and do not retry', async () => {
  for (const fetcher of [async () => Response.json({ code: 'invalid_parameter' }, { status: 400 }), async () => { throw new DOMException('mock timeout', 'TimeoutError'); }]) {
    const { env, sql } = setup();
    assert.equal(await notifySavedQuote(env, quote, 'staging', fetcher), 'failed');
    assert.equal(sql.prepare('SELECT state FROM quote_email_deliveries').get().state, 'failed');
    assert.equal(await notifySavedQuote(env, quote, 'staging', () => { throw new Error('MUST NOT SEND'); }), 'duplicate');
    sql.close();
  }
});

test('ledger errors fail closed for email while accepted provider messages are never resubmitted', async () => {
  const { env, sql } = setup(); let sends = 0;
  const broken = { prepare() { throw new Error('mock ledger unavailable'); } };
  assert.equal(await notifySavedQuote({ ...env, QUOTE_NOTIFICATIONS_DB: broken }, quote, 'staging', () => { sends++; return accepted(); }), 'failed');
  assert.equal(sends, 0);
  assert.equal(await notifySavedQuote(env, quote, 'staging', async () => new Response('unexpected body', { status: 201 })), 'accepted');
  assert.equal(await notifySavedQuote(env, quote, 'staging', () => { sends++; return accepted(); }), 'duplicate');
  assert.equal(sends, 0);
  sql.close();
});

test('source details only retain a same-origin path, excluding query strings and third-party referrers', () => {
  const make = referer => new Request('https://preview.example.test/api/quote', { headers: { referer } });
  assert.equal(quoteSourcePath(make('https://preview.example.test/cars/ford/?secret=remove')), '/cars/ford/');
  assert.equal(quoteSourcePath(make('https://external.example.test/anything')), 'Not supplied');
  assert.equal(quoteSourcePath(make('invalid')), 'Not supplied');
});

// Execute the actual route with isolated platform bindings and mocked Wix/Brevo transport.
const routeSource = await readFile(new URL('../src/pages/api/quote.ts', import.meta.url), 'utf8');
const routeCode = stripTypeScriptTypes(routeSource.replace(/^import .*;\n/gm, '').replace(/export /g, '').replaceAll('import.meta.env.WIX_QUOTE_REQUESTS_COLLECTION_ID', 'buildCollection').replaceAll('import.meta.env.PUBLIC_SEO_ENV', 'seoEnvironment'));
const createRoute = new Function('wixClient', 'env', 'waitUntil', 'notifySavedQuote', 'quoteSourcePath', 'requireQuoteRequestsCollectionId', 'normalizePhoneNumber', 'fetch', 'buildCollection', 'seoEnvironment', `${routeCode}\nreturn POST;`);
async function exerciseRoute({ insertStatus = 200, data = {}, providerFails = false, ledgerFails = false, notificationMode = 'staging-test', runtimeCollection, buildCollection = 'QuoteRequestsStaging', buildMissing = false, tokenFails = false, validationStatus = 200, scheduleFails = false, seoEnvironment = 'staging' } = {}) {
  const { env, sql } = setup(); env.QUOTE_EMAIL_MODE = notificationMode;
  if (runtimeCollection !== undefined) env.WIX_QUOTE_REQUESTS_COLLECTION_ID = runtimeCollection;
  if (ledgerFails) env.QUOTE_NOTIFICATIONS_DB = { prepare() { throw new Error('mock ledger error'); } };
  const calls = []; const pending = []; const outboundEmails = []; const savedItems = [];
  const transport = async (url, init) => {
    calls.push(url);
    if (url.endsWith('/query')) return Response.json({ dataItems: [{ id: 'valid-catalogue-entry' }] }, { status: validationStatus });
    if (url === 'https://www.wixapis.com/data/v2/items') {
      assert.equal(JSON.parse(init.body).dataCollectionId, seoEnvironment === 'production' ? 'QuoteRequests' : 'QuoteRequestsStaging');
      savedItems.push(JSON.parse(init.body).dataItem.data);
      return Response.json({ dataItem: { id: 'wix-enquiry-1' } }, { status: insertStatus });
    }
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    outboundEmails.push(JSON.parse(init.body));
    assert.ok(calls.includes('https://www.wixapis.com/data/v2/items'));
    if (providerFails) throw new Error('mock provider outage');
    return accepted();
  };
  const route = createRoute({ auth: { generateVisitorTokens: async () => { if (tokenFails) throw new Error('mock token failure'); return { accessToken: { value: 'mock-visitor-token' } }; } } }, env, promise => { pending.push(promise); if (scheduleFails) throw new Error('mock scheduler failure'); }, (settings, saved, stage) => notifySavedQuote(settings, saved, stage, transport), quoteSourcePath, requireQuoteRequestsCollectionId, normalizePhoneNumber, transport, buildMissing ? undefined : buildCollection, seoEnvironment);
  const response = await route({ request: new Request('https://preview.example.test/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ make: quote.make, model: quote.model, year: quote.year, name: quote.customerName, whatsapp: quote.whatsapp, phoneCountry: 'AE', submissionId: quote.submissionId, ...data }) }) });
  const result = await response.json();
  await Promise.all(pending);
  const rows = sql.prepare('SELECT * FROM quote_email_deliveries').all(); sql.close();
  return { response, result, calls, rows, outboundEmails, savedItems };
}

test('actual quote route saves to staging CMS before notification and keeps the WhatsApp handoff', async () => {
  const { response, result, calls, rows } = await exerciseRoute();
  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.requestId, 'wix-enquiry-1');
  assert.match(result.whatsappUrl, /^https:\/\/api.whatsapp.com\/send\?/);
  assert.equal(calls.at(-1), 'https://api.brevo.com/v3/smtp/email');
  assert.equal(rows[0].state, 'accepted');
});

test('failed validation, honeypots and failed Wix saves never schedule email', async () => {
  for (const options of [{ data: { whatsapp: 'invalid' } }, { data: { name: '123' } }, { data: { year: 'abcd' } }, { data: { website: 'bot.example' } }, { insertStatus: 500 }]) {
    const { calls, rows } = await exerciseRoute(options);
    assert.ok(!calls.includes('https://api.brevo.com/v3/smtp/email'));
    assert.equal(rows.length, 0);
  }
});

test('provider/ledger/config failures never turn a saved quote into a failed customer response', async () => {
  for (const options of [{ providerFails: true }, { ledgerFails: true }, { notificationMode: 'off' }]) {
    const { response, result } = await exerciseRoute(options);
    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.ok(result.whatsappUrl);
  }
});

test('international customer numbers retain CMS save, notification and WhatsApp handoff', async () => {
  for (const whatsapp of ['+44 7742 107109', '+92 300 1234567', '+1 202 555 0123']) {
    const { response, result, rows } = await exerciseRoute({ data: { whatsapp } });
    assert.equal(response.status, 200);
    assert.equal(rows[0].state, 'accepted');
    assert.ok(decodeURIComponent(result.whatsappUrl).includes(whatsapp.replace(/\D/g, '')));
  }
});


test('runtime staging binding restores saves when the deployed build value is missing', async () => {
  const { response, result, calls, rows } = await exerciseRoute({
    runtimeCollection: 'QuoteRequestsStaging', buildMissing: true, notificationMode: 'off'
  });
  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.ok(result.whatsappUrl);
  assert.ok(calls.includes('https://www.wixapis.com/data/v2/items'));
  assert.ok(!calls.includes('https://api.brevo.com/v3/smtp/email'));
  assert.equal(rows.length, 0);
});

test('missing, invalid or production runtime collection fails closed before any Wix query or email', async () => {
  for (const options of [{ buildMissing: true }, { runtimeCollection: '' },
    { runtimeCollection: 'bad collection' }, { runtimeCollection: 'QuoteRequests' }]) {
    const { response, result, calls, rows } = await exerciseRoute(options);
    assert.equal(response.status, 500);
    assert.equal(result.ok, false);
    assert.deepEqual(calls, []);
    assert.deepEqual(rows, []);
  }
});

test('token and catalogue failures never insert an enquiry or schedule a notification', async () => {
  for (const options of [{ tokenFails: true }, { validationStatus: 503 }]) {
    const { response, result, calls, rows } = await exerciseRoute(options);
    assert.equal(response.status, 500);
    assert.equal(result.ok, false);
    assert.ok(!calls.includes('https://www.wixapis.com/data/v2/items'));
    assert.ok(!calls.includes('https://api.brevo.com/v3/smtp/email'));
    assert.deepEqual(rows, []);
  }
});

test('waitUntil scheduling exception cannot turn a confirmed CMS insert into failure', async () => {
  const { response, result } = await exerciseRoute({ scheduleFails: true, notificationMode: 'off' });
  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.ok(result.whatsappUrl);
});


test('notification contact links use submitted international format while CMS and customer handoff remain unchanged', async () => {
  for (const input of ['+971 50 123 4567', '0044 7742 107109']) {
    const { response, result, outboundEmails, savedItems } = await exerciseRoute({ data: { whatsapp: input } });
    const savedDigits = normalizePhoneNumber(input).digits;
    const destination = savedDigits;
    assert.equal(response.status, 200);
    assert.equal(savedItems[0].whatsApp, savedDigits);
    assert.equal(savedItems[0].whatsapp, undefined);
    assert.equal(savedItems[0].contactPhoneInput, undefined);
    assert.match(outboundEmails[0].htmlContent, new RegExp(`href="tel:\\+${destination}"`));
    assert.ok(outboundEmails[0].textContent.includes(`https://wa.me/${destination}?text=`));
    assert.ok(decodeURIComponent(result.whatsappUrl).includes(savedDigits));
  }
});

test('staging CMS uses the declared whatsApp key while notification and handoff retain the same phone', async () => {
  const { response, result, savedItems, outboundEmails } = await exerciseRoute({ data: { whatsapp: '+971 50 123 4567' } });
  assert.equal(response.status, 200);
  assert.equal(savedItems[0].whatsApp, '971501234567');
  assert.equal(Object.hasOwn(savedItems[0], 'whatsapp'), false);
  assert.deepEqual(Object.keys(savedItems[0]).sort(), ['title','make','model','year','customerName','whatsApp','status','source'].sort());
  assert.equal(outboundEmails[0].textContent.includes('971501234567'), true);
  assert.equal(outboundEmails[0].textContent.includes('tel:+971501234567'), true);
  assert.equal(decodeURIComponent(result.whatsappUrl).includes('Phone: 971501234567'), true);
});

test('production CMS keeps the original lowercase whatsapp field and unchanged payload', async () => {
  const { response, result, savedItems, calls } = await exerciseRoute({
    seoEnvironment: 'production', buildCollection: 'QuoteRequests', notificationMode: 'off',
    data: { whatsapp: '+44 7742 107109' }
  });
  assert.equal(response.status, 200);
  assert.equal(savedItems[0].whatsapp, '447742107109');
  assert.equal(Object.hasOwn(savedItems[0], 'whatsApp'), false);
  assert.deepEqual(Object.keys(savedItems[0]).sort(), ['title','make','model','year','customerName','whatsapp','status','source'].sort());
  assert.equal(savedItems[0].make, quote.make);
  assert.equal(savedItems[0].model, quote.model);
  assert.equal(savedItems[0].year, Number(quote.year));
  assert.equal(savedItems[0].customerName, quote.customerName);
  assert.equal(savedItems[0].status, 'New');
  assert.equal(savedItems[0].source, 'Headless Website');
  assert.equal(decodeURIComponent(result.whatsappUrl).includes('Phone: 447742107109'), true);
  assert.equal(calls.filter(url => url === 'https://www.wixapis.com/data/v2/items').length, 1);
  assert.ok(!calls.includes('https://api.brevo.com/v3/smtp/email'));
});

test('runtime destination mapping and environment isolation cannot be overridden by payload phone keys', async () => {
  const staging = await exerciseRoute({ runtimeCollection: 'QuoteRequestsStaging', buildMissing: true,
    data: { whatsapp: '+971 50 123 4567', whatsApp: 'untrusted alternate value' }, notificationMode: 'off' });
  assert.equal(staging.savedItems[0].whatsApp, '971501234567');
  assert.equal(Object.hasOwn(staging.savedItems[0], 'whatsapp'), false);
  const production = await exerciseRoute({ seoEnvironment: 'production', runtimeCollection: 'QuoteRequests', buildMissing: true, notificationMode: 'off' });
  assert.equal(production.savedItems[0].whatsapp, quote.whatsapp);
  assert.equal(Object.hasOwn(production.savedItems[0], 'whatsApp'), false);
  for (const options of [
    { runtimeCollection: 'QuoteRequests' },
    { seoEnvironment: 'production', runtimeCollection: 'QuoteRequestsStaging', buildCollection: 'QuoteRequests' }
  ]) {
    const rejected = await exerciseRoute(options);
    assert.equal(rejected.response.status, 500);
    assert.deepEqual(rejected.savedItems, []);
    assert.deepEqual(rejected.calls, []);
  }
});

for (const [phoneCountry, whatsapp, digits, display] of [
  ['AE', '050 123 4567', '971501234567', '+971 50 123 4567'],
  ['AE', '+971 50 123 4567', '971501234567', '+971 50 123 4567'],
  ['PK', '0300 1234567', '923001234567', '+92 300 1234567'],
  ['GB', '07742 107109', '447742107109', '+44 7742 107109'],
  ['AE', '+44 7742 107109', '447742107109', '+44 7742 107109'],
  ['GB', '0044 7742 107109', '447742107109', '+44 7742 107109'],
]) {
  test(`actual route normalizes ${phoneCountry} ${whatsapp} consistently through staging CMS, email and handoff`, async () => {
    const r = await exerciseRoute({ data: { phoneCountry, whatsapp } });
    assert.equal(r.response.status, 200);
    assert.equal(r.savedItems.length, 1);
    assert.equal(r.savedItems[0].whatsApp, digits);
    assert.equal(Object.hasOwn(r.savedItems[0], 'phoneCountry'), false);
    const mail = r.outboundEmails[0];
    assert.ok(mail.textContent.includes(`Phone / WhatsApp: ${display}`));
    assert.ok(mail.htmlContent.includes(display));
    assert.ok(mail.textContent.includes(`WhatsApp Customer: https://wa.me/${digits}?text=`));
    assert.ok(mail.textContent.includes(`Call Customer: tel:+${digits}`));
    assert.equal(new URL(r.result.whatsappUrl).searchParams.get('phone'), '971557458322');
    assert.ok(new URL(r.result.whatsappUrl).searchParams.get('text').includes(`Phone: ${digits}`));
    assert.equal(r.calls.filter(url => url.endsWith('/query')).length, 3);
  });
}

test('invalid numbers and unsupported country values fail before Wix authentication, queries, saves, email or handoff', async () => {
  for (const data of [
    { phoneCountry: 'AE', whatsapp: '050123' }, { phoneCountry: 'AE', whatsapp: '0000000000' },
    { phoneCountry: 'AE', whatsapp: '07742 107109' }, { phoneCountry: 'XX', whatsapp: '+971501234567' },
    { phoneCountry: null, whatsapp: '+971501234567' }, { phoneCountry: ['AE'], whatsapp: '+971501234567' },
    { phoneCountry: 'AE', whatsapp: '+971971501234567' }, { whatsapp: '07742107109' },
    { phoneCountry: 'AE', whatsapp: '+971501234567 ext 2' },
    { phoneCountry: undefined, whatsapp: '2025550123' }, { phoneCountry: undefined, whatsapp: '971501234567' }
  ]) {
    const r = await exerciseRoute({ data, tokenFails: true });
    assert.equal(r.response.status, 400, JSON.stringify(data));
    assert.equal(r.result.ok, false);
    assert.equal(r.result.whatsappUrl, undefined);
    assert.deepEqual(r.calls, []);
    assert.deepEqual(r.savedItems, []);
    assert.deepEqual(r.outboundEmails, []);
  }
});

test('country-aware production payload keeps lowercase field and normalized international digits', async () => {
  const r = await exerciseRoute({ seoEnvironment: 'production', buildCollection: 'QuoteRequests', notificationMode: 'off',
    data: { phoneCountry: 'PK', whatsapp: '0300 1234567' } });
  assert.equal(r.response.status, 200);
  assert.equal(r.savedItems[0].whatsapp, '923001234567');
  assert.equal(Object.hasOwn(r.savedItems[0], 'whatsApp'), false);
  assert.equal(r.outboundEmails.length, 0);
});

test('older clients with explicit international prefixes remain compatible without a country field', async () => {
  for (const whatsapp of ['+971501234567', '+447742107109', '00923001234567']) {
    const r = await exerciseRoute({ data: { whatsapp, phoneCountry: undefined }, notificationMode: 'off' });
    assert.equal(r.response.status, 200);
    assert.equal(r.savedItems[0].whatsApp, normalizePhoneNumber(whatsapp).digits);
  }
});
