import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {buildCarGallery} from '../src/lib/car-gallery.ts';
import {carManufacturers,manufacturerHref} from '../src/lib/car-manufacturers.ts';
import {indexableStaticRoutes} from '../src/lib/site-routes.ts';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('hub gallery uses only CMS models for the matching make and leaves the source intact',()=>{
 const model=(make,model,order)=>({make,model,modelDisplayOrder:order,makeDisplayOrder:1});
 const input=[model('FORD','FUSION',2),model('FORD','FOCUS',1),model('FORD','focus',3),model('FORD','',0),model('HONDA','CIVIC',1),model('OTHER','UNKNOWN',1)];
 const original=JSON.stringify(input);const gallery=buildCarGallery(input);
 assert.equal(gallery.length,10);assert.deepEqual(gallery.find(m=>m.make==='FORD').models,['FOCUS','FUSION']);
 assert.deepEqual(gallery.find(m=>m.make==='TOYOTA').models,[]);assert.deepEqual(gallery.find(m=>m.make==='HONDA').models,['CIVIC']);
 assert.equal(JSON.stringify(input),original);assert.equal(buildCarGallery([]).every(m=>m.models.length===0),true);
});
test('all ten hub destinations and reused responsive assets exist and have hub breadcrumbs',async()=>{
 assert.equal(indexableStaticRoutes.filter(p=>p==='/cars/').length,1);assert.equal(new Set(carManufacturers.map(m=>m.make)).size,10);
 for(const make of carManufacturers){const href=manufacturerHref(make.slug);assert.ok(indexableStaticRoutes.includes(href));const source=await read('src/pages'+href.slice(0,-1)+'.astro');assert.match(source,/\['Car makes','\/cars\/'\]/);for(const size of ['', '-960','-640'])await access(new URL('../public/sections/'+make.image+size+'.webp',import.meta.url));}
});
test('hub keeps the full shared form, real catalogue and keyboard controls without submission side effects',async()=>{
 const page=await read('src/pages/cars/index.astro');const script=await read('src/scripts/car-hub.ts');
 assert.match(page,/CollectionPage/);assert.match(page,/ItemList/);assert.match(page,/mainEntity:hubFaqs.map/);assert.match(page,/hubFaqs.map\(\(\[question,answer\]/);
 assert.match(page,/makes=\{vehicleData.makes\} models=\{vehicleData.models\} years=\{vehicleData.years\}/);
 assert.match(script,/make.dispatchEvent\(new Event\('change'/);assert.match(script,/model.dispatchEvent\(new Event\('change'/);assert.match(script,/ArrowRight/);assert.match(script,/prefers-reduced-motion/);
 assert.doesNotMatch(script,/fetch\(|requestSubmit|\.submit\(|localStorage|innerHTML\s*=/);
 const header=await read('src/components/SiteHeader.astro');assert.match(header,/scrap-mega/);assert.match(header,/data-mobile-view="manufacturers"/);assert.match(header,/data-mobile-back="scrap"/);assert.match(header,/manufacturerHref\(make.slug\)/);
});
