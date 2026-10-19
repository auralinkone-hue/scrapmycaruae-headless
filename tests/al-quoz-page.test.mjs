import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { dubaiLocations } from '../src/lib/locations.ts';
import { alQuozCoverageLocations, alQuozCollectionSettings } from '../src/lib/al-quoz-coverage.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Al Quoz uses existing Dubai coverage and industrial collection settings',()=>{
  assert.deepEqual(alQuozCoverageLocations,dubaiLocations.filter(name=>name==='Al Quoz'));
  assert.deepEqual(alQuozCoverageLocations,['Al Quoz']);
  assert.deepEqual(alQuozCollectionSettings.map(s=>s.id),['workshop-release','yard-unit-access','trade-fleet-sites']);
});

test('Al Quoz has nested discovery and schema without entering the global dropdown',async()=>{
  const [page,parent,header]=await Promise.all([read('src/pages/locations/dubai/al-quoz.astro'),read('src/pages/locations/dubai.astro'),read('src/components/SiteHeader.astro')]);
  assert.equal(indexableStaticRoutes.filter(route=>route==='/locations/dubai/al-quoz/').length,1);
  assert.ok(parent.includes("area.id === 'al-quoz' ? '/locations/dubai/al-quoz/'"));
  assert.doesNotMatch(header,/href: '\/locations\/dubai\/al-quoz\/'/);
  assert.match(header,/isNavigationItemActive/);
  assert.match(page,/title="Sell or Scrap My Car Al Quoz Dubai \| Free Valuation"/);
  assert.match(page,/canonical="\/locations\/dubai\/al-quoz\/"/);
  assert.match(page,/await getVehicleData\(\)/);assert.match(page,/<QuoteForm[^>]+variant="free-quote"/);
  assert.match(page,/'@type': 'BreadcrumbList'/);assert.match(page,/position: 4, name: 'Al Quoz'/);assert.match(page,/'@type': 'FAQPage'/);
  assert.doesNotMatch(page,/'@type': '(LocalBusiness|AutoRepair)'/);
  for(const route of ['/locations/','/locations/dubai/','/sell-my-car/','/sell-damaged-car/','/sell-non-running-car/','/sell-car-with-engine-problems/','/sell-car-with-gearbox-problems/','/sell-flood-damaged-car/','/scrap-my-car/','/car-removal/','/fleet-disposal/','/free-quote']){
    assert.ok(page.includes(`'${route}'`)||page.includes(`href="${route}"`),route);
    await access(new URL(`../src/pages${route==='/free-quote'?route:route.slice(0,-1)}.astro`,import.meta.url));
  }
  assert.ok(page.includes('/locations/dubai/ras-al-khor/'));
  for(const id of ['al-qusais']){
    assert.ok(page.includes(`/locations/dubai/#${id}`));
    const data=await read('src/lib/dubai-coverage.ts');assert.ok(data.includes(`id: '${id}'`));
  }
});

test('Al Quoz uses two optimized WebP scenes with useful alternatives and explicit dimensions',async()=>{
  const page=await read('src/pages/locations/dubai/al-quoz.astro');
  for(const name of ['al-quoz-workshop-recovery','al-quoz-trade-vehicle-assessment']){
    const data=await readFile(new URL(`../public/sections/${name}.webp`,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<250_000);
    assert.match(page,new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
  }
});
