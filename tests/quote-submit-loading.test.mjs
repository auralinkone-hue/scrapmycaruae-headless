import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/components/QuoteForm.astro', import.meta.url), 'utf8');
const fragment = source.slice(source.indexOf('      // Reuse the ID'), source.indexOf('\n    });\n  })();', source.indexOf('      // Reuse the ID')));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
class Element {
  dataset = {}; attributes = {}; hidden = true; textContent = ''; classes = new Set();
  classList = { add: value => this.classes.add(value), remove: value => this.classes.delete(value) };
  setAttribute(name, value) { this.attributes[name] = value; }
}
class Button extends Element {
  disabled = false;
  querySelector() { return this.check; }
}
function setup(fetcher, { animated = false, stalledFrames = false } = {}) {
  const button = new Button(), message = new Element(), status = new Element();
  const animation = deferred();
  button.check = { getAnimations: () => animated ? [{ finished: animation.promise }] : [] };
  const elements = { '[data-submit]': button, '[data-submit-message]': message, '[data-submit-status]': status };
  const payload = { make: 'TOYOTA', model: 'CAMRY', year: '2014', name: 'Test Customer', whatsapp: '0501234567', website: '' };
  let handler, issuedIds = 0;
  const requests = [], redirects = [], analytics = [];
  const form = { addEventListener: (_, listener) => { handler = listener; } };
  const FormData = class { entries() { return Object.entries(payload); } };
  new Function('form', 'fields', 'root', 'validateField', 'FormData', 'HTMLElement', 'HTMLButtonElement', 'crypto', 'fetch', 'window', 'requestAnimationFrame', fragment)(
    form, [], { querySelector: selector => elements[selector] }, () => true, FormData, Element, Button,
    { randomUUID: () => `submission-${++issuedIds}` },
    (url, init) => { requests.push({ url, init }); return fetcher(url, init); },
    { smcAnalytics: { track: name => analytics.push(name) }, location: { assign: url => redirects.push(url) } },
    callback => { if (!stalledFrames) queueMicrotask(callback); }
  );
  return { button, message, status, payload, animation, requests, redirects, analytics, submit: () => handler({ preventDefault() {} }) };
}
const success = () => Response.json({ ok: true, whatsappUrl: 'https://api.whatsapp.com/send?phone=971557458322' });
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

test('saving starts immediately, blocks repeated submits, and confirms only after API success', async () => {
  const response = deferred();
  const ui = setup(() => response.promise, { animated: true });
  const pending = ui.submit();
  assert.equal(ui.requests.length, 1, 'No artificial delay before saving');
  assert.equal(ui.button.dataset.submitState, 'saving');
  assert.equal(ui.button.disabled, true);
  assert.equal(ui.button.attributes['aria-busy'], 'true');
  assert.equal(ui.status.textContent, 'Saving your request...');
  assert.ok(ui.requests[0].init.signal instanceof AbortSignal);
  await ui.submit();
  assert.equal(ui.requests.length, 1);
  assert.equal(ui.redirects.length, 0);
  response.resolve(success());
  await flush();
  assert.equal(ui.button.dataset.submitState, 'saved');
  assert.equal(ui.button.attributes['aria-busy'], 'false');
  assert.equal(ui.status.textContent, 'Request saved successfully!');
  assert.equal(ui.redirects.length, 0, 'Confirmation precedes handoff');
  ui.animation.resolve();
  await pending;
  assert.equal(ui.redirects.length, 1);
  assert.deepEqual(ui.analytics, ['generate_lead', 'whatsapp_handoff']);
});

test('failed submissions restore idle controls, preserve details and reuse the same ID for retry', async () => {
  let attempts = 0;
  const ui = setup(() => ++attempts === 1 ? Response.json({ ok: false, message: 'Please try again.' }, { status: 500 }) : success());
  const before = { ...ui.payload };
  await ui.submit();
  assert.equal(ui.button.dataset.submitState, 'idle');
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.button.attributes['aria-busy'], 'false');
  assert.equal(ui.message.hidden, false);
  assert.equal(ui.message.textContent, 'Please try again.');
  assert.equal(ui.status.textContent, '');
  assert.equal(ui.redirects.length, 0);
  assert.deepEqual(ui.payload, before);
  await ui.submit();
  const sent = ui.requests.map(({ init }) => JSON.parse(init.body));
  assert.equal(sent[0].submissionId, sent[1].submissionId);
  assert.equal(ui.redirects.length, 1);
});

test('timeout stops loading with a useful error and does not hand off unconfirmed details', async () => {
  const ui = setup(() => { throw new DOMException('Timed out', 'TimeoutError'); });
  await ui.submit();
  assert.equal(ui.button.dataset.submitState, 'idle');
  assert.equal(ui.button.disabled, false);
  assert.match(ui.message.textContent, /could not confirm.*try again/i);
  assert.equal(ui.redirects.length, 0);
});

test('missing animations (including reduced motion) never block the confirmed handoff', async () => {
  const ui = setup(success);
  await ui.submit();
  assert.equal(ui.button.dataset.submitState, 'saved');
  assert.equal(ui.redirects.length, 1);
});

test('paused frames or unfinished success animation are bounded and cannot trap customers', async () => {
  const ui = setup(success, { animated: true, stalledFrames: true });
  await ui.submit();
  assert.equal(ui.button.dataset.submitState, 'saved');
  assert.equal(ui.redirects.length, 1);
});
