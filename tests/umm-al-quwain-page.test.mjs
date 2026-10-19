import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { otherEmirateLocations } from '../src/lib/locations.ts';
import { uaqCoverageLocations, uaqCollectionSettings } from '../src/lib/umm-al-quwain-coverage.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Umm Al Quwain uses supported city coverage and collection settings, not invented area names',()=>{
  assert.deepEqual(uaqCoverageLocations,otherEmirateLocations.filter(name=>name==='Umm Al Quwain'));
  assert.deepEqual(uaqCoverageLocations,['Umm Al Quwain']);
  assert.deepEqual(uaqCollectionSettings.map(setting=>setting.id),['compound-parking','workshop-access','industrial-plots']);
});

test('Umm Al Quwain is discoverable with shared form, SEO and existing service destinations',async()=>{
  const [page,hub]=await Promise.all([read('src/pages/locations/umm-al-quwain.astro'),read('src/pages/locations.astro')]);
  assert.equal(indexableStaticRoutes.filter(route=>route==='/locations/umm-al-quwain/').length,1);
  assert.ok(hub.includes("['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'ras-al-khaimah', 'al-ain', 'fujairah', 'umm-al-quwain'].includes(area.id)"));
  assert.match(hub,/class="wider-summary" href="\/locations\/umm-al-quwain\/"/);
  assert.match(hub,/class="region-link" href="\/locations\/sharjah\/"/);
  assert.match(page,/title="Sell or Scrap My Car Umm Al Quwain \| Free Valuation"/);
  assert.match(page,/canonical="\/locations\/umm-al-quwain\/"/);
  assert.match(page,/await getVehicleData\(\)/);assert.match(page,/<QuoteForm[^>]+variant="free-quote"/);
  assert.match(page,/'@type': 'BreadcrumbList'/);assert.match(page,/'@type': 'FAQPage'/);
  assert.doesNotMatch(page,/'@type': '(LocalBusiness|AutoRepair)'/);
  assert.doesNotMatch(page,/href="\/locations\/umm-al-quwain\/[^"#]+/);
  for(const route of ['/locations/','/sell-my-car/','/sell-damaged-car/','/sell-non-running-car/','/sell-car-with-engine-problems/','/sell-car-with-gearbox-problems/','/sell-flood-damaged-car/','/scrap-my-car/','/car-removal/','/fleet-disposal/','/free-quote']){
    assert.ok(page.includes(`'${route}'`)||page.includes(`href="${route}"`),route);
    await access(new URL(`../src/pages${route==='/free-quote'?route:route.slice(0,-1)}.astro`,import.meta.url));
  }
});

test('Umm Al Quwain assets are optimized WebP with dimensions and useful alt text',async()=>{
  const page=await read('src/pages/locations/umm-al-quwain.astro');
  for(const name of ['umm-al-quwain-vehicle-collection','umm-al-quwain-workshop-recovery']){
    const data=await readFile(new URL(`../public/sections/${name}.webp`,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<250_000);
    assert.match(page,new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
  }
});
