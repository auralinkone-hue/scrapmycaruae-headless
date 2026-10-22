import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const source = await readFile(new URL('../src/lib/service-guides.ts', import.meta.url), 'utf8');
const createLoader = new Function('wixClient', stripTypeScriptTypes(source
  .replace(/^import .*;\n/gm, '').replace(/export /g, '')) +
  '\nreturn { getServiceGuidePosts, serviceGuideSlugs };');
const fixture = (items = [], fails = false) => {
  const calls = [];
  const query = {
    hasSome(field, slugs) { calls.push(['hasSome', field, slugs]); return this; },
    limit(value) { calls.push(['limit', value]); return this; },
    async find() { calls.push(['find']); if (fails) throw new Error('Upstream unavailable'); return { items }; }
  };
  return { calls, ...createLoader({ posts: { queryPosts(options) { calls.push(['queryPosts', options]); return query; } } }) };
};
const config = fixture().serviceGuideSlugs;
const guide = (slug, extra = {}) => ({ _id: slug, slug, title: `Wix title for ${slug}`,
  excerpt: 'Original excerpt', firstPublishedDate: '2025-05-01T00:00:00Z',
  media: { wixMedia: { image: 'wix:image://v1/original-cover.jpg' } }, ...extra });

test('each service uses one bounded exact-slug query and returns original Wix records in relevance order', async () => {
  for (const [service, slugs] of Object.entries(config)) {
    const items = slugs.map(slug => guide(slug));
    const f = fixture([...items].reverse());
    const result = await f.getServiceGuidePosts(service);
    assert.deepEqual(f.calls, [['queryPosts', { fieldsets: ['SEO'] }],
      ['hasSome', 'slug', slugs], ['limit', 3], ['find']]);
    assert.deepEqual(result, items);
    assert.equal(result[0], items[0]); // Metadata/media are not synthesized or rewritten.
  }
});

test('missing and unpublished selected guides are omitted without newest-only fallback requests', async () => {
  const slugs = config['scrap-my-car'];
  const f = fixture([guide(slugs[1]), guide('unrelated-newest-article')]);
  assert.deepEqual((await f.getServiceGuidePosts('scrap-my-car')).map(p => p.slug), [slugs[1]]);
  assert.equal(f.calls.filter(c => c[0] === 'find').length, 1);
});

test('active Wix robots/googlebot noindex directives suppress guides; disabled tags do not', async () => {
  const [a, b, c] = config['scrap-my-car'];
  const f = fixture([
    guide(a, { seoData: { tags: [{ props: { name: 'robots', content: 'NOINDEX, follow' } }] } }),
    guide(b, { seoData: { tags: [{ name: 'googlebot', content: 'noindex' }] } }),
    guide(c, { seoData: { tags: [null, { disabled: true, props: { name: 'robots', content: 'noindex' } }] } })
  ]);
  assert.deepEqual((await f.getServiceGuidePosts('scrap-my-car')).map(p => p.slug), [c]);
});

test('malformed, duplicate and unrelated records never produce fake or repeated cards', async () => {
  const [a, b, c] = config['scrap-my-car'];
  const f = fixture([null, guide(a, { title: ' ' }), guide(a), guide(a),
    guide(b, { _id: a }), guide(c, { _id: {} }), guide('other')]);
  assert.deepEqual((await f.getServiceGuidePosts('scrap-my-car')).map(p => p.slug), [a]);
});

test('upstream failure makes one attempt and preserves optional-section graceful failure', async () => {
  const f = fixture([], true);
  assert.deepEqual(await f.getServiceGuidePosts('sell-my-car'), []);
  assert.equal(f.calls.filter(c => c[0] === 'find').length, 1);
  const malformed = fixture(undefined);
  assert.deepEqual(await malformed.getServiceGuidePosts('sell-my-car'), []);
});

test('unknown services never fetch or invent recommendations', async () => {
  const f = fixture();
  assert.deepEqual(await f.getServiceGuidePosts('unknown'), []);
  assert.deepEqual(await f.getServiceGuidePosts('constructor'), []);
  assert.deepEqual(f.calls, []);
});

test('every curated article retains its exact protected URL', async () => {
  const manifest = await readFile(new URL('../docs/seo-migration/protected-wix-blog-url-manifest.txt', import.meta.url), 'utf8');
  const urls = manifest.split(/\r?\n/).filter(line => line.startsWith('https://'));
  assert.equal(urls.length, 588);
  for (const slugs of Object.values(config)) {
    assert.equal(slugs.length, 3);
    assert.equal(new Set(slugs).size, 3);
    for (const slug of slugs) assert.ok(urls.includes(`https://www.scrapmycaruae.com/post/${slug}`), slug);
  }
  // Preserve this existing protected typo exactly; no slug correction/redirect.
  assert.ok(config['scrap-my-car'].includes('imple-steps-to-sell-your-scrap-car-in-uae-for-the-best-price'));
});

test('only the seven newest-only service blocks use the new loader and keep existing card visibility/rendering', async () => {
  for (const service of Object.keys(config)) {
    const page = await readFile(new URL(`../src/pages/${service}.astro`, import.meta.url), 'utf8');
    assert.ok(page.includes(`getServiceGuidePosts('${service}')`));
    assert.doesNotMatch(page, /getLatestPosts/);
    assert.match(page, /helpfulPosts\.length > 0/);
    assert.match(page, /helpfulPosts\.slice\(0, 3\)\.map\(\(post\) => <BlogArticleCard post=\{post\}/);
  }
  const article = await readFile(new URL('../src/pages/post/[slug].astro', import.meta.url), 'utf8');
  assert.match(article, /getLatestPosts\(post\)/);
  assert.doesNotMatch(article, /getServiceGuidePosts/);
});
