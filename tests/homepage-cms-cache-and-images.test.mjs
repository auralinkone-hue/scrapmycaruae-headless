import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('homepage CMS images are normalized before templates render them', async () => {
  const loader = await readSource('../src/lib/homepage-content.ts');
  const page = await readSource('../src/pages/index.astro');
  const images = await readSource('../src/lib/wix-image.ts');

  assert.match(images, /export function normalizeWixImage/);
  assert.match(images, /media\.getImageUrl\(source\)/);
  assert.match(loader, /conditionsImage: normalizeCmsImage\(page\.conditionsImage\)/);
  assert.match(loader, /coverageImage: normalizeCmsImage\(page\.coverageImage\)/);
  assert.match(page, /const conditionsResponsiveImage = wixResponsiveImage/);
  assert.match(page, /const coverageResponsiveImage = wixResponsiveImage/);
  assert.doesNotMatch(page, /src=\{home\.conditionsImage/);
  assert.doesNotMatch(page, /src=\{home\.coverageImage/);
});

test('homepage CMS loader uses an edge cache with a stale fallback', async () => {
  const loader = await readSource('../src/lib/homepage-content.ts');

  assert.match(loader, /caches\.default\.match\(EDGE_CACHE_KEY\)/);
  assert.match(loader, /caches\.default\.put/);
  assert.match(loader, /const FRESH_CACHE_TTL_MS = 5 \* 60 \* 1000/);
  assert.match(loader, /serving stale edge content/);
  assert.match(loader, /serving the verified fallback content/);
});
