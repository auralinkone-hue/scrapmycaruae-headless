import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createBlogArchivePostsQuery,
  readBlogArchivePostsResponse
} from '../src/lib/blog-archive-query.ts';

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

  const allArticlesQuery = createBlogArchivePostsQuery(1, 12);
  const allArticlesPageTwoQuery = createBlogArchivePostsQuery(2, 12);
  const categoryQuery = createBlogArchivePostsQuery(2, 12, 'safety-category');

  assert.deepEqual(allArticlesQuery, {
    paging: { limit: 12, offset: 0 },
    sort: [{ fieldName: 'firstPublishedDate', order: 'DESC' }]
  });
  assert.deepEqual(allArticlesPageTwoQuery.paging, { limit: 12, offset: 12 });
  assert.equal('filter' in allArticlesPageTwoQuery, false);
  assert.deepEqual(categoryQuery.filter, {
    categoryIds: { $hasSome: ['safety-category'] }
  });
  assert.match(page, /wixClient\.posts\.queryPosts\(/);
  assert.match(page, /createBlogArchivePostsQuery\(requestedPage, PAGE_SIZE, activeCategory\?\._id\)/);
  assert.match(page, /requestedCategorySlug && !categoryLoadFailed && !activeCategory/);
  assert.match(page, /Astro\.redirect\('\/blogs', 302\)/);
  assert.doesNotMatch(page, /posts\.filter\(/);
});

test('All Articles keeps categorized and uncategorized posts from the real Wix response shape', () => {
  const categorizedPost = { _id: 'post-1', slug: 'existing-one', title: 'Existing one', categoryIds: ['safety-category'] };
  const uncategorizedPost = { _id: 'post-2', slug: 'existing-two', title: 'Existing two', categoryIds: [] };
  const response = {
    posts: [categorizedPost, uncategorizedPost],
    pagingMetadata: { total: 2 }
  };

  assert.deepEqual(readBlogArchivePostsResponse(response), {
    posts: [categorizedPost, uncategorizedPost],
    totalCount: 2
  });
});

test('Wix post API failure is not shown as an empty category', async () => {
  const page = await readArchive();

  assert.match(page, /let postQueryFailed = false/);
  assert.match(page, /postQueryFailed = true/);
  assert.match(page, /Unable to load articles right now\. Please try again shortly\./);
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
  assert.match(page, /postCategory && <span class="category-badge"/);
  assert.match(page, /right: 12px/);
  assert.match(page, /top: 12px/);
  assert.doesNotMatch(page, /getPostCategory/);
  assert.doesNotMatch(page, /Uncategorized/);
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


test('More menu uses a real consistently sized down-caret icon with state transition', async () => {
  const archive = await readArchive();
  assert.match(archive, /More <i class="ph ph-caret-down" aria-hidden="true"><\/i>/);
  assert.match(archive, /\.more-categories\[open\] summary \.ph \{ transform: rotate\(180deg\)/);
  assert.doesNotMatch(archive, /More <span aria-hidden="true">⌄<\/span>/);
});

test('archive media reserves space and marks its load state for the premium shimmer', async () => {
  const archive = await readArchive();
  assert.match(archive, /class:list=\{\['card-image', responsiveImage\.src && 'blog-media-load'\]\}/);
  assert.match(archive, /blog-media-enhanced/);
});

test('mobile More dropdown stays outside the horizontally scrollable category rail', async () => {
  const page = await readArchive();
  const railEnd = page.indexOf('</div>\n      {moreCategories.length > 0 && (');
  const moreStart = page.indexOf('<details class:list=');
  const navEnd = page.indexOf('</nav>', moreStart);
  assert.ok(railEnd > 0 && moreStart > railEnd && navEnd > moreStart, 'More must be a sibling of the scroll rail');
  assert.match(page, /\.category-nav \{[^}]*overflow: visible/);
  assert.match(page, /\.more-menu \{[^}]*position: absolute/);
  assert.doesNotMatch(page, /\.more-menu \{ position: fixed/);
  assert.match(page, /aria-controls="more-blog-categories"/);
  assert.match(page, /menu\.addEventListener\('toggle', syncExpandedState\)/);
  assert.doesNotMatch(page, /role="menuitem"/);
});
