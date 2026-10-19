import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('locations hub uses the shared form and correct SEO without invented branch schema', async () => {
  const page = await read('src/pages/locations.astro');
  assert.match(page, /title="Car Collection Locations UAE \| Scrap My Car UAE"/);
  assert.match(page, /canonical="\/locations\/"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.doesNotMatch(page, /'@type': '(LocalBusiness|AutoRepair)'/);
  assert.match(page, /await getVehicleData\(\)/);
  assert.match(page, /<QuoteForm[^>]+variant="free-quote"/);
  assert.ok(page.indexOf('<div class="hero-form">') < page.indexOf('<ul class="hero-points">'));
  for (const href of ['/scrap-my-car/', '/scrap-car-value/', '/car-removal/', '/sell-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/', '/sell-car-with-gearbox-problems/', '/sell-flood-damaged-car/', '/fleet-disposal/', '/free-quote']) {
    assert.ok(page.includes(`'${href}'`) || page.includes(`href="${href}"`), `missing ${href}`);
  }
});

test('locations hub is discoverable and has coverage destinations for all eight named areas', async () => {
  const [page, footer] = await Promise.all([read('src/pages/locations.astro'), read('src/components/SiteFooter.astro')]);
  assert.equal(indexableStaticRoutes.filter(route => route === '/locations/').length, 1);
  assert.match(footer, /href="\/locations\/">UAE Locations/);
  for (const id of ['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'al-ain', 'ras-al-khaimah', 'fujairah', 'umm-al-quwain']) {
    assert.ok(page.includes(`'${id}'`));
  }
  assert.ok(page.includes("['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'ras-al-khaimah', 'al-ain', 'fujairah'].includes(area.id) ? `/locations/${area.id}/` : `#${area.id}`"));
  assert.match(page, /id=\{group.id\}/);
  assert.match(page, /<details id=\{id\} class="wider-location"/);

});

test('locations images are compressed WebP files with descriptive accessible markup', async () => {
  const page = await read('src/pages/locations.astro');
  for (const name of ['uae-vehicle-collection', 'uae-car-recovery-access', 'uae-collection-landscape']) {
    const data = await readFile(new URL(`../public/sections/${name}.webp`, import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    assert.ok(data.length < 250_000);
    assert.match(page, new RegExp(`src="/sections/${name}\\.webp" alt="[^"]{50,}" width="1200" height="900" loading="lazy"`));
  }
  assert.match(page, /\.photo-scene figcaption\{[^}]*background:#fff;[^}]*font-size:14px/);
});
