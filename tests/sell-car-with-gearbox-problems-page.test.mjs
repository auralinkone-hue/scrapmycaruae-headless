import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('gearbox-problems page has the requested SEO, form, content and schema', async () => {
  const page = await readProjectFile('src/pages/sell-car-with-gearbox-problems.astro');

  assert.match(page, /Sell Car With Gearbox Problems UAE \| Free Valuation/);
  assert.match(page, /canonical="\/sell-car-with-gearbox-problems\/"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /Sell a car with/);
  assert.match(page, /gearbox problems/);
  assert.match(page, /<LocationCoverageList \/>/);
  assert.match(page, /data-service-motion/);

  for (const symptom of ['Slipping gears', 'Delayed engagement', 'Jerking', 'Unusual gearbox noise', 'Warning lights', 'Stuck gears', 'Transmission failure']) {
    assert.match(page, new RegExp(symptom, 'i'));
  }
});

test('gearbox page is indexable and linked contextually without entering the scrap navigation', async () => {
  const [page, sellMyCar, scrapMyCar, header] = await Promise.all([
    readProjectFile('src/pages/sell-car-with-gearbox-problems.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/pages/scrap-my-car.astro'),
    readProjectFile('src/components/SiteHeader.astro')
  ]);

  assert.equal(indexableStaticRoutes.filter((route) => route === '/sell-car-with-gearbox-problems/').length, 1);
  for (const href of ['/sell-my-car/', '/sell-non-running-car/', '/free-quote', '/blogs', '/faqs']) {
    assert.match(page, new RegExp(`href="${href.replace(/[/?]/g, '\\$&')}"`));
  }
  assert.match(sellMyCar, /'Gearbox problems'[\s\S]*?'\/sell-car-with-gearbox-problems\//);
  assert.match(scrapMyCar, /href="\/sell-car-with-gearbox-problems\/">gearbox-problem guidance/i);

  const scrapMenu = header.match(/const scrapMenuItems = \[[\s\S]*?\];/)?.[0] ?? '';
  assert.doesNotMatch(scrapMenu, /sell-car-with-gearbox-problems/);
});
