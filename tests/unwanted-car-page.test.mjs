import assert from 'node:assert/strict';
import test from 'node:test';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { unwantedCarConditions, unwantedCarFaqs, unwantedCarTitle, unwantedConditionPhotos } from '../src/lib/unwanted-car-content.ts';
import { initializeUnwantedConditions } from '../src/lib/unwanted-car-interactions.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const root = path.resolve(import.meta.dirname, '..');
class Button extends EventTarget {
  constructor(id) { super(); this.dataset = { unwantedCondition: id }; this.pressed = id === 'drives' ? 'true' : 'false'; }
  getAttribute() { return `condition-panel-${this.dataset.unwantedCondition}`; }
  setAttribute(name, value) { assert.equal(name, 'aria-pressed'); this.pressed = value; }
  focus() { this.focused = true; }
}
const fixture = () => {
  const buttons = unwantedCarConditions.map(c => new Button(c.id));
  const panels = unwantedCarConditions.map(c => ({ id: `condition-panel-${c.id}`, hidden: c.id !== 'drives' }));
  const root = { dataset: {}, querySelectorAll: selector => selector === '[data-unwanted-condition]' ? buttons : panels };
  initializeUnwantedConditions(root);
  return { root, buttons, panels };
};
test('all six conditions switch one contained detail panel with correct active state', () => {
  const ui = fixture();
  ui.buttons.forEach((button, i) => {
    button.dispatchEvent(new Event('click'));
    assert.deepEqual(ui.buttons.map(b => b.pressed), ui.buttons.map((_, n) => n === i ? 'true' : 'false'));
    assert.deepEqual(ui.panels.map(p => p.hidden), ui.panels.map((_, n) => n !== i));
    assert.equal(ui.root.dataset.condition, unwantedCarConditions[i].id);
  });
  initializeUnwantedConditions(ui.root); // Multiple Astro page-load events are safe.
});
test('condition arrow/Home/End keys move focus and selection without submitting a form', () => {
  const ui = fixture();
  for (const [index, key, expected] of [[0, 'ArrowLeft', 5], [5, 'ArrowRight', 0], [0, 'End', 5], [5, 'Home', 0]]) {
    const event = new Event('keydown', { cancelable: true }); event.key = key;
    ui.buttons[index].dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(ui.buttons[expected].focused, true);
    assert.equal(ui.buttons[expected].pressed, 'true');
  }
});
test('new route is registered once; excluded sell-old-car remains absent and parent links contextually', async () => {
  assert.equal(indexableStaticRoutes.filter(p => p === '/sell-unwanted-car/').length, 1);
  assert.equal(indexableStaticRoutes.includes('/sell-old-car/'), false);
  const parent = await readFile(path.join(root, 'src/pages/sell-my-car.astro'), 'utf8');
  assert.match(parent, /'Old or unwanted cars'[^\n]*'\/sell-unwanted-car\/'/);
});

test('actual offline page HTML preserves SEO, eight matching FAQs, shared form and curated guides', { timeout: 60_000 }, async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'smc-unwanted-page-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp(path.join(root, 'src'), path.join(dir, 'src'), { recursive: true });
  await rm(path.join(dir, 'src/pages'), { recursive: true });
  await mkdir(path.join(dir, 'src/pages'), { recursive: true });
  let page = await readFile(path.join(root, 'src/pages/sell-unwanted-car.astro'), 'utf8');
  await writeFile(path.join(dir, 'src/pages/sell-unwanted-car.astro'), page.replace('export const prerender = false;', 'export const prerender = true;'));
  await writeFile(path.join(dir, 'src/lib/vehicle-data.ts'), `export async function getVehicleData(){return {makes:[{make:'TOYOTA'},{make:'HONDA'}],models:[{make:'TOYOTA',model:'CAMRY'},{make:'HONDA',model:'CIVIC'}],years:[{year:2014},{year:2016}]};}`);
  await writeFile(path.join(dir, 'src/lib/service-guides.ts'), `export async function getServiceGuidePosts(key){if(key!=='sell-unwanted-car')throw Error('Unexpected guide query');return [{_id:'original',slug:'scrap-or-sell-the-ultimate-decision-guide-for-dubai-car-owners',title:'Original Wix guide',excerpt:'Original guide excerpt',firstPublishedDate:'2025-03-01T00:00:00Z'}];}`);
  await symlink(path.join(root, 'node_modules'), path.join(dir, 'node_modules'));
  await writeFile(path.join(dir, 'package.json'), '{"type":"module"}');
  await writeFile(path.join(dir, 'astro.config.mjs'), "import{defineConfig}from'astro/config';export default defineConfig({output:'static'});");
  await writeFile(path.join(dir, 'offline.cjs'), "globalThis.fetch=async()=>{throw Error('Offline fixture: outbound fetch prohibited')};");
  const env = Object.fromEntries(['PATH','HOME','LANG','TMPDIR'].filter(k => process.env[k]).map(k => [k,process.env[k]]));
  const build = spawnSync(process.execPath, [path.join(root,'node_modules/astro/bin/astro.mjs'),'build'], { cwd:dir, encoding:'utf8',timeout:40_000,maxBuffer:3*1024*1024,
    env:{...env,PUBLIC_SEO_ENV:'staging',PUBLIC_SITE_URL:'https://www.scrapmycaruae.com',PUBLIC_ANALYTICS_ENABLED:'false',PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED:'false',NODE_OPTIONS:`--require=${path.join(dir,'offline.cjs')}`,ASTRO_TELEMETRY_DISABLED:'1'} });
  assert.equal(build.status,0,build.stdout+'\n'+build.stderr);
  const html = await readFile(path.join(dir,'dist/sell-unwanted-car/index.html'),'utf8');
  assert.ok(html.includes(`<title>${unwantedCarTitle}</title>`));
  assert.match(html, /<link rel="canonical" href="https:\/\/www.scrapmycaruae.com\/sell-unwanted-car\/"/);
  for(const name of ['robots','googlebot']) assert.ok(html.includes(`<meta name="${name}" content="noindex,nofollow"`));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html, /Sell Your Unwanted <span[^>]*>Car in the UAE<\/span>/);
  const schemas=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const faq=schemas.find(s=>s['@type']==='FAQPage');
  assert.equal(faq.mainEntity.length,8);
  assert.deepEqual(faq.mainEntity.map(q=>[q.name,q.acceptedAnswer.text]),unwantedCarFaqs);
  for(const [q,a] of unwantedCarFaqs){assert.ok(html.includes(q));assert.ok(html.includes(a.replaceAll('&','&amp;')));}
  const crumbs=schemas.find(s=>s['@type']==='BreadcrumbList');assert.equal(crumbs.itemListElement.at(-1).item,'https://www.scrapmycaruae.com/sell-unwanted-car/');
  assert.equal((html.match(/data-quote-form/g)||[]).length,1);
  for(const val of ['TOYOTA','HONDA','CAMRY','CIVIC','2014','2016'])assert.ok(html.includes(val));
  assert.ok(html.includes('placeholder="e.g. 50 123 4567"'));assert.ok(html.includes('src="/flags/ae.svg"'));
  for(const path of ['/sell-my-car/','/scrap-my-car/','/scrap-old-car/','/car-removal/','/sell-non-running-car/'])assert.ok(html.includes(`href="${path}"`));
  assert.ok(html.includes('href="/post/scrap-or-sell-the-ultimate-decision-guide-for-dubai-car-owners"'));
  assert.equal((html.match(/data-unwanted-condition=/g)||[]).length,6);
  assert.equal((html.match(/<article[^>]*data-unwanted-panel/g)||[]).length,6);
  assert.equal((html.match(/<figure class="condition-photo"/g)||[]).length, 6);
  assert.ok(!html.includes('vehicle-drawing'));
  for(const condition of unwantedCarConditions){
    const photo=unwantedConditionPhotos[condition.id];
    assert.ok(html.includes(`alt="${photo.alt}"`));
    assert.ok(html.includes(`src="${photo.src}"`));
    const bytes=await readFile(path.join(root,'public',photo.src));
    assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  }
  assert.match(html, /aria-label="UAE collection coverage/);
  assert.match(html, /fetchpriority="high"/);assert.match(html, /srcset="\/sections\/ford-fusion-valuation-640.webp 640w/);
});
