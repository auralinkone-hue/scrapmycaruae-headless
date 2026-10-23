import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlogFailureDiagnostics } from '../src/lib/blog-failure-diagnostics.ts';

const make = (options = {}) => {
  const events = []; let tick = 10;
  const start = createBlogFailureDiagnostics({ environment: 'staging', sink: event => events.push(event), now: () => tick, ...options });
  return { events, start, advance: () => { tick = 35.4; } };
};
test('starting a successful operation emits nothing; failure emits fixed fields and elapsed duration only', () => {
  const { events, start, advance } = make();
  const fail = start('post-by-slug', 'article');
  assert.deepEqual(events, []);
  advance(); fail({ response: { status: 503 } }, 503);
  assert.deepEqual(events, [{ event: 'blog_load_failure', operation: 'post-by-slug', routeType: 'article', responseStatus: 503, upstreamStatus: 503, classification: 'upstream_http', durationMs: 25 }]);
});
for (const [error, classification, upstream] of [
  [{ status: 404 }, 'not_found', 404],
  [{ response: { status: 429 } }, 'rate_limited', 429],
  [{ response: { status: 401 } }, 'authorization', 401],
  [{ status: 403 }, 'authorization', 403],
  [{ response: { status: 502 } }, 'upstream_http', 502],
  [{ status: 504 }, 'upstream_http', 504],
  [{ details: { applicationError: { code: 'POST_NOT_FOUND' } } }, 'not_found', null],
  [new DOMException('private timeout details', 'TimeoutError'), 'timeout', null],
  [new DOMException('private abort details', 'AbortError'), 'aborted', null],
  [{ cause: { code: 'ENOTFOUND' } }, 'network', null],
  [{ cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } }, 'timeout', null],
  [new TypeError('fetch failed'), 'network', null],
  [new TypeError('unrelated type error'), 'unknown', null],
  [new SyntaxError('sensitive response body'), 'invalid_json', null],
  [new Error('Malformed Wix article response.'), 'malformed_response', null],
  [new Error('Malformed Wix archive pagination data.'), 'malformed_response', null]
]) test(`classifies ${classification}/${upstream} without copying exception text`, () => {
  const { start, events } = make(); start('post-by-slug', 'article')(error, 503);
  assert.equal(events[0].classification, classification); assert.equal(events[0].upstreamStatus, upstream);
});
test('arbitrary sensitive properties, error names/codes, query strings and provider bodies never reach logs', () => {
  const secret = 'PRIVATE_NAME_PHONE_TOKEN_IP_QUERY_BODY';
  const error = { name: secret, message: secret, stack: secret, status: secret, url: secret, phone: secret,
    request: { headers: { authorization: secret }, body: secret },
    response: { status: 503, body: secret, data: { details: { applicationError: { code: secret } }, customer: secret } }, cause: { code: secret, message: secret } };
  const { events, start } = make(); start('archive-posts', 'archive')(error, 503);
  assert.equal(events.length, 1); assert.ok(!JSON.stringify(events).includes(secret));
  assert.deepEqual(Object.keys(events[0]).sort(), ['event', 'operation', 'routeType', 'responseStatus', 'upstreamStatus', 'classification', 'durationMs'].sort());
});
for (const environment of ['production', undefined, '', 'unknown']) test(`environment ${environment} is silent without reading error or clock`, () => {
  let calls = 0;
  const { start, events } = make({ environment, now: () => { calls++; throw new Error('clock unavailable'); } });
  start('post-by-slug', 'article')({}, 503);
  assert.equal(calls, 0); assert.deepEqual(events, []);
});
test('unapproved operation and route labels cannot leak caller-controlled text', () => {
  const { events, start } = make();
  start('/post/private?phone=123', 'article')({}, 503);
  start('post-by-slug', '/author/private')({}, 503);
  assert.deepEqual(events, []);
});
test('synchronous and asynchronous logging failures do not throw or create unhandled rejections', async () => {
  for (const sink of [() => { throw new Error('logger failed'); }, async () => { throw new Error('async logger failed'); }]) {
    const { start } = make({ sink });
    assert.doesNotThrow(() => start('post-by-slug', 'article')({ status: 503 }, 503));
  }
  await new Promise(resolve => setImmediate(resolve));
});
test('throwing clock or hostile exception getters cannot escape diagnostics', () => {
  const { start } = make({ now: () => { throw new Error('clock'); } });
  assert.doesNotThrow(() => start('post-by-slug', 'article')({}, 503));
  const { start: normal } = make();
  assert.doesNotThrow(() => normal('post-by-slug', 'article')({ get status() { throw new Error('getter'); } }, 503));
});
test('durations and statuses remain bounded scalar values', () => {
  const { start, events } = make({ now: () => NaN });
  start('post-by-slug', 'article')({}, NaN);
  assert.equal(events[0].durationMs, null); assert.equal(events[0].responseStatus, null);
});
