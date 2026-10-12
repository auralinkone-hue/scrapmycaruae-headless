import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const readPage = () => readFile(new URL('../src/pages/sell-damaged-car.astro', import.meta.url), 'utf8');

test('sell damaged car page keeps the approved form, transactional SEO and schemas', async () => {
  const page = await readPage();

  assert.match(page, /export const prerender = false/);
  assert.match(page, /Sell Damaged Car UAE \| Free Valuation & Vehicle Collection/);
  assert.match(page, /canonical="\/sell-damaged-car\/"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /grid-template-areas:'copy form' 'trust form'/);
  assert.match(page, /Sell your damaged car/);
  assert.match(page, /Skip the repair hassle/);
});

test('sell damaged car page stays focused, linked and indexable in production', async () => {
  const page = await readPage();

  assert.equal(indexableStaticRoutes.filter((route) => route === '/sell-damaged-car/').length, 1);
  for (const href of ['/sell-my-car/', '/free-quote', '/blogs', '/faqs']) {
    assert.match(page, new RegExp(`href="${href.replace(/[/?]/g, '\\$&')}"`));
  }
  assert.match(page, /Types of damage/);
  assert.match(page, /Should you repair it/);
  assert.match(page, /Damaged vehicle collection/);
  assert.match(page, /class="guide-grid"/);
  assert.match(page, /Damaged-car FAQs/);
});
