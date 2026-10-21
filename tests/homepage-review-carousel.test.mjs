import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const script = stripTypeScriptTypes(source.slice(source.indexOf("    const carousel = root.querySelector"), source.indexOf("    document.addEventListener('astro:before-swap'")));
function setup({ count = 5, mobile = false, reduced = false } = {}) {
  const cards = Array.from({ length: count }, () => ({ hidden: false }));
  const handlers = {};
  const media = { matches: mobile, addEventListener(_, callback) { handlers.resize = callback; } };
  const reducedMotion = { matches: reduced, addEventListener(_, callback) { handlers.motion = callback; } };
  const button = name => ({ disabled: false, addEventListener(_, callback) { handlers[name] = callback; } });
  const previous = button('previous'); const next = button('next'); const status = {};
  let animations = 0; let controlsHidden = true;
  const track = { animate(_, options) { assert.equal(options.duration, 280); animations++; return { cancel() {} }; } };
  const carousel = {
    querySelector(selector) { return ({ '.review-track': track, '[data-review-prev]': previous, '[data-review-next]': next, '[data-review-status]': status, '[data-review-controls]': { removeAttribute() { controlsHidden = false; } } })[selector]; },
    querySelectorAll() { return cards; },
    addEventListener(_, callback) { handlers.keyboard = callback; }
  };
  vm.runInNewContext(script, { root: { querySelector() { return carousel; } }, window: { matchMedia() { return media; } }, reducedMotion, signal: new AbortController().signal });
  return { cards, handlers, media, previous, next, status, visible: () => cards.flatMap((card, index) => card.hidden ? [] : [index]), animations: () => animations, controlsHidden: () => controlsHidden };
}

test('review carousel shows two complete desktop cards and clamps both boundaries', () => {
  const c = setup();
  assert.deepEqual(c.visible(), [0, 1]); assert.equal(c.previous.disabled, true);
  c.handlers.next(); assert.deepEqual(c.visible(), [2, 3]);
  c.handlers.next(); assert.deepEqual(c.visible(), [3, 4]); assert.equal(c.next.disabled, true);
  c.handlers.next(); assert.deepEqual(c.visible(), [3, 4]);
  c.handlers.previous(); c.handlers.previous(); assert.deepEqual(c.visible(), [0, 1]);
  assert.equal(c.controlsHidden(), false); assert.equal(c.animations() > 0, true);
});

test('mobile, keyboard, resize and reduced motion preserve a usable review carousel', () => {
  const c = setup({ mobile: true, reduced: true });
  assert.deepEqual(c.visible(), [0]); c.handlers.next(); assert.deepEqual(c.visible(), [1]);
  let prevented = false;
  c.handlers.keyboard({ key: 'End', preventDefault() { prevented = true; } });
  assert.deepEqual(c.visible(), [4]); assert.equal(prevented, true);
  c.media.matches = false; c.handlers.resize(); assert.deepEqual(c.visible(), [3, 4]);
  c.handlers.keyboard({ key: 'Home', preventDefault() {} }); assert.deepEqual(c.visible(), [0, 1]);
  assert.equal(c.animations(), 0);
  assert.equal(c.status.textContent, 'Reviews 1–2 of 5');
});

test('empty and single-review collections do not create fake slides or unusable navigation', () => {
  const empty = setup({ count: 0 }); assert.deepEqual(empty.visible(), []); assert.equal(empty.controlsHidden(), true);
  const single = setup({ count: 1 }); assert.deepEqual(single.visible(), [0]); assert.equal(single.previous.disabled, true); assert.equal(single.next.disabled, true);
});
