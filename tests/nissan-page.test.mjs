import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {manufacturerModels,resolveModelGuidance} from '../src/lib/manufacturer-models.ts';
import {nissanPreferredModels,nissanModelGuidance,nissanConditions,nissanFaqs} from '../src/lib/nissan-content.ts';
import {recoveryGuidance} from '../src/lib/nissan-readiness.ts';
import {indexableStaticRoutes} from '../src/lib/site-routes.ts';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('Nissan catalogue includes only actual CMS models, including future names with safe fallback',()=>{
 const input=['PATROL','ALTIMA','FUTURE MODEL'].map((model,i)=>({make:'NISSAN',model,modelDisplayOrder:i}));input.push({make:'TOYOTA',model:'KICKS',modelDisplayOrder:0});
 const models=manufacturerModels(input,'NISSAN').map(x=>x.model);
 assert.deepEqual(nissanPreferredModels.filter(model=>models.includes(model)),['PATROL','ALTIMA']);assert.ok(!models.includes('KICKS'));
 assert.equal(resolveModelGuidance('FUTURE MODEL',nissanModelGuidance).checks.length,3);
});
test('Nissan six condition states have unique guidance and published destinations',()=>{
 assert.deepEqual(nissanConditions.map(x=>x.id),['accident','engine','gearbox','non-running','flood','old']);assert.equal(new Set(nissanConditions.map(x=>x.title)).size,6);
 for(const item of nissanConditions){assert.ok(indexableStaticRoutes.includes(item.href));assert.equal(item.checks.length,3);}
 assert.match(nissanConditions[4].copy,/possible affected areas, not a diagnosis/);assert.equal(new Set(nissanFaqs.map(x=>x[0])).size,nissanFaqs.length);
});
test('Recovery readiness covers all 27 combinations without prices or acceptance decisions',()=>{
 for(const rolling of ['yes','no','unknown'])for(const keys of ['yes','no','unknown'])for(const access of ['yes','no','unknown']){const result=recoveryGuidance(rolling,keys,access);assert.equal(result.length,3);assert.doesNotMatch(result.join(' '),/AED|guaranteed|accepted|instant price/);}
 assert.match(recoveryGuidance('no','no','no')[0],/locked wheels/);assert.match(recoveryGuidance('no','no','no')[1],/missing keys/);assert.match(recoveryGuidance('unknown','unknown','unknown')[0],/Do not start or move/);
});
test('Nissan SEO and visible schema share data; route is registered once without an unbuilt cars hub',async()=>{
 const page=await read('src/pages/cars/nissan.astro');assert.equal([...page.matchAll(/<h1\b/g)].length,1);assert.match(page,/Scrap Your Nissan<\/span> <span>Car in the UAE/);
 assert.match(page,/title="Scrap Nissan Car in UAE \| Free Valuation \| Scrap My Car UAE"/);assert.match(page,/canonical="\/cars\/nissan\/"/);assert.equal(indexableStaticRoutes.filter(x=>x==='/cars/nissan/').length,1);
 assert.match(page,/'@type':'BreadcrumbList',itemListElement:crumbs.map/);assert.match(page,/'@type':'FAQPage',mainEntity:nissanFaqs.map/);assert.match(page,/class="faq-list">\{nissanFaqs.map/);
 assert.doesNotMatch(page,/href="\/cars\/"|LocalBusiness|figcaption/);
});
test('Nissan uses one unchanged shared form and sync controller; readiness never transmits answers',async()=>{
 const page=await read('src/pages/cars/nissan.astro');const ui=await read('src/components/manufacturer/NissanWorkspace.astro');assert.equal([...page.matchAll(/<QuoteForm\b/g)].length,1);assert.match(page,/getVehicleData\(\)/);assert.match(page,/manufacturerModels\(vehicleData.models,'NISSAN'\)/);assert.match(page,/<ManufacturerInteractions/);
 assert.match(ui,/nissanPreferredModels.filter\(model=>models.includes\(model\)\)/);assert.doesNotMatch(ui,/fetch\(|\/api\/quote|requestSubmit|localStorage|name="(rolling|keys|access)"|#toyota-quote/);
 const controller=await read('src/components/manufacturer/ManufacturerInteractions.astro');assert.match(controller,/selectModel\(model.value,false\)/);assert.match(controller,/syncQuote\(selectedModel\)/);assert.doesNotMatch(controller,/year\.value\s*=/);
});
test('Nissan images are distinct responsive WebPs with dimensions and loading priorities',async()=>{
 const page=await read('src/pages/cars/nissan.astro');for(const name of ['nissan-patrol-assessment','nissan-altima-workshop'])for(const suffix of ['','-960','-640']){const data=await readFile(new URL('../public/sections/'+name+suffix+'.webp',import.meta.url));assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<180000);}
 assert.equal([...page.matchAll(/<img\b/g)].length,2);assert.equal([...page.matchAll(/srcset=/g)].length,2);assert.equal([...page.matchAll(/width="1440" height="960"/g)].length,2);assert.match(page,/fetchpriority="high"/);assert.match(page,/loading="lazy"/);assert.doesNotMatch(page,/toyota-.*webp/);
});
