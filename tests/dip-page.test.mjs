import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
import { dubaiLocations } from '../src/lib/locations.ts';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('DIP is a published Dubai child using existing location data and shared form', async () => {
  const [page, parent, header] = await Promise.all([read('src/pages/locations/dubai/dubai-investments-park.astro'), read('src/pages/locations/dubai.astro'), read('src/components/SiteHeader.astro')]);
  assert.ok(dubaiLocations.includes('Dubai Investments Park (DIP)'));
  assert.equal(indexableStaticRoutes.filter(route => route === '/locations/dubai/dubai-investments-park/').length, 1);
  assert.ok(parent.includes("area.id === 'dubai-investments-park' ? '/locations/dubai/dubai-investments-park/'"));
  assert.doesNotMatch(header, /href: '\/locations\/dubai\/dubai-investments-park\/'/);
  assert.match(page, /title="Sell or Scrap My Car Dubai Investments Park \| Free Valuation"/);
  assert.match(page, /canonical="\/locations\/dubai\/dubai-investments-park\/"/);
  assert.match(page, /position: 4, name: 'Dubai Investments Park'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.doesNotMatch(page, /'@type': '(LocalBusiness|AutoRepair)'|figcaption/);
  assert.match(page, /await getVehicleData\(\)/);
  assert.match(page, /<QuoteForm[^>]+variant="free-quote"/);
  for (const route of ['/locations/', '/locations/dubai/', '/locations/dubai/al-quoz/', '/locations/dubai/ras-al-khor/', '/locations/dubai/jebel-ali/', '/sell-my-car/', '/sell-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/sell-car-with-gearbox-problems/', '/sell-flood-damaged-car/', '/scrap-my-car/', '/car-removal/', '/fleet-disposal/', '/free-quote']) {
    assert.ok(page.includes(`'${route}'`) || page.includes(`href="${route}"`), route);
    await access(new URL(`../src/pages${route === '/free-quote' ? route : route.slice(0, -1)}.astro`, import.meta.url));
  }
});

test('DIP photos use separate compressed WebP assets with explicit dimensions and alternatives', async () => {
  const page = await read('src/pages/locations/dubai/dubai-investments-park.astro');
  const assets = await Promise.all(['dip-sedan-recovery', 'dip-commercial-vehicles'].map(async name => {
    const bytes = await readFile(new URL(`../public/sections/${name}.webp`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length < 250000);
    assert.match(page, new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
    return bytes;
  }));
  assert.notDeepEqual(assets[0], assets[1]);
});
