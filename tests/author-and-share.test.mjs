import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('blog authors use public Wix member data with a safe slug and optional About text', async () => {
  const author = await readProjectFile('src/lib/blog-author.ts');
  const wix = await readProjectFile('src/lib/wix.ts');

  assert.match(wix, /membersAbout/);
  assert.match(author, /id: string/);
  assert.match(author, /slug: string/);
  assert.match(author, /profile\?\.slug/);
  assert.match(author, /queryMemberAbouts\(\)/);
  assert.match(author, /eq\('memberId', memberId\)/);
  assert.match(author, /fallbackSlug/);
  assert.match(author, /catch \{\s*return null;/);
});

test('author route queries only the selected author posts and supports cursor pagination', async () => {
  const page = await readProjectFile('src/pages/author/[slug].astro');

  assert.match(page, /getBlogAuthorBySlug/);
  assert.match(page, /\.eq\('memberId', author\.id\)/);
  assert.match(page, /\.descending\('firstPublishedDate'\)/);
  assert.match(page, /\.limit\(PAGE_SIZE\)/);
  assert.match(page, /query\.skipTo\(cursor\)/);
  assert.doesNotMatch(page, /queryPosts\(\)[\s\S]{0,120}\.find\(\)[\s\S]{0,120}filter\(/);
  assert.match(page, /Articles by \{author\.name\}/);
  assert.match(page, /canonical=\{canonical\}/);
});

test('article and archive author links avoid nested anchors and fail safely', async () => {
  const article = await readProjectFile('src/pages/post/[slug].astro');
  const archive = await readProjectFile('src/pages/blogs.astro');

  assert.match(article, /href=\{`\/author\/\$\{author\.slug\}`\}/);
  assert.match(archive, /href=\{`\/author\/\$\{author\.slug\}`\}/);
  assert.match(article, /author\.slug \?/);
  assert.match(archive, /author\?\.slug \?/);
});

test('share controls are visible and available at the article top and bottom', async () => {
  const article = await readProjectFile('src/pages/post/[slug].astro');
  const share = await readProjectFile('src/components/SharePostMenu.astro');

  assert.doesNotMatch(share, /dots-three-vertical/);
  assert.match(share, /ph-share-network/);
  assert.match(share, /<span>\{label\}<\/span>/);
  assert.match(share, /Share this article/);
  assert.match(share, /Link copied/);
  assert.match(article, /article-opening__actions[\s\S]*?<SharePostMenu/);
  assert.match(article, /<div class="article-share">[\s\S]*?Share this article[\s\S]*?<SharePostMenu/);
});
