import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { requireQuoteRequestsCollectionId } from '../src/lib/quote-collection.ts';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

async function readProjectFile(relativePath) {
  return readFile(new URL(relativePath, new URL('../', import.meta.url)), 'utf8');
}

test('development preview selects QuoteRequestsStaging', async () => {
  const workflow = await readProjectFile('.github/workflows/deploy-development-preview.yml');

  assert.match(
    workflow,
    /^\s*WIX_QUOTE_REQUESTS_COLLECTION_ID:\s*QuoteRequestsStaging\s*$/m
  );
  assert.equal(requireQuoteRequestsCollectionId('QuoteRequestsStaging'), 'QuoteRequestsStaging');
});

test('production remains configurable to use QuoteRequests', () => {
  assert.equal(requireQuoteRequestsCollectionId('QuoteRequests'), 'QuoteRequests');
});

test('missing or invalid collection configuration fails closed', () => {
  for (const value of [undefined, null, '', '   ', 'Quote Requests Staging', '../QuoteRequests']) {
    assert.throws(() => requireQuoteRequestsCollectionId(value), /collection/i);
  }
});

test('collection configuration remains server-only', async () => {
  const [route, quoteForm] = await Promise.all([
    readProjectFile('src/pages/api/quote.ts'),
    readProjectFile('src/components/QuoteForm.astro')
  ]);

  assert.match(route, /import\.meta\.env\.WIX_QUOTE_REQUESTS_COLLECTION_ID/);
  assert.doesNotMatch(route, /PUBLIC_WIX_QUOTE_REQUESTS_COLLECTION_ID/);
  assert.doesNotMatch(quoteForm, /WIX_QUOTE_REQUESTS_COLLECTION_ID|QuoteRequestsStaging/);
  assert.match(quoteForm, /fetch\('\/api\/quote'/);
});

test('quote route has no hardcoded QuoteRequests destination', async () => {
  const route = await readProjectFile('src/pages/api/quote.ts');

  assert.match(route, /dataCollectionId:\s*quoteRequestsCollectionId/);
  assert.doesNotMatch(route, /dataCollectionId:\s*['"]QuoteRequests['"]/);
  assert.doesNotMatch(route, /dataCollectionId:\s*['"]QuoteRequestsStaging['"]/);
});

test('existing Wix field mapping remains unchanged', async () => {
  const route = await readProjectFile('src/pages/api/quote.ts');
  const mappedFields = route.match(
    /data:\s*\{\s*title,\s*make,\s*model,\s*year,\s*customerName,\s*whatsapp,\s*status:\s*'New',\s*source:\s*'Headless Website'\s*\}/s
  );

  assert.ok(mappedFields, `Expected unchanged quote field mapping in ${projectRoot}`);
});
