import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { locationOverview, locationGroups, isLocationPageActive, isLocationGroupActive } from '../src/lib/location-navigation.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read=()=>readFile(new URL('../src/components/SiteHeader.astro',import.meta.url),'utf8');

test('shared location navigation covers all 19 published routes exactly once in the approved groups',async()=>{
  const routes=[locationOverview.href,...locationGroups.flatMap(group=>group.items.map(item=>item.href))];
  assert.equal(routes.length,19);
  assert.equal(new Set(routes).size,19);
  assert.deepEqual([...routes].sort(),indexableStaticRoutes.filter(route=>route.startsWith('/locations/')).sort());
  assert.deepEqual(locationGroups.map(group=>[group.label,group.items.length]),[['Dubai',6],['Abu Dhabi',4],['Sharjah',3],['Other UAE Locations',5]]);
  for(const route of routes)await access(new URL(`../src/pages${route.slice(0,-1)}.astro`,import.meta.url));
});

test('location highlighting distinguishes the exact page from its corresponding group',()=>{
  for(const group of locationGroups){
    for(const item of group.items){
      for(const pathname of [item.href,item.href.slice(0,-1)]){
        assert.equal(isLocationPageActive(pathname,item.href),true);
        assert.equal(locationGroups.filter(candidate=>isLocationGroupActive(pathname,candidate)).length,1);
        assert.equal(isLocationGroupActive(pathname,group),true);
        assert.equal([locationOverview,...locationGroups.flatMap(g=>g.items)].filter(link=>isLocationPageActive(pathname,link.href)).length,1);
      }
    }
  }
  assert.equal(locationGroups.some(group=>isLocationGroupActive('/locations/',group)),false);
  assert.equal(isLocationPageActive('/locations/dubai/al-quoz/','/locations/dubai/'),false);
  assert.equal(isLocationGroupActive('/locations/dubai/unknown/',locationGroups[0]),false);
});

test('desktop and mobile render the same groups with bounded scrolling and two-level Back navigation',async()=>{
  const header=await read();
  assert.match(header,/import.*locationOverview, locationGroups/);
  assert.match(header,/link.href === '\/locations\/' && <a href=\{link.href\}/);
  assert.match(header,/class="nav-dropdown__panel locations-mega"/);
  assert.match(header,/locationGroups.map\(group => <section/g);
  assert.match(header,/View All UAE Locations/);
  assert.match(header,/data-mobile-forward=\{'location-' \+ location.id\}/);
  assert.match(header,/data-mobile-back="locations"/);
  assert.match(header,/showPanel\(button.dataset.mobileBack \|\| 'main', true, true\)/);
  assert.match(header,/max-height: min\(620px,calc\(100dvh - 100px\)\); overflow-y: auto/);
  assert.match(header,/view.inert = !active/);
  assert.match(header,/event.key === 'Escape'/);
  assert.match(header,/event.key !== 'Tab'/);
  assert.match(header,/prefers-reduced-motion/);
  assert.match(header,/max-width: 1100px/);
});
