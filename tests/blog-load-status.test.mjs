import assert from 'node:assert/strict';
import test from 'node:test';
import { blogLoadErrorStatus } from '../src/lib/blog-load-status.ts';

test('a genuine Wix missing post remains a 404', () => {
  assert.equal(blogLoadErrorStatus({ status: 404 }), 404);
  assert.equal(blogLoadErrorStatus({ details: { applicationError: { code: 'POST_NOT_FOUND' } } }), 404);
});

test('upstream outages, throttling and authorization failures never become missing articles', () => {
  for (const status of [400, 401, 403, 408, 429, 500, 502, 503, 504]) {
    assert.equal(blogLoadErrorStatus({ status }), 503);
  }
});

test('network failures and malformed upstream errors return a retryable status', () => {
  for (const error of [new TypeError('fetch failed'), null, undefined, 'unavailable', {}, { details: {} }]) {
    assert.equal(blogLoadErrorStatus(error), 503);
  }
});
