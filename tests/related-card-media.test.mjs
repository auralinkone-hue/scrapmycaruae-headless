import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { wixResponsiveImage } from '../src/lib/wix-image.ts';

const cardPath = new URL('../src/components/BlogArticleCard.astro', import.meta.url);

test('a valid Wix related-post cover produces a non-empty image source', () => {
  const image = wixResponsiveImage(
    'wix:image://v1/example-cover.jpg#originWidth=1200&originHeight=675',
    { widths: [320, 640] },
  );

  assert.ok(image.src);
  assert.ok(image.srcset);
});

test('missing or malformed related-post media stays source-less', () => {
  assert.equal(wixResponsiveImage(null, { widths: [320] }).src, '');
  assert.equal(wixResponsiveImage({ url: { invalid: true } }, { widths: [320] }).src, '');
});

test('related card emits an image only for a valid resolved source', async () => {
  const card = await readFile(cardPath, 'utf8');

  assert.match(card, /\{responsiveImage\.src \? \(/);
  assert.match(card, /srcset=\{responsiveImage\.srcset \|\| undefined\}/);
  assert.doesNotMatch(card, /webpSrcset/);
  assert.match(card, /responsiveImage\.avifSrcset &&/);
});
