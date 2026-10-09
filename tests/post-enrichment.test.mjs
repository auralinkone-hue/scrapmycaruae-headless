import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { loadPostPageEnrichment } from '../src/lib/post-enrichment.ts';

const readProjectFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('a valid post keeps rendering when the related-post request fails', async () => {
  const enrichment = await loadPostPageEnrichment({
    loadAuthor: async () => ({ name: 'SMC UAE Team', photoUrl: '' }),
    loadCategoryBreadcrumb: async () => ({ label: 'Car advice', href: '/blogs/category/car-advice' }),
    loadRelatedPosts: async () => {
      throw new Error('related posts unavailable');
    }
  });

  assert.deepEqual(enrichment.relatedPosts, []);
  assert.equal(enrichment.author?.name, 'SMC UAE Team');
  assert.equal(enrichment.categoryBreadcrumb?.label, 'Car advice');
});

test('a valid post keeps rendering when author or category enrichment fails', async () => {
  const enrichment = await loadPostPageEnrichment({
    loadAuthor: async () => {
      throw new Error('author unavailable');
    },
    loadCategoryBreadcrumb: async () => {
      throw new Error('category unavailable');
    },
    loadRelatedPosts: async () => [{ slug: 'another-article' }]
  });

  assert.equal(enrichment.author, null);
  assert.equal(enrichment.categoryBreadcrumb, null);
  assert.deepEqual(enrichment.relatedPosts, [{ slug: 'another-article' }]);
});

test('post route keeps essential article HTML separate from optional enrichment', async () => {
  const page = await readProjectFile('src/pages/post/[slug].astro');

  assert.match(page, /posts\.getPostBySlug/);
  assert.match(page, /loadPostPageEnrichment/);
  assert.match(page, /<h1>\{postTitle\}<\/h1>/);
  assert.match(page, /<article class="article-content" set:html=\{articleHtml\}/);
  assert.match(page, /'@type': 'BlogPosting'/);
  assert.match(page, /getBreadcrumbJsonLd/);
  assert.match(page, /relatedPosts\.filter\(isRenderableRelatedPost\)/);
  assert.match(page, /asSafeText\(post\?\.media\?\.altText, postTitle\)/);
});

test('related article cards protect malformed optional Wix values', async () => {
  const card = await readProjectFile('src/components/BlogArticleCard.astro');

  assert.doesNotMatch(card, /altText\?\.trim\(\)/);
  assert.match(card, /asSafeText\(postImage\?\.altText, postTitle\)/);
  assert.match(card, /asValidDate\(post\?\.firstPublishedDate\)/);
  assert.match(card, /asSafeArticleSlug\(post\?\.slug\)/);
});

test('missing essential article data returns a semantic not-found page, not a blank page', async () => {
  const page = await readProjectFile('src/pages/post/[slug].astro');

  assert.match(page, /Astro\.response\.status = 404/);
  assert.match(page, /if \(!result\?\.post\)/);
  assert.match(page, /<h1>Article not found<\/h1>/);
  assert.doesNotMatch(page, /Promise\.all\(\[\s*getBlogAuthor/);
});
