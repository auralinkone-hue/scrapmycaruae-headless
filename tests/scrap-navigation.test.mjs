import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('scrap navigation exposes exactly the five requested services from one shared list', async () => {
  const header = await readFile(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
  const services = header.match(/const scrapMyCarServices = \[([\s\S]*?)\] as const/)[1];
  assert.deepEqual([...services.matchAll(/href: '([^']+)'/g)].map(match => match[1]), [
    '/scrap-my-car/', '/scrap-car-value/', '/car-removal/', '/scrap-old-car/', '/fleet-disposal/'
  ]);
  assert.doesNotMatch(services, /expired-registration/);
  assert.match(header, /children: scrapMyCarServices/);
  assert.match(header, /class="mobile-services mobile-services--split"/);
  assert.match(header, /aria-label="Show Scrap My Car services"/);
});

test('scrap parent links remain separate from native dropdown controls', async () => {
  const header = await readFile(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
  assert.match(header, /<a href="\/scrap-my-car\/" class:list=\{\['mobile-link'/);
  assert.match(header, /link.href === '\/scrap-my-car\/' && <a href=\{link.href\}/);
  assert.match(header, /name="desktop-services"/);
  assert.match(header, /name="mobile-service-sections"/);
});
