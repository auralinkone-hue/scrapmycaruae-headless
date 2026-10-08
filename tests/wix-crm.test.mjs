import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeUaeMobilePhone } from '../src/lib/phone.ts';
import { syncQuoteContact } from '../src/lib/wix-crm.ts';

const crmEnv = { WIX_CRM_API_KEY: 'test-key', WIX_CRM_SITE_ID: 'test-site' };
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('normalizes supported UAE mobile formats to E.164', () => {
  for (const phone of ['0557458322', '557458322', '971557458322', '+971557458322']) {
    assert.equal(normalizeUaeMobilePhone(phone), '+971557458322');
  }
  assert.equal(normalizeUaeMobilePhone('055-745-8322'), '+971557458322');
  assert.equal(normalizeUaeMobilePhone('050123'), null);
  assert.equal(normalizeUaeMobilePhone('hello'), null);
});

test('does not attempt CRM calls unless both server-only CRM secrets are present', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('fetch should not run'); };
  try {
    for (const runtimeEnv of [{}, { WIX_CRM_API_KEY: 'test-key' }, { WIX_CRM_SITE_ID: 'test-site' }]) {
      const result = await syncQuoteContact({
        runtimeEnv,
        normalizedPhone: '+971557458322',
        customerName: 'Staging Test',
        labelName: 'Headless Staging Test'
      });
      assert.deepEqual(result, { synced: false, reason: 'unconfigured' });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('reuses an exact phone match, preserves its meaningful name, and applies the label', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/v5/contacts/query')) {
      return jsonResponse({ contacts: [{ id: 'contact-1', revision: '7', name: { first: 'Existing' } }] });
    }
    if (String(url).endsWith('/v4/labels')) return jsonResponse({ label: { key: 'custom.staging' }, newLabel: false });
    if (String(url).endsWith('/v4/contacts/contact-1/labels')) return jsonResponse({ contact: { id: 'contact-1' } });
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await syncQuoteContact({
      runtimeEnv: crmEnv,
      normalizedPhone: '+971557458322',
      customerName: 'New Name',
      labelName: 'Headless Staging Test'
    });
    assert.deepEqual(result, { synced: true, contactId: 'contact-1', created: false });
    assert.equal(requests.some(({ url }) => url.endsWith('/v5/contacts')), false);
    assert.equal(requests.some(({ init }) => init.method === 'PATCH'), false);
    assert.equal(requests.at(-1).url.endsWith('/v4/contacts/contact-1/labels'), true);
    assert.deepEqual(JSON.parse(requests.at(-1).init.body), { labelKeys: ['custom.staging'] });
    for (const { init } of requests) {
      assert.equal(init.headers['wix-site-id'], 'test-site');
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('creates one contact when no exact phone match exists', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/v5/contacts/query')) return jsonResponse({ contacts: [] });
    if (String(url).endsWith('/v5/contacts')) return jsonResponse({ contact: { id: 'contact-2', revision: '1' } });
    if (String(url).endsWith('/v4/labels')) return jsonResponse({ label: { key: 'custom.staging' }, newLabel: true });
    if (String(url).endsWith('/v4/contacts/contact-2/labels')) return jsonResponse({ contact: { id: 'contact-2' } });
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await syncQuoteContact({
      runtimeEnv: crmEnv,
      normalizedPhone: '+971557458322',
      customerName: 'Staging Test',
      labelName: 'Headless Staging Test'
    });
    assert.deepEqual(result, { synced: true, contactId: 'contact-2', created: true });
    const createRequest = requests.find(({ url }) => url.endsWith('/v5/contacts'));
    assert.ok(createRequest);
    const createPayload = JSON.parse(createRequest.init.body);
    assert.equal(createPayload.allowDuplicates, false);
    assert.equal(createPayload.contact.phone.phone, '+971557458322');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('recovers a duplicate create through Find Matching Contacts, not a second query', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/v5/contacts/query')) return jsonResponse({ contacts: [] });
    if (String(url).endsWith('/v5/contacts')) {
      return jsonResponse({ details: { applicationError: { code: 'DUPLICATE_CONTACT_EXISTS' } } }, 400);
    }
    if (String(url).includes('/v5/contacts/find-matching?phone=%2B971557458322')) {
      return jsonResponse({ contacts: [{ id: 'contact-duplicate', revision: '3', name: { first: 'Existing' } }] });
    }
    if (String(url).endsWith('/v4/labels')) return jsonResponse({ label: { key: 'custom.staging' } });
    if (String(url).endsWith('/v4/contacts/contact-duplicate/labels')) return jsonResponse({ contact: { id: 'contact-duplicate' } });
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await syncQuoteContact({
      runtimeEnv: crmEnv,
      normalizedPhone: '+971557458322',
      customerName: 'New Name',
      labelName: 'Headless Staging Test'
    });
    assert.deepEqual(result, { synced: true, contactId: 'contact-duplicate', created: false });
    assert.equal(requests.filter(({ url }) => url.endsWith('/v5/contacts/query')).length, 1);
    const matchingRequest = requests.find(({ url }) => url.includes('/v5/contacts/find-matching?phone=%2B971557458322'));
    assert.ok(matchingRequest);
    assert.equal(matchingRequest.init.method, 'GET');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('does not report CRM synchronization when the synchronous contact label call fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/v5/contacts/query')) {
      return jsonResponse({ contacts: [{ id: 'contact-3', revision: '1', name: { first: 'Existing' } }] });
    }
    if (String(url).endsWith('/v4/labels')) return jsonResponse({ label: { key: 'custom.staging' } });
    if (String(url).endsWith('/v4/contacts/contact-3/labels')) return jsonResponse({ error: 'failed' }, 500);
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    await assert.rejects(
      syncQuoteContact({
        runtimeEnv: crmEnv,
        normalizedPhone: '+971557458322',
        customerName: 'Staging Test',
        labelName: 'Headless Staging Test'
      }),
      /contact labeling failed/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
