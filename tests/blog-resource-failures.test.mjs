import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { blogLoadErrorStatus } from '../src/lib/blog-load-status.ts';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const stripImports = source => source.replace(/^import[\s\S]*?;\n/gm, '').replace(/export /g, '');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const category = { _id: 'category-id', label: 'Car advice', slug: 'car-advice', description: 'Existing Wix description.' };
const member = { _id: '12345678-1234-4123-8123-123456789abc', profile: { nickname: 'SMC UAE Team', slug: 'smc-uae' } };
const chain = find => ({ eq() { return this; }, hasSome() { return this; }, descending() { return this; }, limit() { return this; }, skipTo() { return this; }, find });
const failure = status => Object.assign(new Error('Upstream failure'), { status });
const throwError = error => async () => { throw error; };
function client(overrides = {}) {
  return {
    categories: { getCategoryBySlug: async () => ({ category }) },
    posts: { queryPosts: () => chain(async () => ({ items: [] })), getPostBySlug: async () => ({ post: { slug: 'protected-article' } }) },
    members: { queryMembers: () => chain(async () => ({ items: [member] })), getMember: async () => member },
    membersAbout: { queryMemberAbouts: () => chain(async () => ({ items: [] })) },
    ...overrides
  };
}
async function loaders(wixClient) {
  const code = stripTypeScriptTypes(stripImports(await read('src/lib/blog-author.ts')));
  return new Function('wixClient', 'blogLoadErrorStatus', code + ';return {getBlogAuthorBySlug,getBlogAuthor};')(wixClient, blogLoadErrorStatus);
}
async function route(kind, wixClient) {
  const paths = { category: 'src/pages/blogs/category/[slug].astro', author: 'src/pages/author/[slug].astro', post: 'src/pages/post/[slug].astro' };
  let code = (await read(paths[kind])).split('---')[1];
  // Essential post-load block only; optional enrichment has separate regressions.
  if (kind === 'post') code = code.split('const { author, categoryBreadcrumb, relatedPosts }')[0];
  code = stripTypeScriptTypes(stripImports(code));
  const Astro = { params: { slug: kind === 'post' ? 'protected-article' : kind === 'author' ? 'smc-uae' : 'car-advice' },
    url: new URL('https://www.scrapmycaruae.com/'), response: { status: 200, headers: new Headers() } };
  const dependencies = { Astro, wixClient, blogLoadErrorStatus, ...(await loaders(wixClient)) };
  const values = kind === 'category' ? '{category,posts,canonical,title,description,temporarilyUnavailable}'
    : kind === 'author' ? '{author,posts,canonical,title,description,temporarilyUnavailable}' : '{post,articleTemporarilyUnavailable}';
  const result = await new AsyncFunction(...Object.keys(dependencies), code + ';return ' + values)(...Object.values(dependencies));
  return { ...result, status: Astro.response.status, headers: Astro.response.headers };
}
function unavailable(result) {
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('retry-after'), '60');
  assert.equal(result.headers.get('cache-control'), 'no-store');
}
const transient = [failure(502), failure(503), failure(504), new DOMException('Timed out', 'TimeoutError'), new TypeError('Network unavailable')];

test('installed Wix SDK response.status shape preserves genuine missing versus temporary failures on all routes', async () => {
  for (const status of [404, 502, 503, 504]) {
    const error = Object.assign(new Error('Wix SDK error'), { response: { status, data: { details: { applicationError: { code: 'POST_NOT_FOUND' } } } } });
    const results = [
      await route('category', client({ categories: { getCategoryBySlug: throwError(error) } })),
      await route('author', client({ members: { queryMembers: () => chain(throwError(error)) } })),
      await route('post', client({ posts: { getPostBySlug: throwError(error) } }))
    ];
    for (const result of results) {
      if (status === 404) assert.equal(result.status, 404);
      else unavailable(result);
    }
  }
});

for (const [index, error] of transient.entries()) {
  test(`category and author identity failures remain temporary: case ${index + 1}`, async () => {
    unavailable(await route('category', client({ categories: { getCategoryBySlug: throwError(error) } })));
    unavailable(await route('author', client({ members: { queryMembers: () => chain(throwError(error)) } })));
    unavailable(await route('post', client({ posts: { getPostBySlug: throwError(error) } })));
  });
}

test('confirmed missing category, author and post retain genuine 404 without retry headers', async () => {
  const results = [
    await route('category', client({ categories: { getCategoryBySlug: throwError(failure(404)) } })),
    await route('author', client({ members: { queryMembers: () => chain(async () => ({ items: [] })) } })),
    await route('author', client({ members: { queryMembers: () => chain(throwError(failure(404))) } })),
    await route('post', client({ posts: { getPostBySlug: throwError(failure(404)) } })),
    await route('post', client({ posts: { getPostBySlug: throwError({ details: { applicationError: { code: 'POST_NOT_FOUND' } } }) } }))
  ];
  for (const result of results) { assert.equal(result.status, 404); assert.equal(result.headers.get('retry-after'), null); }
});

test('malformed success responses are not evidence that categories, authors or posts are missing', async () => {
  for (const response of [null, {}, { category: null }, { category: { ...category, label: {} } }]) {
    unavailable(await route('category', client({ categories: { getCategoryBySlug: async () => response } })));
  }
  for (const response of [null, {}, { items: null }, { items: [null] }, { items: [{}] }]) {
    unavailable(await route('author', client({ members: { queryMembers: () => chain(async () => response) } })));
  }
  for (const response of [null, {}, { post: [] }, { post: {} }, { post: { slug: {} } }]) {
    unavailable(await route('post', client({ posts: { getPostBySlug: async () => response } })));
  }
});

test('a category article-list failure cannot make a confirmed category disappear', async () => {
  for (const find of [throwError(failure(404)), throwError(failure(503)), async () => ({ items: null })]) {
    const result = await route('category', client({ posts: { queryPosts: () => chain(find) } }));
    unavailable(result);
    assert.equal(result.canonical, '/blogs/category/car-advice');
    assert.equal(result.title, 'Car advice | Scrap My Car UAE Blog');
  }
});

test('valid category, author and post retain metadata and empty-list success behavior', async () => {
  const c = await route('category', client());
  assert.equal(c.status, 200); assert.deepEqual(c.posts, []);
  assert.equal(c.canonical, '/blogs/category/car-advice'); assert.equal(c.description, category.description);
  const a = await route('author', client());
  assert.equal(a.status, 200); assert.equal(a.canonical, '/author/smc-uae');
  assert.equal(a.title, 'Articles by SMC UAE Team | Scrap My Car UAE');
  assert.deepEqual(a.posts, []); assert.equal(a.temporarilyUnavailable, false);
  const p = await route('post', client()); assert.equal(p.status, 200); assert.equal(p.post.slug, 'protected-article');
});

test('member-ID author lookup propagates outages/malformed data but keeps genuine missing results', async () => {
  for (const getMember of [throwError(failure(503)), async () => null, async () => ({})]) {
    const l = await loaders(client({ members: { getMember } }));
    await assert.rejects(l.getBlogAuthorBySlug('member-' + member._id));
  }
  const l = await loaders(client({ members: { getMember: throwError(failure(404)) } }));
  assert.equal(await l.getBlogAuthorBySlug('member-' + member._id), null);
  assert.equal(await l.getBlogAuthorBySlug('invalid/slug'), null);
});

test('optional article bylines, biography and author post lists still degrade without losing existing content', async () => {
  const l = await loaders(client({ members: { getMember: throwError(failure(503)) } }));
  assert.equal(await l.getBlogAuthor({ memberId: member._id }, { includeAbout: false }), null);
  const bioClient = client({ membersAbout: { queryMemberAbouts: () => chain(throwError(failure(503))) } });
  assert.equal((await (await loaders(bioClient)).getBlogAuthorBySlug('smc-uae')).name, member.profile.nickname);
  const result = await route('author', client({ posts: { queryPosts: () => chain(throwError(failure(503))) } }));
  assert.equal(result.status, 200); assert.equal(result.author.name, member.profile.nickname);
});

test('temporary error views use noindex and generic retry copy without changing success UI', async () => {
  for (const kind of ['author', 'category']) {
    const source = await read(`src/pages/${kind === 'author' ? 'author' : 'blogs/category'}/[slug].astro`);
    assert.match(source, /temporarilyUnavailable \? '(?:Author|Category) temporarily unavailable'/);
    assert.match(source, /Please try again shortly\./);
    assert.match(source, /noindex=\{!(?:author|category)(?: \|\| temporarilyUnavailable)?\}/);
  }
  assert.equal(blogLoadErrorStatus({ status: 503, details: { applicationError: { code: 'POST_NOT_FOUND' } } }), 503);
});
