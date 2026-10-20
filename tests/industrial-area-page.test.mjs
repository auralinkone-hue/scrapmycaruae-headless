import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
import { sharjahCoverage } from '../src/lib/sharjah-coverage.ts';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Sharjah Industrial Area has existing Sharjah coverage, parent discovery and shared form', async () => {
  const [page, parent, header] = await Promise.all([read('src/pages/locations/sharjah/industrial-area.astro'), read('src/pages/locations/sharjah.astro'), read('src/components/SiteHeader.astro')]);
  assert.ok(sharjahCoverage.some(area => area.id === 'industrial-area' && area.short === 'Industrial Area'));
  assert.equal(indexableStaticRoutes.filter(route => route === '/locations/sharjah/industrial-area/').length, 1);
  assert.ok(parent.includes("area.id === 'industrial-area' ? '/locations/sharjah/industrial-area/'"));
  assert.doesNotMatch(header, /href: '\/locations\/sharjah\/industrial-area\/'/);
  assert.match(page, /title="Sell or Scrap My Car Sharjah Industrial Area \| Free Valuation"/);
  assert.match(page, /canonical="\/locations\/sharjah\/industrial-area\/"/);
  assert.match(page, /position: 4, name: 'Sharjah Industrial Area'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.doesNotMatch(page, /'@type': '(LocalBusiness|AutoRepair)'|figcaption/);
  assert.match(page, /await getVehicleData\(\)/);
  assert.match(page, /<QuoteForm[^>]+variant="free-quote"/);
  for (const route of ['/locations/', '/locations/sharjah/', '/sell-my-car/', '/sell-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/sell-car-with-gearbox-problems/', '/sell-flood-damaged-car/', '/scrap-my-car/', '/car-removal/', '/fleet-disposal/', '/free-quote']) {
    assert.ok(page.includes(`'${route}'`) || page.includes(`href="${route}"`), route);
    await access(new URL(`../src/pages${route === '/free-quote' ? route : route.slice(0, -1)}.astro`, import.meta.url));
  }
});

test('Sharjah Industrial Area has distinct optimized WebP assets with descriptive alternatives', async () => {
  const page = await read('src/pages/locations/sharjah/industrial-area.astro');
  const assets = await Promise.all(['sharjah-industrial-suv-recovery', 'sharjah-industrial-commercial-van'].map(async name => {
    const bytes = await readFile(new URL(`../public/sections/${name}.webp`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length < 250000);
    assert.match(page, new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="(?:814|960)" loading="lazy"`));
    return bytes;
  }));
  assert.notDeepEqual(assets[0], assets[1]);
});
