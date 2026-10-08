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

test('does not attempt CRM calls when the server-only key is absent', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('fetch should not run'); };
  try {
    const result = await syncQuoteContact({
      runtimeEnv: {},
      normalizedPhone: '+971557458322',
      customerName: 'Staging Test',
      labelName: 'Headless Staging Test'
    });
    assert.deepEqual(result, { synced: false, reason: 'unconfigured' });
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
    if (String(url).endsWith('/v4/bulk/contacts/add-remove-labels')) return jsonResponse({ jobId: 'label-job' });
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
    assert.equal(requests.at(-1).url.endsWith('/v4/bulk/contacts/add-remove-labels'), true);
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
    if (String(url).endsWith('/v4/bulk/contacts/add-remove-labels')) return jsonResponse({ jobId: 'label-job' });
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
    assert.match(String(createRequest.init.body), /\+971557458322/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
