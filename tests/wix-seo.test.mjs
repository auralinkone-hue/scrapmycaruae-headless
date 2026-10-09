import assert from 'node:assert/strict';
import test from 'node:test';

import { asTrimmedString } from '../src/lib/wix-seo-values.ts';

test('Wix SEO preserves a valid string title value', () => {
  assert.equal(asTrimmedString(' Wix title '), 'Wix title');
});

test('non-string Wix SEO title data is rejected safely', () => {
  assert.equal(asTrimmedString(['unexpected', 'title']), '');
  assert.equal(asTrimmedString({ value: 'title' }), '');
});

test('Wix SEO parser guards malformed tag collections', async () => {
  const source = await (await import('node:fs/promises')).readFile(
    new URL('../src/lib/wix-seo.ts', import.meta.url),
    'utf8'
  );

  assert.match(source, /Array\.isArray\(rawTags\)/);
  assert.match(source, /asTrimmedString\(findTag\(tags, \(tag\) => tag\.type === 'title'\)\?\.children\)/);
});
