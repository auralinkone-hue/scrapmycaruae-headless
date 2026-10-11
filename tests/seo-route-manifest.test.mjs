import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes, permanentRedirects } from '../src/lib/site-routes.ts';

const readProjectFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('the real indexable author route is included once in the static sitemap manifest', () => {
  assert.equal(indexableStaticRoutes.filter((route) => route === '/author/smc-uae').length, 1);
});

test('compatibility redirects are dynamic permanent responses and retain query strings', async () => {
  const [blog, privacy, privacyDestination] = await Promise.all([
    readProjectFile('src/pages/blog.astro'),
    readProjectFile('src/pages/privay-policy.astro'),
    readProjectFile('src/pages/privacy-policy.astro')
  ]);

  assert.deepEqual(permanentRedirects, {
    '/blog': '/blogs',
    '/privay-policy': '/privacy-policy'
  });

  for (const [source, destination] of [
    [blog, '/blogs'],
    [privacy, '/privacy-policy']
  ]) {
    assert.match(source, /export const prerender = false/);
    assert.match(source, /status:\s*301/);
    assert.ok(source.includes(`Location: \`${destination}\${Astro.url.search}\``));
  }

  assert.match(privacyDestination, /export const prerender = false/);
});
