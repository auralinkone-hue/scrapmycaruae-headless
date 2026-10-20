import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {bmwConditions,bmwFaqs} from '../src/lib/bmw-content.ts';
import {indexableStaticRoutes} from '../src/lib/site-routes.ts';
const page=()=>readFile(new URL('../src/pages/cars/bmw.astro',import.meta.url),'utf8');
test('BMW route uses live model filtering, shared interactions and matching SEO/schema data',async()=>{
 const s=await page();assert.equal([...s.matchAll(/<h1\b/g)].length,1);assert.match(s,/Scrap Your BMW<\/span> <span>Car in the UAE/);assert.match(s,/title="Scrap BMW Car in UAE \| Free Valuation \| Scrap My Car UAE"/);assert.match(s,/canonical="\/cars\/bmw\/"/);assert.equal(indexableStaticRoutes.filter(x=>x==='/cars/bmw/').length,1);
 assert.match(s,/manufacturerModels\(vehicleData.models,'BMW'\)/);assert.match(s,/bmwPreferred.filter\(model=>models.includes\(model\)\)/);assert.match(s,/make:'BMW',models,profiles:bmwProfiles,initial/);assert.match(s,/<ManufacturerInteractions/);
 assert.match(s,/'@type':'BreadcrumbList',itemListElement:crumbs.map/);assert.match(s,/'@type':'FAQPage',mainEntity:bmwFaqs.map/);assert.match(s,/class="faq-list">\{bmwFaqs.map/);assert.equal(bmwConditions.length,6);for(const item of bmwConditions)assert.ok(indexableStaticRoutes.includes(item.href));assert.equal(new Set(bmwFaqs.map(x=>x[0])).size,bmwFaqs.length);assert.doesNotMatch(s,/LocalBusiness|figcaption|href="\/cars\/"|requestSubmit|localStorage|\.value\s*=/);
});
test('BMW photos have six optimized responsive WebPs with stable dimensions and loading priorities',async()=>{
 const s=await page();for(const name of ['bmw-sedan-valuation','bmw-suv-assessment'])for(const suffix of ['','-960','-640']){const data=await readFile(new URL('../public/sections/'+name+suffix+'.webp',import.meta.url));assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<180000);}
 assert.equal([...s.matchAll(/<img\b/g)].length,2);assert.equal([...s.matchAll(/width="1440" height="960"/g)].length,2);assert.equal([...s.matchAll(/srcset=/g)].length,2);assert.match(s,/fetchpriority="high"/);assert.match(s,/loading="lazy"/);
});
