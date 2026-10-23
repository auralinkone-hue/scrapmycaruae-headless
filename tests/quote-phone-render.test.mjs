import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { countryDialOptions, countryFlag } from '../src/lib/country-codes.ts';
import { phoneDialCode } from '../src/lib/phone.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

test('actual offline Astro output renders accessible country and phone controls in all shared form variants', { timeout: 60_000 }, async t => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'smc-phone-render-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await mkdir(path.join(fixture, 'src/pages'), { recursive: true });
  await mkdir(path.join(fixture, 'src/components'), { recursive: true });
  await mkdir(path.join(fixture, 'src/lib'), { recursive: true });
  for (const file of ['src/components/QuoteForm.astro', 'src/lib/phone.ts', 'src/lib/quote-phone-input.ts', 'src/lib/country-codes.ts']) {
    await cp(path.join(root, file), path.join(fixture, file));
  }
  await symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'));
  await writeFile(path.join(fixture, 'package.json'), '{"type":"module"}');
  await writeFile(path.join(fixture, 'astro.config.mjs'), "import {defineConfig} from 'astro/config'; export default defineConfig({output:'static'});");
  await writeFile(path.join(fixture, 'src/pages/index.astro'), `---
import QuoteForm from '../components/QuoteForm.astro';
const makes = [{make:'TOYOTA',featuredMake:true},{make:'HONDA',featuredMake:false}];
const models = [{make:'TOYOTA',model:'CAMRY'},{make:'HONDA',model:'CIVIC'}];
const years = [{year:2014}];
---
<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body>
{['default','blog-sidebar','free-quote'].map(variant => <QuoteForm makes={makes} models={models} years={years} variant={variant} />)}
</body></html>`);
  const offline = path.join(fixture, 'offline.cjs');
  await writeFile(offline, "globalThis.fetch=async()=>{throw Error('Phone fixture: outbound requests prohibited')};");
  const inherited = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
  const build = spawnSync(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', fixture], {
    cwd: fixture, encoding: 'utf8', timeout: 40_000, maxBuffer: 2 * 1024 * 1024,
    env: { ...inherited, ASTRO_TELEMETRY_DISABLED: '1', NODE_OPTIONS: `--require=${offline}` }
  });
  assert.equal(build.status, 0, `${build.error || ''}\n${build.stdout}\n${build.stderr}`);
  const html = await readFile(path.join(fixture, 'dist/index.html'), 'utf8');
  assert.equal([...html.matchAll(/name="phoneCountry"/g)].length, 3);
  assert.equal([...html.matchAll(/Phone country and calling code/g)].length, 3);
  assert.equal([...html.matchAll(/value="AE" selected/g)].length, 3);
  for (const country of countryDialOptions) {
    assert.ok(html.includes(`${countryFlag(country.iso)} ${country.name.replaceAll('&', '&amp;')} (${phoneDialCode(country.iso)})`), country.name);
  }
  const ids = [...html.matchAll(/<input\b[^>]*id="(quote-phone-[^"]+)"[^>]*name="whatsapp"/g)].map(match => match[1]);
  assert.equal(ids.length, 3); assert.equal(new Set(ids).size, 3);
  for (const id of ids) {
    assert.ok(html.includes(`for="${id}"`));
    assert.ok(html.includes(`aria-describedby="${id}-example ${id}-error"`));
    assert.ok(html.includes(`id="${id}-error"`));
  }
  assert.equal([...html.matchAll(/autocomplete="tel-national"/g)].length, 3);
  assert.equal([...html.matchAll(/placeholder="50 123 4567"/g)].length, 3);
  assert.equal([...html.matchAll(/e.g. \+971 50 123 4567/g)].length, 3);
  assert.equal([...html.matchAll(/data-vehicle-models=/g)].length, 3);
  assert.ok(html.includes('CAMRY') && html.includes('CIVIC'));
  assert.match(html, /<script type="module" src="\/_astro\//);
});
