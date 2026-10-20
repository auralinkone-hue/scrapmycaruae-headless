import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mercedesPreferred,mercedesConditions,mercedesFaqs} from '../src/lib/mercedes-content.ts';
import {indexableStaticRoutes} from '../src/lib/site-routes.ts';
const page=()=>readFile(new URL('../src/pages/cars/mercedes-benz.astro',import.meta.url),'utf8');
test('Mercedes route has one H1, canonical, visible breadcrumbs and matching FAQ data',async()=>{
 const source=await page();assert.equal([...source.matchAll(/<h1\b/g)].length,1);assert.match(source,/Scrap Your Mercedes-Benz<\/span> <span>Car in the UAE/);assert.match(source,/title="Scrap Mercedes-Benz Car in UAE \| Free Valuation"/);assert.match(source,/canonical="\/cars\/mercedes-benz\/"/);assert.equal(indexableStaticRoutes.filter(x=>x==='/cars/mercedes-benz/').length,1);
 assert.match(source,/'@type':'BreadcrumbList',itemListElement:crumbs.map/);assert.match(source,/'@type':'FAQPage',mainEntity:mercedesFaqs.map/);assert.match(source,/class="faq-list">\{mercedesFaqs.map/);assert.doesNotMatch(source,/LocalBusiness|figcaption|href="\/cars\/"/);
});
test('Mercedes guidance uses verified CMS keys and published destinations without changing shared form behaviour',async()=>{
 const source=await page();assert.match(source,/manufacturerModels\(vehicleData.models,'MERCEDES-BENZ'\)/);assert.match(source,/mercedesPreferred.filter\(model=>models.includes\(model\)\)/);assert.match(source,/make:'MERCEDES-BENZ',models,profiles:mercedesProfiles,initial/);assert.ok(!mercedesPreferred.includes('GLE'));assert.equal(mercedesConditions.length,6);for(const condition of mercedesConditions)assert.ok(indexableStaticRoutes.includes(condition.href));assert.equal(new Set(mercedesFaqs.map(x=>x[0])).size,mercedesFaqs.length);assert.match(mercedesConditions[4].copy,/possible affected areas, not a diagnosis/);assert.doesNotMatch(source,/fetch\(|requestSubmit|localStorage|\.value\s*=/);
});
test('Mercedes new photographs have small responsive WebPs with stable dimensions and loading priority',async()=>{
 const source=await page();for(const name of ['mercedes-sedan-valuation','mercedes-suv-assessment'])for(const suffix of ['','-960','-640']){const data=await readFile(new URL('../public/sections/'+name+suffix+'.webp',import.meta.url));assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<180000);}
 assert.equal([...source.matchAll(/<img\b/g)].length,2);assert.equal([...source.matchAll(/width="1440" height="960"/g)].length,2);assert.match(source,/fetchpriority="high"/);assert.match(source,/loading="lazy"/);
});
