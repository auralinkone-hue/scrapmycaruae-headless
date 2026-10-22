import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { articleServiceLinks, getArticleServiceLink } from '../src/lib/article-service-links.ts';

const batch1 = JSON.parse(await readFile(new URL('../docs/qa/phase3-batch1-2026-10-23-evidence.json', import.meta.url), 'utf8'));
const inspected = batch1.articleChecks;
const scrapSlug = 'before-scrapping-how-to-deregister-your-car-in-uae';
const batch3 = JSON.parse(await readFile(new URL('../docs/qa/phase3-batch3-2026-10-23-evidence.json', import.meta.url), 'utf8'));

test('the original seven inspected protected sources retain their approved destinations', () => {
  assert.equal(Object.keys(articleServiceLinks).length, 29);
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

test('Batch 3 uses all seven exact inspected sources and retains destination fragments', () => {
  assert.deepEqual(batch3.articleChecks.map(item => item.row), [3, 4, 8, 9, 10, 13, 17]);
  for (const item of batch3.articleChecks) {
    assert.equal(item.status, 200);
    assert.deepEqual(item.bodyServiceLinks, []);
    const url = new URL(item.target);
    const slug = new URL(item.source).pathname.slice('/post/'.length);
    assert.equal(getArticleServiceLink(slug, '<p>Original Wix content.</p>').href, url.pathname + url.hash);
  }
});

test('paperwork mappings suppress duplicates to either the section or its parent service', () => {
  const slugs = ['what-documents-do-you-need-to-scrap-your-car-in-the-uae',
    'documents-needed-to-scrap-a-car-in-the-uae-in-2025-everything-you-should-know',
    'can-i-scrap-a-car-without-ownership-in-dubai'];
  for (const slug of slugs) {
    assert.equal(getArticleServiceLink(slug, '').href, '/scrap-my-car/#paperwork-title');
    for (const href of ['/scrap-my-car/#paperwork-title', '/scrap-my-car#paperwork-title',
      '/scrap-my-car/', 'https://www.scrapmycaruae.com/scrap-my-car/?source=wix#paperwork-title']) {
      assert.equal(getArticleServiceLink(slug, `<a href="${href}">Existing paperwork guide</a>`), null);
    }
    assert.ok(getArticleServiceLink(slug, '<a href="https://example.com/scrap-my-car/#paperwork-title">External</a>'));
  }
});

test('paperwork fragment exists; ownership and airbag contexts do not imply bypass or safe driving', async () => {
  const service = await readFile(new URL('../src/pages/scrap-my-car.astro', import.meta.url), 'utf8');
  assert.match(service, /id="paperwork-title"/);
  assert.match(articleServiceLinks['can-i-scrap-a-car-without-ownership-in-dubai'].context, /does not bypass proof of ownership or authorisation/);
  assert.match(articleServiceLinks['can-you-sell-a-car-with-deployed-airbags'].context, /does not establish that a car is safe to drive/);
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
  for (const link of Object.values(articleServiceLinks)) assert.ok(routes.includes(`'${link.href.split('#')[0]}'`), link.href);
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

const batch4 = JSON.parse(await readFile(new URL('../docs/qa/phase3-batch4-2026-10-23-evidence.json', import.meta.url), 'utf8'));

test('Batch 4 maps seven exact inspected sources and skips the already-linked valuation article', () => {
  assert.deepEqual(batch4.articleChecks.map(item => item.row), [14, 15, 16, 19, 20, 21, 22, 27]);
  for (const item of batch4.articleChecks) {
    assert.equal(item.status, 200);
    const slug = new URL(item.source).pathname.slice('/post/'.length);
    if (item.row === 20) {
      assert.equal(item.decision, 'skipped');
      assert.ok(item.bodyServiceLinks.some(link => link.text.trim() === 'free quote'));
      assert.equal(getArticleServiceLink(slug, ''), null);
    } else {
      assert.equal(item.decision, 'implemented');
      assert.deepEqual(item.bodyServiceLinks, []);
      assert.equal(getArticleServiceLink(slug, '').href, new URL(item.target).pathname);
      assert.equal(getArticleServiceLink(slug, `<a href="${item.target}">Existing guide</a>`), null);
    }
  }
});

test('Batch 4 regional and legal contexts separate collection from official procedures', () => {
  assert.match(articleServiceLinks['regional-hotspots-for-car-scrapping-in-the-uae'].context, /coverage areas, not business branches/);
  for (const slug of ['the-step-by-step-guide-to-scrapping-a-car-legally-in-the-uae', 'scrap-car-laws-in-dubai-what-every-owner-should-know-in-2025', 'car-scrapping-laws-you-must-follow-in-dubai-and-sharjah']) {
    assert.match(articleServiceLinks[slug].context, /relevant authority/);
  }
  assert.match(articleServiceLinks['car-scrapping-laws-you-must-follow-in-dubai-and-sharjah'].context, /If your vehicle is located in Sharjah/);
  assert.match(articleServiceLinks['value-of-scrap-cars-in-the-uae-market'].context, /Historical price examples are not an offer/);
});

const batch5 = JSON.parse(await readFile(new URL('../docs/qa/phase3-batch5-2026-10-23-evidence.json', import.meta.url), 'utf8'));

test('Batch 5 configures exactly the eight inspected protected sources without duplicate destinations in their bodies', () => {
  assert.deepEqual(batch5.articleChecks.map(item => item.row), [18, 23, 24, 25, 26, 28, 29, 30]);
  assert.equal(Object.keys(articleServiceLinks).length, batch5.configuredCount);
  for (const item of batch5.articleChecks) {
    const slug = new URL(item.source).pathname.slice('/post/'.length);
    assert.equal(item.status, 200);
    assert.equal(item.decision, 'implemented');
    assert.deepEqual(item.bodyServiceLinks, []);
    assert.equal(getArticleServiceLink(slug, '').href, new URL(item.target).pathname);
    assert.equal(getArticleServiceLink(slug, `<a href="${item.target}">Existing guide</a>`), null);
    assert.ok(item.reason.length > 50);
  }
});

test('all 21 prior mappings and the intentional row-20 skip remain unchanged', () => {
  const newSlugs = new Set(batch5.articleChecks.map(item => new URL(item.source).pathname.slice('/post/'.length)));
  const previous = Object.fromEntries(Object.entries(articleServiceLinks).filter(([slug]) => !newSlugs.has(slug)));
  assert.equal(Object.keys(previous).length, 21);
  assert.equal(createHash('sha256').update(JSON.stringify(previous)).digest('hex'), 'c93414a2935c224d8d7ed8d32eeabab0ceb09d24423993ef8834fbc8e01a82da');
  assert.equal(getArticleServiceLink('free-scrap-car-valuation-uae', ''), null);
  assert.equal(batch5.totalSkippedCount, 1);
});

test('registration and inspection guidance is conditional and does not promise legal or collection outcomes', () => {
  const registration = articleServiceLinks['how-long-can-you-keep-a-non-registered-car-in-dubai-before-it-s-fined'].context;
  assert.match(registration, /previously registered.*registration has expired/);
  assert.match(registration, /not for never-registered vehicles/);
  assert.match(registration, /does not replace current authority requirements/);
  const inspection = articleServiceLinks['car-inspection-failure-in-the-uae-essential-steps-to-take-after-failing-the-test'].context;
  assert.match(inspection, /failed inspection alone does not require scrapping/);
  assert.match(inspection, /If repair estimates.*uneconomic/);
  assert.match(inspection, /alongside repair or sale options/);
  for (const { source } of batch5.articleChecks) {
    const { context } = articleServiceLinks[new URL(source).pathname.slice('/post/'.length)];
    assert.doesNotMatch(context, /same.day|instant (?:cash|payment|collection)|AED|guaranteed|avoid fines/i);
  }
});
