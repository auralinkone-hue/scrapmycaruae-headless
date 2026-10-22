import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const getFile = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('blog articles have a real reading progress bar tied to the reading content, not the footer', async () => {
  const [article, progress] = await Promise.all([
    getFile('src/pages/post/[slug].astro'),
    getFile('src/components/BlogReadingProgress.astro'),
  ]);
  assert.match(article, /<BlogReadingProgress\s*\/>/);
  assert.match(progress, /class="blog-reading-progress"/);
  assert.match(progress, /\.article-content/);
  assert.match(progress, /window\.scrollY\s*\/\s*finishAt/);
  assert.match(progress, /addEventListener\('scroll', requestUpdate, \{ passive: true \}\)/);
  assert.match(progress, /requestAnimationFrame\(update\)/);
  assert.match(progress, /prefers-reduced-motion/);
});

test('blog images use subtle real load-triggered animation and reduced-motion support', async () => {
  const [article, archive, style, layout] = await Promise.all([
    getFile('src/pages/post/[slug].astro'),
    getFile('src/pages/blogs.astro'),
    getFile('src/styles/blog-media-loading.css'),
    getFile('src/layouts/BaseLayout.astro'),
  ]);
  assert.match(article, /class="cover-wrap blog-media-load" data-image-loading/);
  assert.match(article, /\.article-content figure/);
  assert.match(article, /image\.addEventListener\('error', finish/);
  assert.match(archive, /class="card-image blog-media-load" data-image-loading/);
  assert.match(style, /\.blog-media-load\.is-loaded img/);
  assert.match(style, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(layout, /document\.querySelectorAll\('\[data-image-loading\]'\)/);
});
