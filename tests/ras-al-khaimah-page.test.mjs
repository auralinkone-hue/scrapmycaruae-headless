import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { otherEmirateLocations } from '../src/lib/locations.ts';
import { rakCoverageLocations, rakCollectionSettings } from '../src/lib/ras-al-khaimah-coverage.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Ras Al Khaimah uses supported city coverage and collection settings, not invented area names',()=>{
  assert.deepEqual(rakCoverageLocations,otherEmirateLocations.filter(name=>name==='Ras Al Khaimah'));
  assert.deepEqual(rakCoverageLocations,['Ras Al Khaimah']);
  assert.deepEqual(rakCollectionSettings.map(setting=>setting.id),['compound-parking','commercial-premises','outer-area-access']);
});

test('Ras Al Khaimah is discoverable with shared form, SEO and existing service destinations',async()=>{
  const [page,hub]=await Promise.all([read('src/pages/locations/ras-al-khaimah.astro'),read('src/pages/locations.astro')]);
  assert.equal(indexableStaticRoutes.filter(route=>route==='/locations/ras-al-khaimah/').length,1);
  assert.ok(hub.includes("['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'ras-al-khaimah', 'al-ain'].includes(area.id)"));
  assert.match(hub,/class="wider-summary" href="\/locations\/ras-al-khaimah\/"/);
  assert.match(hub,/class="region-link" href="\/locations\/sharjah\/"/);
  assert.match(page,/title="Sell or Scrap My Car Ras Al Khaimah \| Free Valuation"/);
  assert.match(page,/canonical="\/locations\/ras-al-khaimah\/"/);
  assert.match(page,/await getVehicleData\(\)/);assert.match(page,/<QuoteForm[^>]+variant="free-quote"/);
  assert.match(page,/'@type': 'BreadcrumbList'/);assert.match(page,/'@type': 'FAQPage'/);
  assert.doesNotMatch(page,/'@type': '(LocalBusiness|AutoRepair)'/);
  assert.doesNotMatch(page,/href="\/locations\/ras-al-khaimah\/[^"#]+/);
  for(const route of ['/locations/','/sell-my-car/','/sell-damaged-car/','/sell-non-running-car/','/sell-car-with-engine-problems/','/sell-car-with-gearbox-problems/','/sell-flood-damaged-car/','/scrap-my-car/','/car-removal/','/fleet-disposal/','/free-quote']){
    assert.ok(page.includes(`'${route}'`)||page.includes(`href="${route}"`),route);
    await access(new URL(`../src/pages${route==='/free-quote'?route:route.slice(0,-1)}.astro`,import.meta.url));
  }
});

test('Ras Al Khaimah assets are optimized WebP with dimensions and useful alt text',async()=>{
  const page=await read('src/pages/locations/ras-al-khaimah.astro');
  for(const name of ['ras-al-khaimah-vehicle-collection','ras-al-khaimah-commercial-recovery']){
    const data=await readFile(new URL(`../public/sections/${name}.webp`,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<250_000);
    assert.match(page,new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
  }
});
