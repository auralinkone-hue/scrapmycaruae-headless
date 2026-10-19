import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { sharjahLocations } from '../src/lib/locations.ts';
import { sharjahCoverage } from '../src/lib/sharjah-coverage.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Sharjah coverage retains Sajaa and the two requested areas with unique tab destinations', () => {
  assert.deepEqual(sharjahCoverage.map(area=>area.name), [...sharjahLocations]);
  assert.deepEqual(new Set(sharjahLocations),new Set(['Al Sajaa Industrial Area','Sharjah Industrial Area','Al Nahda']));
  assert.equal(new Set(sharjahCoverage.map(area=>area.id)).size,3);
  for(const area of sharjahCoverage) assert.equal(area.checks.length,3);
});

test('Sharjah page has shared valuation, discoverable SEO and existing internal service routes', async () => {
  const [page,hub]=await Promise.all([read('src/pages/locations/sharjah.astro'),read('src/pages/locations.astro')]);
  assert.equal(indexableStaticRoutes.filter(route=>route==='/locations/sharjah/').length,1);
  assert.ok(hub.includes("['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'ras-al-khaimah', 'al-ain', 'fujairah'].includes(area.id)"));
  assert.match(page,/title="Sell or Scrap My Car Sharjah \| Free Valuation"/);
  assert.match(page,/canonical="\/locations\/sharjah\/"/);
  assert.match(page,/await getVehicleData\(\)/);
  assert.match(page,/<QuoteForm[^>]+variant="free-quote"/);
  assert.match(page,/'@type': 'BreadcrumbList'/); assert.match(page,/'@type': 'FAQPage'/);
  assert.doesNotMatch(page,/'@type': '(LocalBusiness|AutoRepair)'/);
  assert.doesNotMatch(page,/href="\/locations\/sharjah\/[^"#]+/);
  for(const route of ['/locations/','/sell-my-car/','/sell-damaged-car/','/sell-non-running-car/','/sell-car-with-engine-problems/','/sell-car-with-gearbox-problems/','/sell-flood-damaged-car/','/scrap-my-car/','/car-removal/','/fleet-disposal/','/free-quote']) {
    assert.ok(page.includes(`'${route}'`)||page.includes(`href="${route}"`),route);
    await access(new URL(`../src/pages${route==='/free-quote'?route:route.slice(0,-1)}.astro`,import.meta.url));
  }
});

test('Sharjah photos are optimized WebP with dimensions and descriptive alt text',async()=>{
  const page=await read('src/pages/locations/sharjah.astro');
  for(const name of ['sharjah-vehicle-collection','sharjah-industrial-car-recovery']) {
    const data=await readFile(new URL(`../public/sections/${name}.webp`,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<250_000);
    assert.match(page,new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
  }
});
