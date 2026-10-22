import assert from 'node:assert/strict';
import test from 'node:test';
import { addStagingNoindexHeaders } from '../scripts/staging-asset-headers.mjs';

const cacheHeaders = '/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n';
test('staging asset responses get noindex without removing immutable asset caching', () => {
  const result = addStagingNoindexHeaders(cacheHeaders, 'staging');
  assert.ok(result.includes(cacheHeaders.trim()));
  assert.match(result, /\/\*\n  X-Robots-Tag: noindex, nofollow, noarchive/);
});
test('production asset headers never inherit a staging noindex rule', () => {
  assert.equal(addStagingNoindexHeaders(cacheHeaders, 'production'), cacheHeaders);
  assert.equal(addStagingNoindexHeaders('', 'production'), '');
});
test('invalid asset header environments fail closed', () => {
  assert.throws(() => addStagingNoindexHeaders('', 'preview'), /Invalid SEO environment/);
});
