import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { createBlogArchivePostsQuery, readBlogArchivePostsResponse } from '../src/lib/blog-archive-query.ts';
import { defaultSocialImage, defaultSocialImageAlt, serviceSchemaForPath, serializeJsonLd } from '../src/lib/structured-data.ts';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const source = await read('src/pages/blogs.astro');
const stripImports = value => value.replace(/^import[\s\S]*?;\n/gm, '').replace(/export /g, '');
const frontmatter = stripImports(source.split('---')[1]);
// Wrap before stripping types: Astro frontmatter permits early redirect returns.
const code = stripTypeScriptTypes(`async function execute() { ${frontmatter}
 return { posts, totalCount, totalPages, requestedPage, activeCategory, categories, categoryLoadFailed,
 postQueryFailed, archiveUrl, getPostHref, getPostImage, getPrimaryCategory, formatDate }; }`);
const execute = new Function('Astro', 'wixClient', 'createBlogArchivePostsQuery', 'readBlogArchivePostsResponse', 'console', code + ';return execute();');
const category = { _id: 'safety-id', slug: 'safety-precautions', label: 'Safety', postCount: 24 };
const article = { _id: 'original-id', slug: 'imple-steps-to-sell-your-scrap-car-in-uae-for-the-best-price', title: 'Original Wix title', categoryIds: ['safety-id'],
  media: { wixMedia: { image: { url: 'https://static.wixstatic.com/media/original.webp', width: 1200, height: 675 } } }, firstPublishedDate: '2026-01-02T00:00:00Z' };
const fail = status => async () => { throw Object.assign(new Error('Mock upstream error'), { response: { status } }); };
const throws = error => async () => { throw error; };
async function route(path = '/blogs', options = {}) {
  const calls = { categories: 0, posts: [] };
  const Astro = { url: new URL(path, 'https://www.scrapmycaruae.com'), response: { status: 200, headers: new Headers() },
    redirect: (location, status) => new Response(null, { status, headers: { Location: location } }) };
  const wixClient = {
    categories: { queryCategories() { calls.categories++; return { ascending() { return this; }, limit() { return this; },
      find: options.categories || (async () => ({ items: [category] })) }; } },
    posts: { async queryPosts(query) { calls.posts.push(query); return (options.posts || (async () => ({ posts: [article], pagingMetadata: { total: 24 } })))(query); } }
  };
  const result = await execute(Astro, wixClient, createBlogArchivePostsQuery, readBlogArchivePostsResponse, { error() {} });
  return { result, calls, status: result instanceof Response ? result.status : Astro.response.status,
    headers: result instanceof Response ? result.headers : Astro.response.headers };
}
function unavailable(value) {
  assert.equal(value.status, 503);
  assert.equal(value.headers.get('location'), null);
  assert.equal(value.headers.get('cache-control'), 'no-store');
  assert.equal(value.headers.get('retry-after'), '60');
  assert.deepEqual(value.result.posts, []);
  assert.equal(value.result.postQueryFailed, true);
}

test('valid page 1 preserves the original Wix article, images, links, sorting and request budget', async () => {
  const r = await route();
  assert.equal(r.status, 200); assert.equal(r.result.posts[0], article);
  assert.equal(r.result.getPostHref(article), '/post/' + article.slug);
  assert.equal(r.result.getPostImage(article), article.media.wixMedia.image);
  assert.equal(r.result.getPrimaryCategory(article), category);
  assert.equal(r.result.formatDate(article.firstPublishedDate), '02 Jan 2026');
  assert.equal(r.calls.categories, 1); assert.equal(r.calls.posts.length, 1);
  assert.deepEqual(r.calls.posts[0], { paging: { limit: 12, offset: 0 }, sort: [{ fieldName: 'firstPublishedDate', order: 'DESC' }] });
  assert.equal(r.headers.get('retry-after'), null);
});

test('valid page 2 uses the original offset and previous/next URL conventions', async () => {
  const r = await route('/blogs?page=2');
  assert.equal(r.status, 200); assert.equal(r.result.requestedPage, 2);
  assert.deepEqual(r.calls.posts[0].paging, { limit: 12, offset: 12 });
  assert.equal(r.result.totalPages, 2);
  assert.equal(r.result.archiveUrl(1), '/blogs'); assert.equal(r.result.archiveUrl(2), '/blogs?page=2');
});

for (const status of [502, 503, 504]) {
  test(`page-2 Wix ${status} remains HTTP 503 without a redirect or retries`, async () => {
    const r = await route('/blogs?page=2', { posts: fail(status) }); unavailable(r);
    assert.equal(r.calls.posts.length, 1); assert.equal(r.result.requestedPage, 2);
  });
}
for (const error of [new DOMException('Mock timeout', 'TimeoutError'), new TypeError('Mock network failure')]) {
  test(`page-2 ${error.name} is a controlled 503`, async () => {
    unavailable(await route('/blogs?page=2', { posts: throws(error) }));
  });
}

test('failed requested-category lookup returns 503 before any unfiltered post query', async () => {
  for (const categories of [fail(503), fail(502), fail(504), throws(new DOMException('Mock timeout', 'TimeoutError')), throws(new TypeError('Mock network failure'))]) {
    const r = await route('/blogs?category=safety-precautions&page=2', { categories });
    unavailable(r); assert.equal(r.calls.categories, 1); assert.equal(r.calls.posts.length, 0);
  }
});

test('confirmed absent category preserves the intentional 302 without querying posts', async () => {
  for (const categories of [async () => ({ items: [] }), async () => ({ items: [category] })]) {
    const r = await route('/blogs?category=missing-category', { categories });
    assert.equal(r.status, 302); assert.equal(r.headers.get('location'), '/blogs');
    assert.equal(r.calls.posts.length, 0); assert.equal(r.headers.get('retry-after'), null);
  }
});

test('valid selected category is queried once with its exact filter and keeps category pagination', async () => {
  const r = await route('/blogs?category=safety-precautions&page=2');
  assert.equal(r.status, 200); assert.equal(r.result.activeCategory, category);
  assert.deepEqual(r.calls.posts[0].filter, { categoryIds: { $hasSome: ['safety-id'] } });
  assert.deepEqual(r.result.posts, [article]); assert.equal(r.calls.posts.length, 1);
  assert.equal(r.result.archiveUrl(1), '/blogs?category=safety-precautions');
  assert.equal(r.result.archiveUrl(2), '/blogs?category=safety-precautions&page=2');
});

test('malformed essential category responses produce 503, never a missing-category redirect', async () => {
  for (const value of [null, {}, { items: null }, { items: {} }, { items: [null] }, { items: [{}] }, { items: [{ ...category, slug: {} }] }]) {
    const r = await route('/blogs?category=safety-precautions', { categories: async () => value });
    unavailable(r); assert.equal(r.calls.posts.length, 0);
  }
});

test('malformed essential lists, records and pagination produce 503 instead of empty success', async () => {
  const response = (posts, total = 24) => ({ posts, pagingMetadata: { total } });
  for (const value of [null, {}, response(null), response({}), response([],-1), response([],NaN), response([],Infinity), response([],1.5), response([],'24'),
    { posts: [] }, { posts: [], pagingMetadata: {} }, response([null]), response([{}]), response([{ ...article, title: null }]),
    response([{ ...article, slug: '' }]), response([{ ...article, categoryIds: {} }]), response([article],0)]) {
    unavailable(await route('/blogs?page=2', { posts: async () => value }));
  }
});

test('genuinely empty successful archive stays HTTP 200', async () => {
  const r = await route('/blogs', { categories: async () => ({ items: [] }), posts: async () => ({ posts: [], pagingMetadata: { total: 0 } }) });
  assert.equal(r.status, 200); assert.deepEqual(r.result.posts, []); assert.equal(r.result.totalCount, 0);
  assert.equal(r.result.postQueryFailed, false); assert.equal(r.headers.get('retry-after'), null);
});

test('known empty category remains a valid filtered empty state, even with postCount zero', async () => {
  const r = await route('/blogs?category=safety-precautions', { categories: async () => ({ items: [{ ...category, postCount: 0 }] }),
    posts: async () => ({ posts: [], pagingMetadata: { total: 0 } }) });
  assert.equal(r.status, 200); assert.equal(r.result.activeCategory._id, 'safety-id');
  assert.deepEqual(r.result.posts, []); assert.equal(r.result.postQueryFailed, false);
  assert.deepEqual(r.calls.posts[0].filter, { categoryIds: { $hasSome: ['safety-id'] } });
});

test('genuine out-of-range page redirects only after successful retrieval and preserves category', async () => {
  for (const filter of ['', '&category=safety-precautions']) {
    const r = await route('/blogs?page=8' + filter, { posts: async () => ({ posts: [], pagingMetadata: { total: 24 } }) });
    assert.equal(r.status, 302); assert.equal(r.headers.get('location'), filter ? '/blogs?category=safety-precautions' : '/blogs');
    assert.equal(r.calls.posts.length, 1);
  }
});

test('category navigation is optional only for an explicit All Articles request', async () => {
  const r = await route('/blogs?page=2', { categories: fail(503) });
  assert.equal(r.status, 200); assert.equal(r.result.categoryLoadFailed, true);
  assert.equal(r.calls.posts.length, 1); assert.equal(r.calls.posts[0].filter, undefined);
  assert.equal(r.result.posts[0], article);
});

test('unrelated posts returned for a category are rejected, not silently displayed or locally filtered', async () => {
  const r = await route('/blogs?category=safety-precautions', { posts: async () => ({ posts: [{ ...article, categoryIds: ['other-id'] }], pagingMetadata: { total: 1 } }) });
  unavailable(r); assert.equal(r.calls.posts.length, 1);
});

test('a collection API 404 is not proof that the archive or selected category is missing', async () => {
  unavailable(await route('/blogs?page=2', { posts: fail(404) }));
  const r = await route('/blogs?category=safety-precautions', { categories: fail(404) }); unavailable(r);
  assert.equal(r.calls.posts.length, 0);
});

async function seo(environment) {
  const source = stripTypeScriptTypes((await read('src/lib/seo.ts')).replaceAll('import.meta.env', JSON.stringify({ PUBLIC_SEO_ENV: environment, PUBLIC_SITE_URL: 'https://www.scrapmycaruae.com' })));
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}

test('actual layout and middleware preserve canonicals, production success policy and staging/error noindex', async () => {
  const layout = stripTypeScriptTypes(stripImports((await read('src/layouts/BaseLayout.astro')).split('---')[1]).replaceAll('import.meta.env', '{}'));
  const resolve = new Function('Astro','canonicalUrl','robotsContent','siteUrl','defaultSocialImage','defaultSocialImageAlt','serviceSchemaForPath','serializeJsonLd',layout+';return {canonical:resolvedCanonical,robots:resolvedRobots};');
  const middleware = stripTypeScriptTypes(stripImports(await read('src/middleware.ts')));
  const noindexExpression = source.match(/noindex=\{([^}]+)\}/)[1];
  for (const environment of ['production','staging']) {
    const s = await seo(environment);
    const handler = new Function('defineMiddleware','hasUnsafeSeoConfiguration','isAlwaysNoindexPath','isIndexableRequest',middleware+';return onRequest;')(
      fn=>fn, s.hasUnsafeSeoConfiguration, s.isAlwaysNoindexPath, s.isIndexableRequest);
    for (const path of ['/blogs','/blogs?page=2','/blogs?category=safety-precautions&page=2']) {
      for (const broken of [false,true]) {
        const r = await route(path, broken ? { posts: fail(503) } : {});
        const noindex = new Function('activeCategory','postQueryFailed','return '+noindexExpression)(r.result.activeCategory,r.result.postQueryFailed);
        const url = new URL(path, environment === 'production' ? 'https://www.scrapmycaruae.com' : 'https://preview.example.test');
        const resolved = resolve({props:{canonical:'/blogs',noindex},url,isPrerendered:false},s.canonicalUrl,s.robotsContent,s.siteUrl,defaultSocialImage,defaultSocialImageAlt,serviceSchemaForPath,serializeJsonLd);
        assert.equal(resolved.canonical,'https://www.scrapmycaruae.com/blogs');
        assert.equal(resolved.robots,environment==='staging'||broken||r.result.activeCategory?'noindex,nofollow':'index,follow');
        const response = await handler({url},async()=>new Response('',{status:r.status,headers:r.headers}));
        assert.equal(response.status,broken?503:200);
        assert.equal(response.headers.get('x-robots-tag').includes('noindex'),environment==='staging'||broken);
        if(broken){assert.equal(response.headers.get('retry-after'),'60');assert.equal(response.headers.get('cache-control'),'no-store');}
      }
    }
  }
});
