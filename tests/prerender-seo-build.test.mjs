import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { stripTypeScriptTypes } from 'node:module';
import { defaultSocialImage, defaultSocialImageAlt, serviceSchemaForPath, serializeJsonLd } from '../src/lib/structured-data.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.scrapmycaruae.com';
const pages = [
  ['contact-us/index.html', '/contact-us', false],
  ['faqs/index.html', '/faqs', false],
  ['terms-conditions/index.html', '/terms-conditions', false],
  ['thank-you/index.html', '/thank-you', true],
  ['404.html', '/404', true]
];
const metaValues = (html, name) => [...html.matchAll(/<meta\b[^>]*>/g)]
  .filter(match => match[0].includes(`name="${name}"`))
  .map(match => match[0].match(/content="([^"]*)"/)?.[1]);

test('actual isolated builds preserve production and staging prerender SEO', { timeout: 240_000 }, async t => {
  const isolated = await mkdtemp(path.join(tmpdir(), 'smc-prerender-seo-'));
  t.after(() => rm(isolated, { recursive: true, force: true }));
  // Copy build inputs, never .env files, repository state or credentials. Separate
  // dependencies keep Vite/adapter caches and generated files outside the checkout.
  for (const entry of ['src', 'public', 'scripts', 'astro.config.mjs', 'package.json', 'package-lock.json', 'tsconfig.json', 'wrangler.jsonc', 'worker-configuration.d.ts', 'node_modules']) {
    await cp(path.join(root, entry), path.join(isolated, entry), {
      recursive: true, verbatimSymlinks: true, mode: constants.COPYFILE_FICLONE
    });
  }
  const offline = path.join(isolated, 'offline.cjs');
  await writeFile(offline, `globalThis.fetch = async () => { throw new Error('Build regression test: outbound fetch blocked'); };
for (const name of ['node:http', 'node:https']) {
  const transport = require(name);
  transport.request = transport.get = () => { throw new Error('Build regression test: outbound HTTP blocked'); };
}`);
  const inherited = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG', 'SystemRoot', 'COMSPEC']
    .filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
  for (const environment of ['production', 'staging']) {
    await rm(path.join(isolated, 'dist'), { recursive: true, force: true });
    await rm(path.join(isolated, '.astro'), { recursive: true, force: true });
    const build = spawnSync(process.execPath, [path.join(isolated, 'node_modules/astro/bin/astro.mjs'), 'build'], {
      cwd: isolated, timeout: 100_000, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
      env: {
        ...inherited, PUBLIC_SEO_ENV: environment, PUBLIC_SITE_URL: origin,
        PUBLIC_WIX_CLIENT_ID: '00000000-0000-4000-8000-000000000000',
        WIX_QUOTE_REQUESTS_COLLECTION_ID: 'QuoteRequestsStaging',
        PUBLIC_ANALYTICS_ENABLED: environment === 'production' ? 'true' : 'false',
        PUBLIC_GTM_ID: 'GTM-TFQ7BDGX',
        PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED: environment === 'production' ? 'true' : 'false',
        PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: '49956eb062ca47e2b1c53997795bee44',
        ASTRO_TELEMETRY_DISABLED: '1', WRANGLER_SEND_METRICS: 'false',
        NODE_OPTIONS: `--require=${offline}`
      }
    });
    assert.equal(build.status, 0, `${environment} build failed: ${build.error?.message || ''}\n${build.stdout}\n${build.stderr}`);
    await t.test(`${environment} generated HTML: robots, Googlebot, canonicals and asset headers`, async () => {
      const results = [];
      for (const [file, route, noindex] of pages) {
        const html = await readFile(path.join(isolated, 'dist/client', file), 'utf8');
        const expected = environment === 'production' && !noindex ? 'index,follow' : 'noindex,nofollow';
        results.push({ route, html, expected, robots: metaValues(html, 'robots'), googlebot: metaValues(html, 'googlebot') });
        // Emit all actual values before assertions so failures remain useful evidence.
        t.diagnostic(JSON.stringify({ environment, route, robots: metaValues(html, 'robots'), googlebot: metaValues(html, 'googlebot') }));
      }
      for (const { route, html, expected } of results) {
        assert.deepEqual(metaValues(html, 'robots'), [expected], `${environment} ${route} robots`);
        assert.deepEqual(metaValues(html, 'googlebot'), [expected], `${environment} ${route} Googlebot`);
        assert.equal([...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)].length, 1);
        assert.ok(html.includes(`href="${origin}${route}"`), `${environment} ${route} canonical`);
        assert.deepEqual(metaValues(html, 'smc-cloudflare-analytics-config'), environment === 'production' ? ['49956eb062ca47e2b1c53997795bee44'] : []);
        assert.deepEqual(metaValues(html, 'smc-analytics-config'), environment === 'production' ? ['GTM-TFQ7BDGX'] : []);
        // Optional beacons are installed by the consent controller, never hardcoded.
        assert.doesNotMatch(html, /<script[^>]+src=["'][^"']*cloudflareinsights\.com/);
        assert.deepEqual(metaValues(html, 'twitter:image'), [origin + defaultSocialImage]);
        assert.deepEqual(metaValues(html, 'twitter:image:alt'), [defaultSocialImageAlt]);
        assert.deepEqual(metaValues(html, 'twitter:card'), ['summary_large_image']);
        assert.ok(html.includes(`property="og:image" content="${origin}${defaultSocialImage}"`));
        assert.ok(html.includes(`property="og:url" content="${origin}${route}"`));
      }
      const headers = await readFile(path.join(isolated, 'dist/client/_headers'), 'utf8');
      assert.equal(headers.includes('X-Robots-Tag: noindex'), environment === 'staging');
      assert.match(headers, /Cache-Control: public, max-age=31536000, immutable/);
    });
  }
});


test('BaseLayout runtime requests retain hostname checks and explicit noindex overrides', async () => {
  const layout = (await readFile(path.join(root, 'src/layouts/BaseLayout.astro'), 'utf8')).split('---')[1];
  const code = stripTypeScriptTypes(layout.replace(/^import .*\n/gm, '').replaceAll('import.meta.env', '{}'));
  const resolve = new Function('Astro', 'canonicalUrl', 'robotsContent', 'siteUrl', 'defaultSocialImage', 'defaultSocialImageAlt', 'serviceSchemaForPath', 'serializeJsonLd', code + ';return resolvedRobots;');
  for (const environment of ['production', 'staging']) {
    const source = (await readFile(path.join(root, 'src/lib/seo.ts'), 'utf8'))
      .replaceAll('import.meta.env', JSON.stringify({ PUBLIC_SEO_ENV: environment, PUBLIC_SITE_URL: origin }));
    const seo = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
    for (const host of [origin, 'https://preview.example.test', 'https://smc-headless-worker.hussain-gscx.workers.dev', 'http://localhost:4321']) {
      const astro = { url: new URL(host + '/contact-us'), isPrerendered: false, props: {} };
      const expected = environment === 'production' && host === origin ? 'index,follow' : 'noindex,nofollow';
      assert.equal(resolve(astro, seo.canonicalUrl, seo.robotsContent, seo.siteUrl, defaultSocialImage, defaultSocialImageAlt, serviceSchemaForPath, serializeJsonLd), expected, `${environment} ${host}`);
      assert.equal(resolve({ ...astro, props: { noindex: true } }, seo.canonicalUrl, seo.robotsContent, seo.siteUrl, defaultSocialImage, defaultSocialImageAlt, serviceSchemaForPath, serializeJsonLd), 'noindex,nofollow');
    }
  }
});
