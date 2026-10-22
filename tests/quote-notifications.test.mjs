import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { buildQuoteEmail, notificationKey, notifySavedQuote, quoteSourcePath } from '../src/lib/quote-notifications.ts';
import { requireQuoteRequestsCollectionId } from '../src/lib/quote-collection.ts';
import { isValidPhoneNumber } from '../src/lib/phone.ts';

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
const routeCode = stripTypeScriptTypes(routeSource.replace(/^import .*;\n/gm, '').replace(/export /g, '').replaceAll('import.meta.env.WIX_QUOTE_REQUESTS_COLLECTION_ID', 'buildCollection').replaceAll('import.meta.env.PUBLIC_SEO_ENV', "'staging'"));
const createRoute = new Function('wixClient', 'env', 'waitUntil', 'notifySavedQuote', 'quoteSourcePath', 'requireQuoteRequestsCollectionId', 'isValidPhoneNumber', 'fetch', 'buildCollection', `${routeCode}\nreturn POST;`);
async function exerciseRoute({ insertStatus = 200, data = {}, providerFails = false, ledgerFails = false, notificationMode = 'staging-test', runtimeCollection, buildCollection = 'QuoteRequestsStaging', buildMissing = false, tokenFails = false, validationStatus = 200, scheduleFails = false } = {}) {
  const { env, sql } = setup(); env.QUOTE_EMAIL_MODE = notificationMode;
  if (runtimeCollection !== undefined) env.WIX_QUOTE_REQUESTS_COLLECTION_ID = runtimeCollection;
  if (ledgerFails) env.QUOTE_NOTIFICATIONS_DB = { prepare() { throw new Error('mock ledger error'); } };
  const calls = []; const pending = [];
  const transport = async (url, init) => {
    calls.push(url);
    if (url.endsWith('/query')) return Response.json({ dataItems: [{ id: 'valid-catalogue-entry' }] }, { status: validationStatus });
    if (url === 'https://www.wixapis.com/data/v2/items') {
      assert.equal(JSON.parse(init.body).dataCollectionId, 'QuoteRequestsStaging');
      return Response.json({ dataItem: { id: 'wix-enquiry-1' } }, { status: insertStatus });
    }
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    assert.ok(calls.includes('https://www.wixapis.com/data/v2/items'));
    if (providerFails) throw new Error('mock provider outage');
    return accepted();
  };
  const route = createRoute({ auth: { generateVisitorTokens: async () => { if (tokenFails) throw new Error('mock token failure'); return { accessToken: { value: 'mock-visitor-token' } }; } } }, env, promise => { pending.push(promise); if (scheduleFails) throw new Error('mock scheduler failure'); }, (settings, saved, stage) => notifySavedQuote(settings, saved, stage, transport), quoteSourcePath, requireQuoteRequestsCollectionId, isValidPhoneNumber, transport, buildMissing ? undefined : buildCollection);
  const response = await route({ request: new Request('https://preview.example.test/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ make: quote.make, model: quote.model, year: quote.year, name: quote.customerName, whatsapp: quote.whatsapp, submissionId: quote.submissionId, ...data }) }) });
  const result = await response.json();
  await Promise.all(pending);
  const rows = sql.prepare('SELECT * FROM quote_email_deliveries').all(); sql.close();
  return { response, result, calls, rows };
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
