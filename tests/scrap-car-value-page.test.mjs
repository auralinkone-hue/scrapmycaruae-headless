import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('scrap-car-value page has the requested SEO, form, schemas and interactive factor guide', async () => {
  const page = await readProjectFile('src/pages/scrap-car-value.astro');
  assert.match(page, /Scrap Car Value UAE \| Find Out What Your Car Is Worth/);
  assert.match(page, /canonical="\/scrap-car-value\/"/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /What shapes your car/);
  assert.match(page, /data-factor/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /aria-controls={`condition-panel-\${index}`}/);
  assert.match(page, /event\.key === 'ArrowRight'/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.match(page, /getRelevantPosts/);
  assert.match(page, /View all blogs/);
  assert.match(page, /\/scrap-my-car\//);
  assert.match(page, /priorityCoverageLocations/);
  assert.doesNotMatch(page, /LocationCoverageList/);
  assert.doesNotMatch(page, /AED\s*[\d,]+/i);
});

test('scrap-car-value is in the production static sitemap manifest and its parent links to it', async () => {
  const parent = await readProjectFile('src/pages/scrap-my-car.astro');
  assert.equal(indexableStaticRoutes.filter((route) => route === '/scrap-car-value/').length, 1);
  assert.match(parent, /href="\/scrap-car-value\/"[\s\S]*?Learn more about scrap-car value/);
});

