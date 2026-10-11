import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readArchive = () => readFile(new URL('../src/pages/blogs.astro', import.meta.url), 'utf8');

test('archive loads Wix categories once and retains the normal archive on category failure', async () => {
  const page = await readArchive();

  assert.match(page, /wixClient\.categories\s*\.queryCategories\(\)\s*\.ascending\('displayPosition'\)\s*\.limit\(100\)\s*\.find\(\)/);
  assert.match(page, /categoryLoadFailed = true/);
  assert.match(page, /Unable to load Wix Blog categories/);
  assert.match(page, /let posts: any\[\] = \[\]/);
});

test('archive filters valid categories in the server-side Wix post query and rejects invalid slugs', async () => {
  const page = await readArchive();

  assert.match(page, /postQuery = postQuery\.hasSome\('categoryIds', \[activeCategory\._id\]\)/);
  assert.match(page, /requestedCategorySlug && !categoryLoadFailed && !activeCategory/);
  assert.match(page, /Astro\.redirect\('\/blogs', 302\)/);
  assert.doesNotMatch(page, /posts\.filter\(/);
});

test('archive pagination keeps the selected category', async () => {
  const page = await readArchive();

  assert.match(page, /searchParams\.set\('category', activeCategory\.slug\)/);
  assert.match(page, /searchParams\.set\('page', String\(page\)\)/);
  assert.match(page, /href=\{archiveUrl\(requestedPage \+ 1\)\}/);
});

test('archive badges use the loaded category map without per-card category requests', async () => {
  const page = await readArchive();

  assert.match(page, /const categoryById = new Map\(categories\.map/);
  assert.match(page, /post\.categoryIds/);
  assert.match(page, /class="category-badge"/);
  assert.match(page, /right: 12px/);
  assert.match(page, /top: 12px/);
  assert.doesNotMatch(page, /getPostCategory/);
});

test('archive card hierarchy publishes dates and removes author UI', async () => {
  const page = await readArchive();

  assert.match(page, /firstPublishedDate/);
  assert.match(page, /new Intl\.DateTimeFormat\('en-GB'/);
  assert.match(page, /class="read-more"/);
  assert.doesNotMatch(page, /getBlogAuthor/);
  assert.doesNotMatch(page, /author-line/);
});

test('category navigation exposes accessible mobile and More-menu behaviour', async () => {
  const page = await readArchive();

  assert.match(page, /<nav class="category-nav" aria-label="Blog categories">/);
  assert.match(page, /aria-expanded="false"/);
  assert.match(page, /menu\.removeAttribute\('open'\)/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /overflow-x: auto/);
  assert.match(page, /scrollbar-width: none/);
});
