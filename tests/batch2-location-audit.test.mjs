import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const locationRoutes = indexableStaticRoutes.filter(path => path.startsWith('/locations/'));
const dataModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
async function seoModule(environment) {
  const source = (await read('src/lib/seo.ts')).replaceAll('import.meta.env', JSON.stringify({PUBLIC_SEO_ENV: environment, PUBLIC_SITE_URL: 'https://www.scrapmycaruae.com'}));
  const url = dataModule(stripTypeScriptTypes(source));
  return { url, api: await import(url) };
}
function webpSize(bytes) {
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  for(let pos=12;pos+8<bytes.length;){
    const type=bytes.toString('ascii',pos,pos+4), length=bytes.readUInt32LE(pos+4), start=pos+8;
    if(type==='VP8X') return [1+bytes.readUIntLE(start+4,3),1+bytes.readUIntLE(start+7,3)];
    if(type==='VP8 ') return [bytes.readUInt16LE(start+6)&0x3fff,bytes.readUInt16LE(start+8)&0x3fff];
    if(type==='VP8L'){const bits=bytes.readUInt32LE(start+1);return [1+(bits&0x3fff),1+((bits>>>14)&0x3fff)];}
    pos=start+length+(length%2);
  }
  throw new Error('Missing WebP canvas dimensions');
}

test('location manifest exactly covers published files and every child has parent discovery',async()=>{
  const walk=async dir=>{const entries=await readdir(new URL(`../${dir}`,import.meta.url),{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]))).flat();};
  const files=['src/pages/locations.astro',...(await walk('src/pages/locations')).filter(p=>p.endsWith('.astro'))];
  const actual=files.map(p=>p.replace('src/pages','').replace('.astro','/')).sort();
  assert.deepEqual([...locationRoutes].sort(),actual);
  assert.equal(new Set(locationRoutes).size,19);
  for(const route of locationRoutes.filter(p=>p.split('/').length===5)){
    const parent=route.split('/').slice(0,-2).join('/')+'/';
    const parentSource=await read(`src/pages${parent.slice(0,-1)}.astro`);
    const childSource=await read(`src/pages${route.slice(0,-1)}.astro`);
    assert.ok(parentSource.includes(route),`${parent} discovers ${route}`);
    assert.ok(childSource.includes(`href="${parent}"`),`${route} links back`);
  }
});

test('all location image dimensions match their WebP canvases and pages have no captions',async()=>{
  let images=0;
  for(const route of locationRoutes){
    const source=await read(`src/pages${route.slice(0,-1)}.astro`);
    assert.doesNotMatch(source,/<figcaption\b/);
    for(const match of source.matchAll(/<img\b[^>]*src="(\/sections\/[^" ]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"/g)){
      const bytes=await readFile(new URL(`../public${match[1]}`,import.meta.url));
      assert.deepEqual(webpSize(bytes),[Number(match[2]),Number(match[3])],`${route}: ${match[1]}`);
      assert.ok(bytes.length<350000,match[1]);images++;
    }
  }
  assert.equal(images,39);
});

test('real SEO policy indexes only the production host and protects staging for every location',async()=>{
  const production=(await seoModule('production')).api;
  const staging=(await seoModule('staging')).api;
  for(const route of locationRoutes){
    const live=new URL(`https://www.scrapmycaruae.com${route}`);
    const preview=new URL(`https://smc-headless-worker.hussain-gscx.workers.dev${route}`);
    assert.equal(production.robotsContent(live),'index,follow');
    assert.equal(production.robotsContent(preview),'noindex,nofollow');
    assert.equal(staging.robotsContent(preview),'noindex,nofollow');
    assert.equal(staging.hasUnsafeSeoConfiguration(live),true);
    assert.equal(production.canonicalUrl(route),live.href);
  }
});

test('real sitemap handler emits each production location once and blocks staging without querying Wix',async()=>{
  // Isolated read-only Wix fixture: exercise the real handler without any external data access.
  const sitemap=stripTypeScriptTypes(await read('src/pages/sitemap.xml.ts')).replace(/^import[^\n]+\n/gm,'');
  async function handler(environment){
    const seo=await seoModule(environment);
    return import(dataModule(`import { canonicalUrl, isIndexableRequest } from ${JSON.stringify(seo.url)};\nconst indexableStaticRoutes=${JSON.stringify(indexableStaticRoutes)};\nconst wixClient={auth:{generateVisitorTokens:async()=>({accessToken:{value:'isolated-test-token'}})}};\nconst getWixPostSeo=()=>({});\nconst fetch=async()=>Response.json({posts:[],pagingMetadata:{cursors:{}}});\n${sitemap}`));
  }
  const production=await handler('production');
  const response=await production.GET({url:new URL('https://www.scrapmycaruae.com/sitemap.xml')});
  assert.equal(response.status,200);const xml=await response.text();
  const locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.equal(locs.length,new Set(locs).size);
  for(const route of locationRoutes)assert.equal(locs.filter(x=>x===`https://www.scrapmycaruae.com${route}`).length,1,route);
  const staging=await handler('staging');
  const blocked=await staging.GET({url:new URL('https://smc-headless-worker.hussain-gscx.workers.dev/sitemap.xml')});
  assert.equal(blocked.status,404);assert.match(blocked.headers.get('x-robots-tag'),/noindex/);
});

test('SEO audit accepts production canonicals when inspecting a separate staging origin',async()=>{
  const { spawnSync } = await import('node:child_process');
  const fixture=`globalThis.fetch=async(input)=>{const url=new URL(input);if(url.pathname==='/sitemap.xml')return new Response('Preview sitemap disabled.',{status:404,headers:{'x-robots-tag':'noindex,nofollow'}});const redirects={'/blog':'/blogs','/privay-policy':'/privacy-policy'};if(redirects[url.pathname])return new Response(null,{status:301,headers:{location:redirects[url.pathname]}});return new Response('<title>Audit fixture</title><meta name="description" content="Fixture description"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://www.scrapmycaruae.com'+url.pathname+'"><h1>Audit fixture</h1>');};`;
  const child=spawnSync(process.execPath,['--experimental-strip-types','--import',dataModule(fixture),'scripts/seo-route-audit.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PUBLIC_SEO_ENV:'staging',PUBLIC_SITE_URL:'https://www.scrapmycaruae.com',SEO_AUDIT_URL:'https://preview.example.test',SEO_AUDIT_POST_PATHS:''},encoding:'utf8'});
  assert.equal(child.status,0,child.stdout+child.stderr);
  assert.match(child.stdout,/PASS staging sitemap blocked/);
});
