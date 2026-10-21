import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('scrap navigation exposes existing services and the cars hub from one shared list', async () => {
  const header = await readFile(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
  const services = header.match(/const scrapMyCarServices = \[([\s\S]*?)\] as const/)[1];
  assert.deepEqual([...services.matchAll(/href: '([^']+)'/g)].map(match => match[1]), [
    '/scrap-my-car/', '/scrap-car-value/', '/car-removal/', '/scrap-old-car/', '/fleet-disposal/', '/cars/'
  ]);
  assert.doesNotMatch(services, /expired-registration/);
  assert.match(header, /children: scrapMyCarServices/);
  assert.match(header, /data-mobile-forward=/);
  assert.match(header, /items: scrapMyCarServices/);
});

test('desktop keeps its clickable parent while mobile uses dedicated drill-in panels', async () => {
  const header = await readFile(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
  assert.match(header, /link.href === '\/scrap-my-car\/' && <a href=\{link.href\}/);
  assert.match(header, /name="desktop-services"/);
  assert.doesNotMatch(header, /name="mobile-service-sections"|class="mobile-services/);
  assert.match(header, /View all /);
  assert.match(header, /\/sell-car-with-expired-registration\//);
  assert.match(header, /data-mobile-back/);
  assert.match(header, /view\.inert = !active/);
  assert.match(header, /prefers-reduced-motion/);
  assert.match(header, /event.key === 'Escape'/);
  assert.match(header, /event.key !== 'Tab'/);
});
