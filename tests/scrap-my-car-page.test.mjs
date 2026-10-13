import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('scrap hub includes the interactive, accessible experience and real quote form', async () => {
  const page = await readProjectFile('src/pages/scrap-my-car.astro');

  assert.match(page, /Scrap My Car UAE \| Free Valuation & Vehicle Collection/);
  assert.match(page, /canonical="\/scrap-my-car\/"/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /data-route-tab/);
  assert.match(page, /data-condition=/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /Vehicle details[\s\S]*?Valuation[\s\S]*?Decide route[\s\S]*?Collection[\s\S]*?Next use/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
});

test('scrap hub is indexable, linked in the header and uses verified official guidance links', async () => {
  const [page, header, coverageMap] = await Promise.all([
    readProjectFile('src/pages/scrap-my-car.astro'),
    readProjectFile('src/components/SiteHeader.astro'),
    readProjectFile('src/components/UaeCoverageMap.astro')
  ]);

  assert.equal(indexableStaticRoutes.filter((route) => route === '/scrap-my-car/').length, 1);
  assert.match(header, /href: '\/scrap-my-car\/', label: 'Scrap My Car'/);
  for (const href of ['/sell-my-car/', '/sell-damaged-car/', '/sell-accident-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/free-quote', '/blogs', '/faqs']) {
    assert.match(page, new RegExp(href.replace(/[/?]/g, '\\$&')));
  }
  assert.match(page, /rta\.ae[\s\S]*?target="_blank"[\s\S]*?rel="noopener noreferrer"/);
  for (const location of ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain']) {
    assert.match(coverageMap, new RegExp(location));
  }
});
