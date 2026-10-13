import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('engine-problems page has the approved service hero, SEO and structured data', async () => {
  const page = await readProjectFile('src/pages/sell-car-with-engine-problems.astro');

  assert.match(page, /export const prerender = false/);
  assert.match(page, /Sell Car With Engine Problems UAE \| Free Valuation/);
  assert.match(page, /canonical="\/sell-car-with-engine-problems\/"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /Sell your car with/);
  assert.match(page, /engine problems\./);
  assert.match(page, /grid-template-areas:'copy form' 'trust form'/);
  assert.match(page, /data-service-motion/);
});

test('engine-problems page is linked, indexable and uses the shared collection component', async () => {
  const [page, sellMyCar, header] = await Promise.all([
    readProjectFile('src/pages/sell-car-with-engine-problems.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/components/SiteHeader.astro')
  ]);

  assert.equal(indexableStaticRoutes.filter((route) => route === '/sell-car-with-engine-problems/').length, 1);
  for (const href of ['/sell-my-car/', '/sell-damaged-car/', '/sell-non-running-car/', '/free-quote', '/blogs', '/faqs']) {
    assert.match(page, new RegExp(`href="${href.replace(/[/?]/g, '\\$&')}"`));
  }
  for (const example of ['overheating', 'engine knocking', 'oil leaks', 'loss of power', 'warning lights', 'smoking engine', 'timing', 'engine failure', 'non-running engine']) {
    assert.match(page, new RegExp(example, 'i'));
  }
  assert.match(page, /Repair it or sell it/);
  assert.match(page, /3-step process/);
  assert.match(page, /<LocationCoverageList \/>/);
  assert.match(page, /Engine-problem FAQs/);
  assert.match(sellMyCar, /'Engine problems'[\s\S]*?'\/sell-car-with-engine-problems\//);
  assert.match(header, /href: '\/sell-car-with-engine-problems\/', label: 'Engine Problems'/);
});
