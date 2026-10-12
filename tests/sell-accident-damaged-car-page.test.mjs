import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const readFileFromProject = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('accident-damaged car page has transactional SEO, form-first hero and schemas', async () => {
  const page = await readFileFromProject('src/pages/sell-accident-damaged-car.astro');

  assert.match(page, /export const prerender = false/);
  assert.match(page, /Sell Accident Damaged Car UAE \| Free Valuation/);
  assert.match(page, /canonical="\/sell-accident-damaged-car\/"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /grid-template-areas:'copy form' 'trust form'/);
  assert.match(page, /Sell <span class="accident-word">accident-damaged<\/span> cars\./);
  assert.match(page, /class="valuation-message">Get a valuation\./);
  assert.match(page, /<MakeLogoRail makes=\{selectedMakes\}/);
  assert.match(page, /\.accident-hero h1 \.accident-word\{display:inline;color:#bd8420\}/);
});

test('accident-damaged page is linked, indexable in production and uses shared UAE coverage', async () => {
  const page = await readFileFromProject('src/pages/sell-accident-damaged-car.astro');
  const sellMyCar = await readFileFromProject('src/pages/sell-my-car.astro');
  const coverage = await readFileFromProject('src/components/LocationCoverageList.astro');

  assert.equal(indexableStaticRoutes.filter((route) => route === '/sell-accident-damaged-car/').length, 1);
  for (const href of ['/sell-my-car/', '/sell-damaged-car/', '/free-quote', '/blogs', '/faqs']) {
    assert.match(`${page}\n${sellMyCar}`, new RegExp(`href="${href.replace(/[/?]/g, '\\$&')}`));
  }
  assert.match(page, /front\/rear impact|Front or rear impact/);
  assert.match(page, /Repair it or sell it/);
  assert.match(page, /<LocationCoverageList \/>/);
  assert.match(coverage, /location-coverage::before/);
  assert.match(page, /class="process-grid"/);
  assert.match(page, /ph-car-profile process-grid__icon/);
  assert.match(page, /ph-chat-text process-grid__icon/);
  assert.match(page, /ph-handshake process-grid__icon/);
  assert.match(page, /Accident-damaged car FAQs/);
  assert.match(sellMyCar, /'Accident-damaged cars'[\s\S]*?'\/sell-accident-damaged-car\//);
  assert.match(sellMyCar, /condition-card-link__details/);
});
