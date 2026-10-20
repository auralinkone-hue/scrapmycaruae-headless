import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';
import {manufacturerModels,resolveModelGuidance} from '../src/lib/manufacturer-models.ts';
import {toyotaModelGuidance,toyotaConditions,toyotaFaqs} from '../src/lib/toyota-content.ts';
import {indexableStaticRoutes} from '../src/lib/site-routes.ts';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const vehicle=(make,model,order)=>({make,model,modelDisplayOrder:order,makeDisplayOrder:1});

test('manufacturer model source filters, orders and deduplicates live CMS entries without inventing a catalogue',()=>{
 const data=[vehicle('HONDA','CIVIC',1),vehicle('TOYOTA','PRADO',3),vehicle('TOYOTA','COROLLA',1),vehicle('TOYOTA','prado',4),vehicle('TOYOTA','UNLISTED NEW MODEL',2),vehicle('TOYOTA','',0)];
 const original=JSON.stringify(data);
 assert.deepEqual(manufacturerModels(data,'TOYOTA').map(x=>x.model),['COROLLA','UNLISTED NEW MODEL','PRADO']);
 assert.equal(JSON.stringify(data),original);
 assert.deepEqual(manufacturerModels([], 'TOYOTA'),[]);
 assert.equal(manufacturerModels(data,'TOYOTA').some(x=>x.model==='HILUX'),false);
 const fallback=resolveModelGuidance('UNLISTED NEW MODEL',toyotaModelGuidance);
 assert.match(fallback.title,/Unlisted New Model/);assert.equal(fallback.checks.length,3);
 assert.equal(resolveModelGuidance('HILUX',toyotaModelGuidance).category,'Pickup & working vehicle');
});

test('Toyota condition guidance covers all six states and only published service destinations',async()=>{
 assert.deepEqual(toyotaConditions.map(x=>x.id),['accident','engine','gearbox','non-running','flood','old']);
 assert.equal(new Set(toyotaConditions.map(x=>x.title)).size,6);
 for(const item of toyotaConditions){assert.ok(indexableStaticRoutes.includes(item.href),item.href);await access(new URL('../src/pages'+item.href.slice(0,-1)+'.astro',import.meta.url));assert.equal(item.checks.length,3);}
 assert.match(toyotaConditions.find(x=>x.id==='flood').copy,/possible affected areas, not a diagnosis/);
 assert.equal(toyotaFaqs.length,new Set(toyotaFaqs.map(x=>x[0])).size);
});

test('Toyota route uses shared SEO, matching visible FAQ data, real breadcrumbs and one H1',async()=>{
 const page=await read('src/pages/cars/toyota.astro');
 assert.equal(indexableStaticRoutes.filter(x=>x==='/cars/toyota/').length,1);
 assert.equal([...page.matchAll(/<h1\b/g)].length,1);
 assert.match(page,/Scrap Your Toyota<\/span> <span>Car in the UAE/);
 assert.match(page,/title="Scrap Toyota Car in UAE \| Free Valuation \| Scrap My Car UAE"/);
 assert.match(page,/canonical="\/cars\/toyota\/"/);
 assert.match(page,/'@type':'BreadcrumbList'/);assert.match(page,/crumbs.map/);
 assert.match(page,/'@type':'FAQPage',mainEntity:toyotaFaqs.map/);
 assert.match(page,/<div>\{toyotaFaqs.map/);
 assert.doesNotMatch(page,/LocalBusiness|LocationGlyph|LocationsMotion|data-location-hub|hero-grid|figcaption/);
 const seo=stripTypeScriptTypes((await read('src/lib/seo.ts')).replaceAll('import.meta.env',JSON.stringify({PUBLIC_SEO_ENV:'production',PUBLIC_SITE_URL:'https://www.scrapmycaruae.com'})));
 const api=await import('data:text/javascript;base64,'+Buffer.from(seo).toString('base64'));
 assert.equal(api.canonicalUrl('/cars/toyota/'),'https://www.scrapmycaruae.com/cars/toyota/');
 assert.equal(api.robotsContent(new URL('https://www.scrapmycaruae.com/cars/toyota/')),'index,follow');
 assert.equal(api.robotsContent(new URL('https://smc-headless-worker.hussain-gscx.workers.dev/cars/toyota/')),'noindex,nofollow');
});

test('manufacturer interaction sync uses existing form events without bypassing validation or writing condition data',async()=>{
 const source=await read('src/components/manufacturer/ManufacturerInteractions.astro');
 const page=await read('src/pages/cars/toyota.astro');
 assert.match(page,/getVehicleData\(\)/);assert.match(page,/<QuoteForm makes=\{makes\} models=\{models\}/);
 assert.match(source,/model.disabled\|\|!Array.from\(model.options\).some/);
 assert.match(source,/dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
 assert.doesNotMatch(source,/fetch\(|requestSubmit\(|\.submit\(|\/api\/quote|localStorage|innerHTML\s*=/);
 assert.match(source,/ArrowRight/);assert.match(source,/ArrowLeft/);assert.match(source,/aria-selected/);
 assert.match(source,/prefers-reduced-motion/);
 assert.match(await read('src/components/manufacturer/ModelExplorer.astro'),/preferred.filter\(model=>models.includes\(model\)\)/);
});

test('Toyota photography has six small responsive WebP assets and explicit eager/lazy priorities',async()=>{
 const page=await read('src/pages/cars/toyota.astro');
 for(const name of ['toyota-prado-valuation','toyota-sedan-assessment']){
  for(const size of ['', '-960','-640']){const data=await readFile(new URL('../public/sections/'+name+size+'.webp',import.meta.url));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<180000);}
 }
 assert.equal([...page.matchAll(/<img\b/g)].length,2);
 assert.match(page,/fetchpriority="high"/);assert.match(page,/loading="lazy" decoding="async"/);
 assert.equal([...page.matchAll(/srcset=/g)].length,2);
 assert.equal([...page.matchAll(/width="1440" height="960"/g)].length,2);
});

test('production sitemap handler includes Toyota exactly once and staging remains blocked',async()=>{
 const dataModule=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
 const seoUrl=dataModule(stripTypeScriptTypes((await read('src/lib/seo.ts')).replaceAll('import.meta.env',JSON.stringify({PUBLIC_SEO_ENV:'production',PUBLIC_SITE_URL:'https://www.scrapmycaruae.com'}))));
 const source=stripTypeScriptTypes(await read('src/pages/sitemap.xml.ts')).replace(/^import[^\n]+\n/gm,'');
 const module=await import(dataModule(`import {canonicalUrl,isIndexableRequest} from ${JSON.stringify(seoUrl)};const indexableStaticRoutes=${JSON.stringify(indexableStaticRoutes)};const wixClient={auth:{generateVisitorTokens:async()=>({accessToken:{value:'isolated-test-token'}})}};const getWixPostSeo=()=>({});const fetch=async()=>Response.json({posts:[],pagingMetadata:{cursors:{}}});${source}`));
 const production=await module.GET({url:new URL('https://www.scrapmycaruae.com/sitemap.xml')});
 assert.equal(production.status,200);assert.equal((await production.text()).split('<loc>https://www.scrapmycaruae.com/cars/toyota/</loc>').length-1,1);
 const staging=await module.GET({url:new URL('https://smc-headless-worker.hussain-gscx.workers.dev/sitemap.xml')});assert.equal(staging.status,404);
});
