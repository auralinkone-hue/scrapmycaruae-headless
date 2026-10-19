import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
import { dubaiAreaGuides } from '../src/lib/dubai-coverage.ts';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Ras Al Khor is a published Dubai child with parent discovery and existing coverage', async () => {
  const [page, parent, header] = await Promise.all([read('src/pages/locations/dubai/ras-al-khor.astro'), read('src/pages/locations/dubai.astro'), read('src/components/SiteHeader.astro')]);
  assert.ok(dubaiAreaGuides.some(area => area.id === 'ras-al-khor' && area.name === 'Ras Al Khor'));
  assert.equal(indexableStaticRoutes.filter(route => route === '/locations/dubai/ras-al-khor/').length, 1);
  assert.ok(parent.includes("area.id === 'ras-al-khor' ? '/locations/dubai/ras-al-khor/'"));
  assert.doesNotMatch(header, /href: '\/locations\/dubai\/ras-al-khor\/'/);
  assert.match(page, /title="Sell or Scrap My Car Ras Al Khor Dubai \| Free Valuation"/);
  assert.match(page, /canonical="\/locations\/dubai\/ras-al-khor\/"/);
  assert.match(page, /position: 4, name: 'Ras Al Khor'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.doesNotMatch(page, /'@type': '(LocalBusiness|AutoRepair)'/);
  assert.match(page, /await getVehicleData\(\)/);
  assert.match(page, /<QuoteForm[^>]+variant="free-quote"/);
  for (const route of ['/locations/', '/locations/dubai/', '/locations/dubai/al-quoz/', '/sell-my-car/', '/sell-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/sell-car-with-gearbox-problems/', '/sell-flood-damaged-car/', '/scrap-my-car/', '/car-removal/', '/fleet-disposal/', '/free-quote']) {
    assert.ok(page.includes(`'${route}'`) || page.includes(`href="${route}"`), route);
    await access(new URL(`../src/pages${route === '/free-quote' ? route : route.slice(0, -1)}.astro`, import.meta.url));
  }
});

test('Ras Al Khor recovery and yard photographs are optimized WebP assets', async () => {
  const page = await read('src/pages/locations/dubai/ras-al-khor.astro');
  for (const name of ['ras-al-khor-vehicle-recovery', 'ras-al-khor-automotive-yard']) {
    const bytes = await readFile(new URL(`../public/sections/${name}.webp`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length < 250000);
    assert.match(page, new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
  }
});
