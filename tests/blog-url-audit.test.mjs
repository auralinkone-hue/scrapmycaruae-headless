import assert from 'node:assert/strict';
import test from 'node:test';
import { retryDelayMs, classifyAttempt } from '../scripts/verify-protected-blog-urls.mjs';

test('audit respects numeric and date Retry-After instead of immediately retrying an outage', () => {
  assert.equal(retryDelayMs(1, '60'), 60000);
  assert.equal(retryDelayMs(2, null), 8000);
  assert.equal(retryDelayMs(1, 'Thu, 22 Oct 2026 10:01:00 GMT', Date.parse('2026-10-22T10:00:00Z')), 60000);
  assert.equal(retryDelayMs(1, 'invalid'), 2000);
  assert.equal(retryDelayMs(1, '300'), 300000);
});

test('a successful status without article content never counts as a protected article pass', () => {
  assert.equal(classifyAttempt({status:200,articlePresent:true}), 'article-ok');
  assert.equal(classifyAttempt({status:200,articlePresent:false}), 'unexpected-200-body');
});

test('audit distinguishes unavailable, missing and access-blocked responses', () => {
  assert.equal(classifyAttempt({status:404}), 'not-found-unconfirmed');
  assert.equal(classifyAttempt({status:503}), 'temporarily-unavailable');
  assert.equal(classifyAttempt({status:503,title:'Worker exceeded resource limits | Cloudflare'}), 'worker-resource-limit');
  assert.equal(classifyAttempt({error:'Tunnel connection failed: 403 Forbidden'}), 'network-access-blocked');
  assert.equal(classifyAttempt({status:403,responseSample:'error code: 1010'}), 'edge-access-blocked');
  assert.equal(classifyAttempt({error:'TimeoutError: timed out'}), 'network-error');
});
