import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { articleServiceLinks, getArticleServiceLink } from '../src/lib/article-service-links.ts';

const batch1 = JSON.parse(await readFile(new URL('../docs/qa/phase3-batch1-2026-10-23-evidence.json', import.meta.url), 'utf8'));
const inspected = batch1.articleChecks;
const scrapSlug = 'before-scrapping-how-to-deregister-your-car-in-uae';

test('exactly the seven inspected protected sources link to their approved destinations', () => {
  assert.equal(Object.keys(articleServiceLinks).length, 7);
  for (const { source, target } of inspected) {
    const slug = new URL(source).pathname.slice('/post/'.length);
    const link = getArticleServiceLink(slug, '<p>Unmodified Wix article.</p>');
    assert.equal(link.href, new URL(target).pathname);
    assert.ok(link.anchor.length > 15);
    assert.ok(link.context.length > 50);
    assert.ok(!link.anchor.includes('Click here'));
  }
});

test('all other protected articles and unknown/prototype keys stay unmapped', async () => {
  const manifest = (await readFile(new URL('../docs/seo-migration/protected-wix-blog-url-manifest.txt', import.meta.url), 'utf8'))
    .split(/\r?\n/).filter(line => line.startsWith('https:'));
  assert.equal(manifest.length, 588);
  const slugs = manifest.map(url => new URL(url).pathname.slice('/post/'.length));
  assert.ok(Object.keys(articleServiceLinks).every(slug => slugs.includes(slug)));
  for (const slug of slugs.filter(slug => !Object.hasOwn(articleServiceLinks, slug))) {
    assert.equal(getArticleServiceLink(slug, '<p>Wix content.</p>'), null);
  }
  for (const slug of ['', 'constructor', '__proto__', 'before-scrapping-how-to-deregister-your-car-in-uae-extra']) {
    assert.equal(getArticleServiceLink(slug, ''), null);
  }
});

test('existing body links suppress a duplicate service note across same-site URL variants', () => {
  const hrefs = ['/scrap-my-car/', '/scrap-my-car', '/scrap-my-car/?from=guide&amp;source=wix#paperwork-title',
    'https://www.scrapmycaruae.com/scrap-my-car/', 'http://scrapmycaruae.com/scrap-my-car',
    '//www.scrapmycaruae.com/scrap-my-car/'];
  for (const href of hrefs) {
    for (const anchor of [`<a href="${href}">Guide</a>`, `<a class='wix-link' href='${href}'>Guide</a>`, `<a\n href=${href}>Guide</a>`]) {
      assert.equal(getArticleServiceLink(scrapSlug, `<p>${anchor}</p>`), null, anchor);
    }
  }
});

test('homepage, other services, external lookalikes and non-anchor attributes do not suppress the note', () => {
  for (const html of ['<a href="/">Home</a>', '<a href="/free-quote">Free collection</a>',
    '<a href="https://example.com/scrap-my-car/">Elsewhere</a>',
    '<a href="/scrap-my-car-other/">Other</a>', '<a data-href="/scrap-my-car/">No actual link</a>',
    '<img src="/scrap-my-car/" />', '<a href="https://[">Invalid URL</a>']) {
    assert.equal(getArticleServiceLink(scrapSlug, html), articleServiceLinks[scrapSlug]);
  }
});

test('matching is case-sensitive for protected slugs and does not correct their existing typo', () => {
  const slug = 'imple-steps-to-sell-your-scrap-car-in-uae-for-the-best-price';
  assert.ok(getArticleServiceLink(slug, ''));
  assert.equal(getArticleServiceLink('s'+slug, ''), null);
  assert.equal(getArticleServiceLink(slug.toUpperCase(), ''), null);
});

test('every destination is an existing indexable route; Abu Dhabi scope is explicit', async () => {
  const routes = await readFile(new URL('../src/lib/site-routes.ts', import.meta.url), 'utf8');
  for (const link of Object.values(articleServiceLinks)) assert.ok(routes.includes(`'${link.href}'`), link.href);
  const regional = articleServiceLinks['car-scrapping-rules-you-should-know-if-you-live-in-abu-dhabi-or-sharjah'];
  assert.match(regional.context, /located in Abu Dhabi/);
  assert.match(regional.context, /does not replace official/);
});

test('article rendering, SEO and existing request flow remain intact; the note is outside Wix body', async () => {
  const page = await readFile(new URL('../src/pages/post/[slug].astro', import.meta.url), 'utf8');
  assert.match(page, /const articleHtml = renderedArticle\.html;/);
  assert.match(page, /const serviceLink = post \? getArticleServiceLink\(slug, articleHtml\) : null;/);
  assert.match(page, /<article class="article-content" set:html=\{articleHtml\} \/>\s*\{serviceLink && <ArticleServiceLink link=\{serviceLink\} \/>\}/);
  assert.match(page, /const jsonLd = post \? blogPostingSchema\(\{/);
  assert.match(page, /canonical=\{canonical\}/);
  assert.match(page, /noindex=\{!post \|\| Boolean\(wixSeo\?\.noindex\)\}/);
  const helper = await readFile(new URL('../src/lib/article-service-links.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(helper, /\b(?:import|fetch|await|wixClient)\b/);
});

test('service note uses escaped template expressions and a normal accessible link, with no client script', async () => {
  const component = await readFile(new URL('../src/components/ArticleServiceLink.astro', import.meta.url), 'utf8');
  assert.match(component, /<aside[^>]+aria-label="Related service guidance"/);
  assert.match(component, /<p>\{link.context\}<\/p>/);
  assert.match(component, /<a href=\{link.href\}>/);
  assert.match(component, /<span>\{link.anchor\}<\/span>/);
  assert.match(component, /:focus-visible/);
  assert.match(component, /min-height: 44px/);
  assert.match(component, /overflow-wrap: anywhere/);
  assert.match(component, /prefers-reduced-motion/);
  assert.doesNotMatch(component, /set:html|<script|target=|nofollow|onclick|fetch\(/);
});
