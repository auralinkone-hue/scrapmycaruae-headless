import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { otherEmirateLocations } from '../src/lib/locations.ts';
import { alAinCoverageLocations, alAinCollectionSettings } from '../src/lib/al-ain-coverage.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Al Ain uses supported city coverage and collection settings, not invented area names',()=>{
  assert.deepEqual(alAinCoverageLocations,otherEmirateLocations.filter(name=>name==='Al Ain'));
  assert.deepEqual(alAinCoverageLocations,['Al Ain']);
  assert.deepEqual(alAinCollectionSettings.map(setting=>setting.id),['villa-compound-access','workshop-forecourts','outer-area-parking']);
});

test('Al Ain is discoverable with shared form, SEO and existing service destinations',async()=>{
  const [page,hub]=await Promise.all([read('src/pages/locations/al-ain.astro'),read('src/pages/locations.astro')]);
  assert.equal(indexableStaticRoutes.filter(route=>route==='/locations/al-ain/').length,1);
  assert.ok(hub.includes("['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'ras-al-khaimah', 'al-ain'].includes(area.id)"));
  assert.match(hub,/class="wider-summary" href="\/locations\/al-ain\/"/);
  assert.match(hub,/class="region-link" href="\/locations\/sharjah\/"/);
  assert.match(page,/title="Sell or Scrap My Car Al Ain \| Free Valuation"/);
  assert.match(page,/canonical="\/locations\/al-ain\/"/);
  assert.match(page,/await getVehicleData\(\)/);assert.match(page,/<QuoteForm[^>]+variant="free-quote"/);
  assert.match(page,/'@type': 'BreadcrumbList'/);assert.match(page,/'@type': 'FAQPage'/);
  assert.doesNotMatch(page,/'@type': '(LocalBusiness|AutoRepair)'/);
  assert.doesNotMatch(page,/href="\/locations\/al-ain\/[^"#]+/);
  for(const route of ['/locations/','/sell-my-car/','/sell-damaged-car/','/sell-non-running-car/','/sell-car-with-engine-problems/','/sell-car-with-gearbox-problems/','/sell-flood-damaged-car/','/scrap-my-car/','/car-removal/','/fleet-disposal/','/free-quote']){
    assert.ok(page.includes(`'${route}'`)||page.includes(`href="${route}"`),route);
    await access(new URL(`../src/pages${route==='/free-quote'?route:route.slice(0,-1)}.astro`,import.meta.url));
  }
});

test('Al Ain assets are optimized WebP with dimensions and useful alt text',async()=>{
  const page=await read('src/pages/locations/al-ain.astro');
  for(const name of ['al-ain-vehicle-collection','al-ain-workshop-recovery']){
    const data=await readFile(new URL(`../public/sections/${name}.webp`,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<250_000);
    assert.match(page,new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
  }
});
