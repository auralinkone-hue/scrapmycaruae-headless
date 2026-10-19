import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
const read=()=>readFile(new URL('../src/components/SiteHeader.astro',import.meta.url),'utf8');

test('Locations header exposes only the completed routes in the requested order',async()=>{
  const header=await read();
  const list=header.match(/const locationPages = \[([\s\S]*?)\] as const/)[1];
  const routes=[...list.matchAll(/href: '([^']+)'/g)].map(match=>match[1]);
  assert.deepEqual(routes,['/locations/','/locations/dubai/','/locations/abu-dhabi/','/locations/sharjah/','/locations/ajman/','/locations/ras-al-khaimah/','/locations/fujairah/','/locations/al-ain/']);
  for(const route of routes)await access(new URL(`../src/pages${route.slice(0,-1)}.astro`,import.meta.url));
  assert.equal([...list.matchAll(/icon: 'ph-/g)].length,8);
  assert.doesNotMatch(list,/umm-al-quwain/);
  assert.match(header,/children: scrapMyCarServices[^\n]+\n\s+\{ href: '\/locations\/'/);
});

test('Locations has a clickable desktop parent and dedicated mobile drill-in using the existing controller',async()=>{
  const header=await read();
  assert.match(header,/link.href === '\/locations\/' && <a href=\{link.href\}/);
  assert.match(header,/id: 'locations'.*overviewLabel: 'View all UAE locations'.*items: locationPages/);
  assert.match(header,/data-mobile-forward=\{mobileServiceGroups.find/);
  assert.match(header,/pathname === '\/locations' \|\| pathname.startsWith\('\/locations\/'\)/);
  assert.match(header,/data-mobile-back/);assert.match(header,/view.inert = !active/);
  assert.match(header,/event.key === 'Escape'/);assert.match(header,/prefers-reduced-motion/);
});
