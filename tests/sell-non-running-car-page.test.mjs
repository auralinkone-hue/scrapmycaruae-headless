import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('non-running car page has the approved service-page hero and SEO schemas', async () => {
  const page = await readProjectFile('src/pages/sell-non-running-car.astro');

  assert.match(page, /export const prerender = false/);
  assert.match(page, /Sell Non Running Car UAE \| Free Valuation & Collection/);
  assert.match(page, /canonical="\/sell-non-running-car\/"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /grid-template-areas:'copy form' 'trust form'/);
  assert.match(page, /Sell your non-running car/);
  assert.match(page, /Get a valuation\./);
  assert.match(page, /data-service-motion/);
});

test('non-running car page is linked, indexable and uses shared collection coverage', async () => {
  const [page, sellMyCar, coverage] = await Promise.all([
    readProjectFile('src/pages/sell-non-running-car.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/components/LocationCoverageList.astro')
  ]);

  assert.equal(indexableStaticRoutes.filter((route) => route === '/sell-non-running-car/').length, 1);
  for (const href of ['/sell-my-car/', '/sell-damaged-car/', '/sell-accident-damaged-car/', '/free-quote', '/blogs', '/faqs']) {
    assert.match(page, new RegExp(`href="${href.replace(/[/?]/g, '\\$&')}`));
  }
  assert.match(page, /engine failure/i);
  assert.match(page, /Fuel-system faults/);
  assert.match(page, /Gearbox failure/);
  assert.match(page, /3-step process/);
  assert.match(page, /<LocationCoverageList \/>/);
  assert.match(page, /Non-running-car FAQs/);
  assert.match(page, /class="stat-grid"/);
  assert.match(coverage, /location-coverage::before/);
  assert.match(sellMyCar, /'Non-running cars'[\s\S]*?'\/sell-non-running-car\//);
  assert.match(sellMyCar, /condition-card-link__details/);
});
