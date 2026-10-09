import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Wix responsive-image transformation falls back to the original source', async () => {
  const source = await readFile(new URL('../src/lib/wix-image.ts', import.meta.url), 'utf8');

  assert.match(source, /try \{\s*return media\.getScaledToFillImageUrl/s);
  assert.match(source, /unsupported Wix media record must not abort the surrounding SSR page/);
  assert.match(source, /catch \{[\s\S]*return source;/);
});
