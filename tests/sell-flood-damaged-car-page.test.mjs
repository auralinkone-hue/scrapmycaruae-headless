import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('flood route is discoverable from both parent journeys and the sitemap manifest', async () => {
  const [sell, scrap, sitemap] = await Promise.all([
    read('src/pages/sell-my-car.astro'), read('src/pages/scrap-my-car.astro'), read('src/pages/sitemap.xml.ts')
  ]);
  assert.equal(indexableStaticRoutes.filter(route => route === '/sell-flood-damaged-car/').length, 1);
  assert.match(sell, /'Flood-damaged cars'[^\n]*'\/sell-flood-damaged-car\/'/);
  assert.match(scrap, /href="\/sell-flood-damaged-car\/">Flood-damaged car guidance/);
  assert.match(sitemap, /indexableStaticRoutes/);
});

test('flood page retains shared integrations, cautious content and canonical schema', async () => {
  const page = await read('src/pages/sell-flood-damaged-car.astro');
  assert.match(page, /title="Sell Flood-Damaged Car UAE \| Free Valuation"/);
  assert.match(page, /canonical="\/sell-flood-damaged-car\/"/);
  for (const type of ['BreadcrumbList', 'FAQPage']) assert.ok(page.includes(`'@type': '${type}'`));
  for (const integration of ['getVehicleData()', 'getRelevantPosts({},', '<QuoteForm', '<LocationCoverageList />', '<BlogArticleCard']) assert.ok(page.includes(integration));
  for (const href of ['/sell-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/sell-car-with-gearbox-problems/', '/scrap-my-car/', '/car-removal/', '/free-quote']) assert.ok(page.includes(`href="${href}"`));
  assert.match(page, /may be affected/);
  assert.match(page, /does not establish roadworthiness/);
  assert.match(page, /do not confirm flood damage/);
});

test('both flood photographs are real WebP assets with captions and descriptive alt text', async () => {
  const page = await read('src/pages/sell-flood-damaged-car.astro');
  for (const name of ['inspection', 'collection']) {
    const path = `public/sections/flood-damaged-car-${name}.webp`;
    const bytes = await readFile(new URL(`../${path}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length < 250_000, 'photographs should stay appropriately compressed');
    assert.match(page, new RegExp(`src="/sections/flood-damaged-car-${name}\\.webp" alt="[^"]{40,}" width="1200" height="900" loading="lazy"`));
  }
  assert.equal((page.match(/<figcaption>/g) || []).length, 2);
});
