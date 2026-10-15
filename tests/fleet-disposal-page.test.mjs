import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('fleet disposal has B2B content, one shared enquiry form, SEO and structured data', async () => {
  const page = await read('src/pages/fleet-disposal.astro');
  assert.match(page, /Fleet Disposal UAE \| Business Vehicle Collection & Disposal/);
  assert.match(page, /canonical="\/fleet-disposal\/"/);
  assert.match(page, /Fleet vehicle disposal <span>across the UAE/);
  assert.equal((page.match(/<QuoteForm /g) ?? []).length, 1);
  assert.doesNotMatch(page, /<form\b/);
  assert.match(page, /one representative vehicle/i);
  assert.match(page, /getVehicleData\(\)/);
  assert.match(page, /getRelevantPosts/);
  assert.match(page, /priorityCoverageLocations\.map/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.match(page, /<table><caption/);
  for (const route of ['/scrap-my-car/', '/car-removal/', '/scrap-car-value/', '/sell-damaged-car/', '/sell-non-running-car/', '/free-quote']) assert.ok(page.includes(route), route);
  assert.doesNotMatch(page, /AED\s*[\d,]+|same.day collection|guaranteed approval/i);
});

test('fleet disposal is registered once in the production sitemap and linked from the scrap hub', async () => {
  assert.equal(indexableStaticRoutes.filter(route => route === '/fleet-disposal/').length, 1);
  assert.match(await read('src/pages/scrap-my-car.astro'), /href="\/fleet-disposal\/">fleet disposal guide/);
});
