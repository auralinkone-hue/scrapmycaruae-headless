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
  assert.doesNotMatch(page, /Scrap My Car UAE Blog/);
  assert.match(page, /<article class="article-content" set:html=\{articleHtml\}/);
  assert.match(page, /'@type': 'BlogPosting'/);
  assert.match(page, /getBreadcrumbJsonLd/);
  assert.match(page, /relatedPosts\.filter\(isRenderableRelatedPost\)/);
  assert.match(page, /asSafeText\(post\?\.media\?\.altText, postTitle\)/);
  assert.match(page, /Promise\.allSettled\(\[getVehicleData\(\), getLatestPosts\(post\)\]\)/);
  assert.match(page, /canRenderSidebarForm/);
  assert.match(page, /article-content :global\(li::marker\) \{\s*color: #5DB938;/);
});

test('blog article sidebar keeps Wix failures optional and reuses the quote form', async () => {
  const page = await readProjectFile('src/pages/post/[slug].astro');
  const quoteForm = await readProjectFile('src/components/QuoteForm.astro');
  const latestSidebar = await readProjectFile('src/components/LatestBlogsSidebar.astro');

  assert.match(page, /<QuoteForm makes=\{vehicleData\.makes\} models=\{vehicleData\.models\} years=\{vehicleData\.years\} variant="blog-sidebar"/);
  assert.match(page, /<LatestBlogsSidebar posts=\{latestPosts\}/);
  assert.match(page, /<aside class="article-sidebar" aria-label="Get your car price and latest blogs">/);
  assert.match(page, /<section class="blog-sidebar-form"[\s\S]*?<LatestBlogsSidebar posts=\{latestPosts\}/);
  assert.doesNotMatch(page, /<LatestBlogsSidebar posts=\{latestPosts\} variant="grid"/);
  assert.doesNotMatch(page, /position: sticky/);
  assert.match(page, /<div class="article-share">[\s\S]*?<\/div>[\s\S]*?<aside class="article-sidebar"/);
  assert.match(quoteForm, /variant\?: 'default' \| 'blog-sidebar'/);
  assert.match(quoteForm, /Get your car price/);
  assert.match(quoteForm, /\/api\/quote/);
  assert.match(latestSidebar, /#2457e6/);
  assert.match(latestSidebar, /responsiveImage\.src \?/);
  assert.doesNotMatch(quoteForm, /\{isBlogSidebar && <p class="fine-print">/);
  assert.match(quoteForm, /background: #184D2B/);
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
