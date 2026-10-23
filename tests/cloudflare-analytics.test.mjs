import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { initializeCloudflareAnalytics, isCloudflareAnalyticsHost } from '../src/scripts/cloudflare-analytics.ts';

const token = '49956eb062ca47e2b1c53997795bee44';
const key = 'smc_cookie_preferences_v1';
function browser({ href = 'https://www.scrapmycaruae.com/', configuredToken = token, preference, cookie = '', loading = false, existing = false, globalBeacon = false, storageBlocked = false } = {}) {
  const win = new EventTarget(), doc = new EventTarget();
  let stored = preference === undefined ? null : JSON.stringify({ analytics: preference });
  let reloads = 0;
  win.location = { href, reload() { reloads++; } };
  win.localStorage = { getItem(name) { assert.equal(name, key); if (storageBlocked) throw Error('blocked'); return stored; } };
  if (globalBeacon) win.__cfBeacon = { token };
  const scripts = existing ? [{ src: 'https://static.cloudflareinsights.com/beacon.min.js/version?token=existing', dataset: {} }] : [];
  doc.cookie = cookie;
  doc.readyState = loading ? 'loading' : 'complete';
  doc.querySelector = selector => selector.startsWith('meta') ? (configuredToken ? { content: configuredToken } : null) : scripts.find(script => script.dataset.cfBeacon || script.src.includes('static.cloudflareinsights.com/beacon.min.js'));
  doc.createElement = tag => { assert.equal(tag, 'script'); const script = { dataset: {}, remove() { scripts.splice(scripts.indexOf(script), 1); } }; return script; };
  doc.head = { appendChild(script) { scripts.push(script); } };
  doc.getElementById = id => scripts.find(script => script.id === id);
  const consent = granted => {
    stored = JSON.stringify({ analytics: granted }); doc.cookie = `${key}=analytics-${granted ? 'yes' : 'no'}`;
    const event = new Event('smc:analytics-consent'); event.detail = { granted }; win.dispatchEvent(event);
  };
  return { win, doc, scripts, consent, initialize: () => initializeCloudflareAnalytics(win, doc), get reloads() { return reloads; } };
}

test('Cloudflare exact HTTPS production hosts pass; preview, localhost, subdomains and spoofed hosts fail', () => {
  for (const href of ['https://scrapmycaruae.com/', 'https://www.scrapmycaruae.com/post/protected-slug?tracking=1']) assert.equal(isCloudflareAnalyticsHost(href), true);
  for (const href of ['http://scrapmycaruae.com', 'https://preview.scrapmycaruae.com', 'https://smc-headless-worker.hussain-gscx.workers.dev', 'http://localhost:4321', 'https://localhost', 'https://scrapmycaruae.com.evil.test', 'https://www.scrapmycaruae.com:8443', 'invalid']) {
    assert.equal(isCloudflareAnalyticsHost(href), false, href);
    const ui = browser({ href, preference: true }); ui.initialize(); assert.equal(ui.scripts.length, 0);
  }
});

test('missing/invalid build token, unknown consent and declined consent never load Cloudflare', () => {
  for (const settings of [{ configuredToken: '' }, { configuredToken: 'invalid' }, {}, { preference: false }]) {
    const ui = browser(settings); ui.initialize(); assert.equal(ui.scripts.length, 0);
  }
});

test('saved consent installs the official nonblocking module with no form data or URL parameters', () => {
  const ui = browser({ preference: true, href: 'https://www.scrapmycaruae.com/free-quote?phone=private#name' }); ui.initialize();
  assert.equal(ui.scripts.length, 1);
  const script = ui.scripts[0];
  assert.equal(script.src, 'https://static.cloudflareinsights.com/beacon.min.js');
  assert.equal(script.type, 'module'); assert.equal(script.async, true);
  assert.equal(script.referrerPolicy, 'strict-origin');
  assert.deepEqual(JSON.parse(script.dataset.cfBeacon), { token, spa: false });
  assert.equal(JSON.stringify(script).includes('private'), false);
  assert.equal(JSON.stringify(script).includes('phone'), false);
});

test('grant loads once across repeated initialization, consent events and document-ready events', () => {
  const ui = browser(); ui.initialize(); ui.initialize(); ui.consent(true); ui.consent(true);
  ui.doc.dispatchEvent(new Event('DOMContentLoaded')); ui.initialize(); assert.equal(ui.scripts.length, 1);
});

test('cookie fallback respects granted/declined choices when local storage is blocked', () => {
  for (const granted of [true, false]) {
    const ui = browser({ storageBlocked: true, cookie: `other=1; ${key}=analytics-${granted ? 'yes' : 'no'}` });
    ui.initialize(); assert.equal(ui.scripts.length, granted ? 1 : 0);
  }
});

test('stored decline takes precedence over an old consent cookie', () => {
  const ui = browser({ preference: false, cookie: `${key}=analytics-yes` }); ui.initialize(); assert.equal(ui.scripts.length, 0);
});

test('parsing finishes before installation, allowing detection of an automatic or GTM beacon', () => {
  const ui = browser({ preference: true, loading: true }); ui.initialize(); assert.equal(ui.scripts.length, 0);
  ui.scripts.push({ src: 'https://static.cloudflareinsights.com/beacon.min.js?token=gtm', dataset: {} });
  ui.doc.readyState = 'interactive'; ui.doc.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(ui.scripts.length, 1);
});

test('existing versioned/automatic snippets or a previously executed beacon prevent duplicate installation', () => {
  for (const settings of [{ existing: true }, { globalBeacon: true }]) {
    const ui = browser({ preference: true, ...settings }); ui.initialize(); ui.consent(true);
    assert.equal(ui.scripts.length, settings.existing ? 1 : 0);
  }
});

test('revocation removes the managed script and reloads to stop the old document observers', () => {
  const ui = browser({ preference: true }); ui.initialize(); ui.consent(false);
  assert.equal(ui.scripts.length, 0); assert.equal(ui.reloads, 1);
  const next = browser({ preference: false }); next.initialize(); assert.equal(next.scripts.length, 0);
});

test('declining before the document is ready prevents a pending load without reloading', () => {
  const ui = browser({ preference: true, loading: true }); ui.initialize(); ui.consent(false);
  ui.doc.readyState = 'interactive'; ui.doc.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(ui.scripts.length, 0); assert.equal(ui.reloads, 0);
});

test('analytics DOM/storage failures never escape into the customer flow', () => {
  const ui = browser({ preference: true }); ui.doc.head.appendChild = () => { throw Error('blocked'); };
  assert.doesNotThrow(() => ui.initialize()); assert.doesNotThrow(() => ui.consent(true));
  assert.doesNotThrow(() => initializeCloudflareAnalytics({}, { querySelector() { throw Error('blocked'); } }));
});

test('actual shared layout frontmatter enables Cloudflare only with every production build setting', async () => {
  const layout = (await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8')).split('---')[1];
  const settings = { PUBLIC_SEO_ENV: 'production', PUBLIC_ANALYTICS_ENABLED: 'true', PUBLIC_GTM_ID: 'GTM-TFQ7BDGX', PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED: 'true', PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: token };
  for (const override of [{}, { PUBLIC_SEO_ENV: 'staging' }, { PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED: undefined }, { PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED: 'false' }, { PUBLIC_ANALYTICS_ENABLED: 'false' }, { PUBLIC_GTM_ID: '' }, { PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: 'invalid' }]) {
    const code = stripTypeScriptTypes(layout.replace(/^import .*\n/gm, '').replaceAll('import.meta.env', JSON.stringify({ ...settings, ...override })));
    const run = new Function('Astro', 'canonicalUrl', 'robotsContent', 'siteUrl', 'defaultSocialImage', 'defaultSocialImageAlt', 'serviceSchemaForPath', code + ';return cloudflareAnalyticsEnabled;');
    assert.equal(run({ props: {}, url: new URL('https://www.scrapmycaruae.com/') }, () => '', () => '', 'https://www.scrapmycaruae.com', '/og.svg', 'image', () => null), Object.keys(override).length === 0);
  }
});
