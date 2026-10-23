import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { validateDeployment, loadDeployment, verifyDeploymentBuild } from '../scripts/deployment-safety.mjs';
import { runDeployment } from '../scripts/deploy.mjs';
import { requireQuoteRequestsCollectionId } from '../src/lib/quote-collection.ts';

const root = resolve(import.meta.dirname, '..');
const targets = JSON.parse(readFileSync(join(root, 'deployment-targets.json'), 'utf8'));
const stagingConfig = JSON.parse(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
const staging = {
  DEPLOYMENT_WORKER_NAME: 'smc-headless-worker', DEPLOYMENT_CONFIG_FILE: 'wrangler.jsonc',
  PUBLIC_SEO_ENV: 'staging', PUBLIC_SITE_URL: 'https://www.scrapmycaruae.com',
  PUBLIC_WIX_CLIENT_ID: 'f3ac0e15-b92a-42ce-8340-f9ec2a40d267',
  WIX_QUOTE_REQUESTS_COLLECTION_ID: 'QuoteRequestsStaging', PUBLIC_ANALYTICS_ENABLED: 'false'
};
// Fixture names only: no actual production resource is specified or created.
const approved = { ...targets, production: { workerName: 'approved-test-fixture', configFile: 'fixture-production.json', approvalReference: 'fixture-owner-approval' } };
const production = { ...staging, DEPLOYMENT_WORKER_NAME: approved.production.workerName, DEPLOYMENT_CONFIG_FILE: approved.production.configFile, PUBLIC_SEO_ENV: 'production', WIX_QUOTE_REQUESTS_COLLECTION_ID: 'QuoteRequests' };
const prodConfig = { ...stagingConfig, name: production.DEPLOYMENT_WORKER_NAME };
const validateStage = overrides => validateDeployment('staging', { ...staging, ...overrides }, targets, stagingConfig);

test('existing repository staging target and CI environment remain valid', () => {
  assert.equal(loadDeployment('staging', staging, root).workerName, 'smc-headless-worker');
  const workflow = readFileSync(join(root, '.github/workflows/deploy-development-preview.yml'), 'utf8');
  const actual = Object.fromEntries([...workflow.matchAll(/^      ([A-Z_]+): (.+)$/gm)].map(([, k, v]) => [k, v.replace(/^"|"$/g, '')]));
  assert.equal(loadDeployment('staging', actual, root).collection, 'QuoteRequestsStaging');
});
for (const [name, change] of [
  ['production SEO', { PUBLIC_SEO_ENV: 'production' }],
  ['production CMS', { WIX_QUOTE_REQUESTS_COLLECTION_ID: 'QuoteRequests' }],
  ['arbitrary CMS', { WIX_QUOTE_REQUESTS_COLLECTION_ID: 'OtherCollection' }],
  ['analytics enabled', { PUBLIC_ANALYTICS_ENABLED: 'true' }],
  ['different Worker', { DEPLOYMENT_WORKER_NAME: 'other' }],
  ['different config', { DEPLOYMENT_CONFIG_FILE: 'other.json' }],
  ['non-development CI ref', { GITHUB_REF: 'refs/heads/not-development' }],
  ['implicit Wrangler environment', { CLOUDFLARE_ENV: 'production' }],
  ['noncanonical URL', { PUBLIC_SITE_URL: 'https://example.test' }],
  ['canonical query', { PUBLIC_SITE_URL: 'https://www.scrapmycaruae.com/?other=1' }]
]) test(`staging rejects ${name}`, () => assert.throws(() => validateStage(change), /Deployment blocked/));
for (const key of Object.keys(staging)) test(`missing ${key} fails closed`, () => {
  const env = { ...staging }; delete env[key];
  assert.throws(() => validateDeployment('staging', env, targets, stagingConfig));
});
test('production is currently blocked, even with otherwise correct production settings', () => {
  assert.equal(targets.production, null);
  assert.throws(() => loadDeployment('production', production, root), /approved/);
});
test('production fixture passes only with explicit matching approved parameters and config', () => {
  assert.equal(validateDeployment('production', production, approved, prodConfig).collection, 'QuoteRequests');
  assert.throws(() => validateDeployment('production', production, { ...approved, production: { ...approved.production, approvalReference: '' } }, prodConfig), /approval/);
  assert.throws(() => validateDeployment('production', { ...production, DEPLOYMENT_WORKER_NAME: undefined }, approved, prodConfig));
  assert.throws(() => validateDeployment('production', production, approved, stagingConfig));
});
test('production cannot target staging Worker or source configuration', () => {
  for (const target of [{ ...approved.production, workerName: 'smc-headless-worker' }, { ...approved.production, configFile: 'wrangler.jsonc' }]) {
    assert.throws(() => validateDeployment('production', { ...production, DEPLOYMENT_WORKER_NAME: target.workerName, DEPLOYMENT_CONFIG_FILE: target.configFile }, { ...approved, production: target }, { name: target.workerName }), /separate/);
  }
});
test('production requires exactly QuoteRequests in deployment and runtime collection guard', () => {
  for (const collection of ['QuoteRequestsStaging', 'CustomQuotes', undefined]) {
    assert.throws(() => validateDeployment('production', { ...production, WIX_QUOTE_REQUESTS_COLLECTION_ID: collection }, approved, prodConfig));
    assert.throws(() => requireQuoteRequestsCollectionId(collection, 'production'));
  }
  assert.equal(requireQuoteRequestsCollectionId('QuoteRequests', 'production'), 'QuoteRequests');
  assert.throws(() => requireQuoteRequestsCollectionId('QuoteRequests', 'staging'));
});
test('runtime configuration conflicts and preview domain routes fail closed', () => {
  for (const change of [{ vars: { WIX_QUOTE_REQUESTS_COLLECTION_ID: 'QuoteRequests' } }, { vars: { PUBLIC_SEO_ENV: 'production' } }, { env: { other: {} } }, { routes: ['example.test/*'] }]) {
    assert.throws(() => validateDeployment('staging', staging, targets, { ...stagingConfig, ...change }));
  }
});
function harness({ failure, guardFailure = false, artifactFailure = false } = {}) {
  const calls = []; let checks = 0;
  const plan = validateStage({});
  const options = { env: staging, branch: () => 'development', check: () => { calls.push('check'); checks++; if (guardFailure) throw new Error('unsafe'); return plan; }, verifyBuild: () => { calls.push('artifacts'); if (artifactFailure) throw new Error('unsafe output'); }, run: (command, args) => { const step = args.includes('deploy') ? 'upload' : args.join(' '); calls.push(step); return { status: step === failure ? 1 : 0 }; } };
  return { calls, options };
}
for (const failure of ['test', 'run build']) test(`failed ${failure} prevents upload`, () => {
  const { calls, options } = harness({ failure });
  assert.throws(() => runDeployment('staging', options), /failed/);
  assert.ok(!calls.includes('upload')); assert.ok(!calls.includes('artifacts'));
  if (failure === 'test') assert.ok(!calls.includes('run build'));
});
test('unsafe configuration fails before any prerequisite command', () => {
  const { calls, options } = harness({ guardFailure: true });
  assert.throws(() => runDeployment('staging', options)); assert.deepEqual(calls, ['check']);
});
test('unsafe built output prevents upload', () => {
  const { calls, options } = harness({ artifactFailure: true });
  assert.throws(() => runDeployment('staging', options)); assert.ok(!calls.includes('upload'));
});
test('mocked deployment verifies both source and output before explicit-target upload', () => {
  const { calls, options } = harness(); let upload;
  const runner = options.run;
  options.run = (command, args) => { if (args.includes('deploy')) upload = args; return runner(command, args); };
  runDeployment('staging', options);
  assert.deepEqual(calls, ['check', 'test', 'run build', 'check', 'artifacts', 'upload']);
  assert.deepEqual(upload.slice(1), ['deploy', '--name', 'smc-headless-worker']);
});
test('CI gates target, tests, build and generated output in order with no failure bypass', () => {
  const workflow = readFileSync(join(root, '.github/workflows/deploy-development-preview.yml'), 'utf8');
  const steps = ['run: npm run deployment:verify -- staging\n', 'run: npm test', 'run: npm run build', 'run: npm run deployment:verify -- staging --built', 'uses: cloudflare/wrangler-action@v3'];
  const offsets = steps.map(step => workflow.indexOf(step));
  assert.ok(offsets.every((offset, i) => offset >= 0 && (!i || offset > offsets[i - 1])));
  assert.doesNotMatch(workflow, /continue-on-error|always\(|\|\|\s*true/);
  assert.match(workflow, /github.ref == 'refs\/heads\/development'/);
  assert.match(workflow, /command: deploy --name smc-headless-worker\n/);
  assert.doesNotMatch(workflow, /command: deploy[^\n]*--config/);
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.deploy, 'node scripts/deploy.mjs production');
  assert.equal(pkg.scripts['deploy:staging'], 'node scripts/deploy.mjs staging');
});
test('actual generated artifact verifier rejects mixed environment output and target redirection', () => {
  const dir = mkdtempSync(join(tmpdir(), 'smc-deploy-fixture-'));
  const write = (file, data) => { const full = join(dir, file); mkdirSync(resolve(full, '..'), { recursive: true }); writeFileSync(full, typeof data === 'string' ? data : JSON.stringify(data)); };
  const plan = validateStage({});
  try {
    write('deployment-targets.json', targets);
    write('dist/server/wrangler.json', { ...stagingConfig, main: 'entry.mjs', userConfigPath: join(dir, 'wrangler.jsonc') });
    write('.wrangler/deploy/config.json', { configPath: '../../dist/server/wrangler.json', auxiliaryWorkers: [] });
    write('dist/server/entry.mjs', 'export default {};');
    write('dist/server/chunks/quote_fixture.mjs', 'requireQuoteRequestsCollectionId(runtimeCollection ?? "QuoteRequestsStaging", "staging")');
    const html = page => `<link rel="canonical" href="https://www.scrapmycaruae.com/${page}"><meta name="robots" content="noindex,nofollow"><meta name="googlebot" content="noindex,nofollow">`;
    for (const page of ['contact-us', 'faqs', 'terms-conditions']) write(`dist/client/${page}/index.html`, html(page));
    write('dist/client/_headers', '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n');
    assert.doesNotThrow(() => verifyDeploymentBuild(plan, staging, dir));
    write('dist/client/faqs/index.html', html('faqs').replaceAll('noindex,nofollow', 'index,follow'));
    assert.throws(() => verifyDeploymentBuild(plan, staging, dir), /indexing/);
    write('dist/client/faqs/index.html', html('faqs'));
    write('.wrangler/deploy/config.json', { configPath: '../../other/wrangler.json' });
    assert.throws(() => verifyDeploymentBuild(plan, staging, dir), /target/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

function generatedFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'smc-generated-upload-'));
  const write = (file, data) => {
    const full = join(dir, file);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, typeof data === 'string' ? data : JSON.stringify(data));
  };
  const generated = { ...stagingConfig, main: 'entry.mjs', userConfigPath: join(dir, 'wrangler.jsonc') };
  write('deployment-targets.json', targets);
  write('dist/server/wrangler.json', generated);
  write('.wrangler/deploy/config.json', { configPath: '../../dist/server/wrangler.json', auxiliaryWorkers: [] });
  write('dist/server/entry.mjs', 'export default {};');
  write('dist/server/chunks/quote_fixture.mjs', 'requireQuoteRequestsCollectionId(runtimeCollection ?? "QuoteRequestsStaging", "staging")');
  for (const page of ['contact-us', 'faqs', 'terms-conditions']) {
    write(`dist/client/${page}/index.html`, `<link rel="canonical" href="https://www.scrapmycaruae.com/${page}"><meta name="robots" content="noindex,nofollow"><meta name="googlebot" content="noindex,nofollow">`);
  }
  write('dist/client/_headers', '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n');
  return { dir, write, generated };
}

for (const [name, mutate] of [
  ['missing redirect', f => rmSync(join(f.dir, '.wrangler/deploy/config.json'))],
  ['missing generated config', f => rmSync(join(f.dir, 'dist/server/wrangler.json'))],
  ['missing built entrypoint', f => rmSync(join(f.dir, 'dist/server/entry.mjs'))],
  ['source entrypoint specifier', f => f.write('dist/server/wrangler.json', { ...f.generated, main: '@astrojs/cloudflare/entrypoints/server' })],
  ['entrypoint outside server output', f => f.write('dist/server/wrangler.json', { ...f.generated, main: '../../package.json' })],
  ['wrong generated Worker name', f => f.write('dist/server/wrangler.json', { ...f.generated, name: 'wrong-worker' })],
  ['production routes in generated config', f => f.write('dist/server/wrangler.json', { ...f.generated, routes: ['www.scrapmycaruae.com/*'] })],
  ['production CMS runtime var', f => f.write('dist/server/wrangler.json', { ...f.generated, vars: { WIX_QUOTE_REQUESTS_COLLECTION_ID: 'QuoteRequests' } })],
  ['production CMS compiled fallback', f => f.write('dist/server/chunks/quote_fixture.mjs', 'requireQuoteRequestsCollectionId(runtimeCollection ?? "QuoteRequests", "staging")')],
  ['production compiled SEO mode', f => f.write('dist/server/chunks/quote_fixture.mjs', 'requireQuoteRequestsCollectionId(runtimeCollection ?? "QuoteRequestsStaging", "production")')],
  ['missing compiled quote route', f => rmSync(join(f.dir, 'dist/server/chunks/quote_fixture.mjs'))]
]) test(`actual ${name} blocks upload without bypassing artifact guard`, () => {
  const fixture = generatedFixture();
  const { calls, options } = harness();
  try {
    mutate(fixture);
    options.verifyBuild = plan => verifyDeploymentBuild(plan, staging, fixture.dir);
    assert.throws(() => runDeployment('staging', options));
    assert.ok(!calls.includes('upload'));
  } finally { rmSync(fixture.dir, { recursive: true, force: true }); }
});


test('Cloudflare analytics cannot activate on staging or without an approved production target', () => {
  const analytics = { PUBLIC_ANALYTICS_ENABLED: 'true', PUBLIC_GTM_ID: 'GTM-TFQ7BDGX', PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED: 'true', PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: '49956eb062ca47e2b1c53997795bee44' };
  assert.throws(() => validateStage({ PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED: 'true' }), /Cloudflare analytics/);
  assert.throws(() => validateStage({ PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED: 'yes' }), /flag/);
  assert.throws(() => loadDeployment('production', { ...production, ...analytics }, root), /approved/);
  assert.equal(validateDeployment('production', { ...production, ...analytics }, approved, prodConfig).environment, 'production');
  for (const invalid of [{ PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: '' }, { PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: 'bad' }, { PUBLIC_ANALYTICS_ENABLED: 'false' }]) {
    assert.throws(() => validateDeployment('production', { ...production, ...analytics, ...invalid }, approved, prodConfig), /Cloudflare analytics/);
  }
});

test('staging generated HTML with analytics activation cannot pass upload guards', () => {
  const fixture = generatedFixture();
  try {
    const file = 'dist/client/contact-us/index.html';
    const html = readFileSync(join(fixture.dir, file), 'utf8');
    fixture.write(file, html + `<script>document.querySelector('meta[name="smc-cloudflare-analytics-config"]')</script>`);
    assert.doesNotThrow(() => verifyDeploymentBuild(validateStage({}), staging, fixture.dir));
    for (const extra of ['<meta name="smc-cloudflare-analytics-config" content="token">', '<meta name="smc-analytics-config" content="GTM-TFQ7BDGX">', '<script src="https://static.cloudflareinsights.com/beacon.min.js"></script>']) {
      fixture.write(file, html + extra);
      assert.throws(() => verifyDeploymentBuild(validateStage({}), staging, fixture.dir), /activate analytics/);
    }
  } finally { rmSync(fixture.dir, { recursive: true, force: true }); }
});
