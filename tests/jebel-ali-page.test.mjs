import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import test from 'node:test';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Jebel Ali is discoverable from Dubai with local SEO and the unchanged shared form', async () => {
  const [page, parent, header] = await Promise.all([read('src/pages/locations/dubai/jebel-ali.astro'), read('src/pages/locations/dubai.astro'), read('src/components/SiteHeader.astro')]);
  assert.equal(indexableStaticRoutes.filter(route => route === '/locations/dubai/jebel-ali/').length, 1);
  assert.ok(parent.includes("area.id === 'jebel-ali' ? '/locations/dubai/jebel-ali/'"));
  assert.doesNotMatch(header, /href: '\/locations\/dubai\/jebel-ali\/'/);
  assert.match(page, /title="Sell or Scrap My Car Jebel Ali Dubai \| Free Valuation"/);
  assert.match(page, /canonical="\/locations\/dubai\/jebel-ali\/"/);
  assert.match(page, /position: 4, name: 'Jebel Ali'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.doesNotMatch(page, /'@type': '(LocalBusiness|AutoRepair)'/);
  assert.match(page, /await getVehicleData\(\)/);
  assert.match(page, /<QuoteForm[^>]+variant="free-quote"/);
  assert.match(page, /subject to site approval, permissions, access arrangements and practical assessment/);
  for (const route of ['/locations/', '/locations/dubai/', '/locations/dubai/al-quoz/', '/locations/dubai/ras-al-khor/', '/sell-my-car/', '/sell-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/sell-car-with-gearbox-problems/', '/sell-flood-damaged-car/', '/scrap-my-car/', '/car-removal/', '/fleet-disposal/', '/free-quote']) {
    assert.ok(page.includes(`'${route}'`) || page.includes(`href="${route}"`), route);
    await access(new URL(`../src/pages${route === '/free-quote' ? route : route.slice(0, -1)}.astro`, import.meta.url));
  }
});

test('Jebel Ali uses two compressed, distinct WebP assets with accessible image alternatives', async () => {
  const page = await read('src/pages/locations/dubai/jebel-ali.astro');
  const assets = await Promise.all(['jebel-ali-warehouse-recovery', 'jebel-ali-commercial-fleet'].map(async name => {
    const bytes = await readFile(new URL(`../public/sections/${name}.webp`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length < 250000);
    assert.match(page, new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{60,}" width="1440" height="960" loading="lazy"`));
    return bytes;
  }));
  assert.notDeepEqual(assets[0], assets[1]);
});

test('all location pages omit decorative image captions while preserving image alternatives', async () => {
  const directory = new URL('../src/pages/locations/', import.meta.url);
  const files = (await readdir(directory, { recursive: true })).filter(path => path.endsWith('.astro'));
  for (const file of ['locations.astro', ...files.map(path => `locations/${path}`)]) {
    const page = await read(`src/pages/${file}`);
    assert.doesNotMatch(page, /figcaption|Illustrative .*?(collection|recovery|artwork)/, file);
    for (const img of page.matchAll(/<img\b[^>]*>/g)) assert.match(img[0], /alt="[^"]{40,}"/, file);
  }
  assert.equal(files.length, 11);
});
