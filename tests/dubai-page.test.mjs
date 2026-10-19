import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { dubaiLocations } from '../src/lib/locations.ts';
import { dubaiCoverageGroups, dubaiAreaGuides } from '../src/lib/dubai-coverage.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Dubai coverage retains every existing area exactly once, plus requested industrial areas', () => {
  const areas = dubaiCoverageGroups.flatMap(group => group.areas);
  assert.equal(new Set(areas).size, areas.length);
  assert.deepEqual(new Set(areas), new Set([...dubaiLocations, 'Ras Al Khor', 'Jebel Ali']));
  assert.equal(new Set(dubaiAreaGuides.map(area => area.id)).size, 5);
  for (const area of dubaiAreaGuides) assert.ok(areas.includes(area.name));
});

test('Dubai has sitemap discovery, shared valuation and real internal destinations', async () => {
  const page = await read('src/pages/locations/dubai.astro');
  assert.ok(indexableStaticRoutes.includes('/locations/dubai/'));
  assert.match(page, /title="Sell or Scrap My Car Dubai \| Free Valuation"/);
  assert.match(page, /canonical="\/locations\/dubai\/"/);
  assert.match(page, /await getVehicleData\(\)/);
  assert.match(page, /<QuoteForm[^>]+variant="free-quote"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.doesNotMatch(page, /'@type': '(LocalBusiness|AutoRepair)'/);
  assert.ok(page.includes("'/locations/dubai/al-quoz/'"));
  await access(new URL('../src/pages/locations/dubai/al-quoz.astro', import.meta.url));
  for (const route of ['/locations/', '/sell-my-car/', '/sell-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/sell-car-with-gearbox-problems/', '/sell-flood-damaged-car/', '/scrap-my-car/', '/car-removal/', '/fleet-disposal/', '/free-quote']) {
    assert.ok(page.includes(`'${route}'`) || page.includes(`href="${route}"`), route);
    const file = route === '/free-quote' ? 'src/pages/free-quote.astro' : `src/pages${route.slice(0, -1)}.astro`;
    await access(new URL(`../${file}`, import.meta.url));
  }
});

test('Dubai photo assets are optimized WebP and referenced with dimensions and useful alt text', async () => {
  const page = await read('src/pages/locations/dubai.astro');
  for (const name of ['dubai-vehicle-collection', 'dubai-car-recovery-access']) {
    const data = await readFile(new URL(`../public/sections/${name}.webp`, import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    assert.ok(data.length < 250_000);
    assert.match(page, new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
  }
});
