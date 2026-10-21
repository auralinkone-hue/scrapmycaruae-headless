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
  assert.match(loader, /valueImage: normalizeCmsImage\(page\.valueImage\)/);
  assert.match(loader, /coverageImage: normalizeCmsImage\(page\.coverageImage\)/);
  assert.match(page, /const conditionsResponsiveImage = wixResponsiveImage/);
  assert.match(page, /const valueResponsiveImage = wixResponsiveImage/);
  assert.match(page, /import UaeCoverageMap/);
  assert.doesNotMatch(page, /UaeCollectionIllustration/);
  assert.doesNotMatch(page, /src=\{home\.conditionsImage/);
  assert.doesNotMatch(page, /src=\{home\.valueImage/);
  assert.doesNotMatch(page, /src=\{home\.coverageImage/);
});

test('value image stays responsive while coverage uses the compact shared map', async () => {
  const loader = await readSource('../src/lib/homepage-content.ts');
  const page = await readSource('../src/pages/index.astro');

  assert.match(loader, /valueImage: ''/);
  assert.match(loader, /valueImageAlt: 'Car prepared for valuation and collection by Scrap My Car UAE'/);
  assert.match(loader, /valueImageDecorative: false/);
  assert.match(page, /widths: \[480, 720, 960, 1200\]/);
  assert.match(page, /fit: 'fit'/);
  assert.match(page, /object-fit: contain/);
  assert.match(page, /<UaeCoverageMap \/>/);
  assert.match(page, /\{valueResponsiveImage\.src && <div class="value-image"/);
  assert.match(page, /loading="lazy"/);
  assert.match(page, /decoding="async"/);
  assert.match(page, /class:list=\{\['value-content-grid', \{ 'value-content-grid--text-only': !valueResponsiveImage\.src \}\]\}/);
});

test('homepage CMS loader uses an edge cache with a stale fallback', async () => {
  const loader = await readSource('../src/lib/homepage-content.ts');

  assert.match(loader, /caches\.default\.match\(EDGE_CACHE_KEY\)/);
  assert.match(loader, /caches\.default\.put/);
  assert.match(loader, /const FRESH_CACHE_TTL_MS = 5 \* 60 \* 1000/);
  assert.match(loader, /homepage-content-cache\.invalid\/v2\/content/);
  assert.match(loader, /Number\.isFinite\(age\) && age >= 0 && age < FRESH_CACHE_TTL_MS/);
  assert.match(loader, /serving stale edge content/);
  assert.match(loader, /serving the verified fallback content/);
});
