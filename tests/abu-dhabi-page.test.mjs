import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { abuDhabiLocations } from '../src/lib/locations.ts';
import { abuDhabiCoverageGroups } from '../src/lib/abu-dhabi-coverage.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Abu Dhabi coverage retains each existing location exactly once with working guide IDs', () => {
  const areas = abuDhabiCoverageGroups.flatMap(group => group.areas);
  assert.equal(new Set(areas).size, areas.length);
  assert.deepEqual(new Set(areas), new Set(abuDhabiLocations));
  assert.equal(new Set(abuDhabiCoverageGroups.map(group => group.id)).size, 4);
  for (const name of ['Musaffah', 'Mohammed Bin Zayed City', 'Khalifa City']) assert.ok(areas.includes(name));
});

test('Abu Dhabi is discoverable and preserves shared form, SEO and real service destinations', async () => {
  const [page, hub] = await Promise.all([read('src/pages/locations/abu-dhabi.astro'), read('src/pages/locations.astro')]);
  assert.equal(indexableStaticRoutes.filter(route => route === '/locations/abu-dhabi/').length, 1);
  assert.ok(hub.includes("['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'ras-al-khaimah'].includes(area.id)"));
  assert.match(page, /title="Sell or Scrap My Car Abu Dhabi \| Free Valuation"/);
  assert.match(page, /canonical="\/locations\/abu-dhabi\/"/);
  assert.match(page, /await getVehicleData\(\)/);
  assert.match(page, /<QuoteForm[^>]+variant="free-quote"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.doesNotMatch(page, /'@type': '(LocalBusiness|AutoRepair)'/);
  assert.doesNotMatch(page, /href="\/locations\/abu-dhabi\/[^"#]+/);
  for (const route of ['/locations/', '/sell-my-car/', '/sell-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/sell-car-with-gearbox-problems/', '/sell-flood-damaged-car/', '/scrap-my-car/', '/car-removal/', '/fleet-disposal/', '/free-quote']) {
    assert.ok(page.includes(`'${route}'`) || page.includes(`href="${route}"`), route);
    await access(new URL(`../src/pages${route === '/free-quote' ? route : route.slice(0, -1)}.astro`, import.meta.url));
  }
});

test('Abu Dhabi photo assets are small WebP files with dimensions and descriptive alt text', async () => {
  const page = await read('src/pages/locations/abu-dhabi.astro');
  for (const name of ['abu-dhabi-vehicle-collection', 'abu-dhabi-musaffah-fleet']) {
    const data = await readFile(new URL(`../public/sections/${name}.webp`, import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    assert.ok(data.length < 250_000);
    assert.match(page, new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
  }
});
