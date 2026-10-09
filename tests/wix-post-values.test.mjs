import assert from 'node:assert/strict';
import test from 'node:test';

import {
  asIsoDate,
  asPositiveNumber,
  asSafeArticleSlug,
  asSafeText,
  asValidDate,
  isRenderableRelatedPost
} from '../src/lib/wix-post-values.ts';

test('malformed Wix values degrade to safe scalar fallbacks', () => {
  assert.equal(asSafeText({ text: 'nope' }, 'Fallback'), 'Fallback');
  assert.equal(asSafeArticleSlug({ slug: 'nope' }), '');
  assert.equal(asSafeArticleSlug('bad/path'), '');
  assert.equal(asPositiveNumber({ width: 1200 }), 0);
  assert.equal(asPositiveNumber('1200'), 1200);
  assert.equal(asValidDate({ date: 'nope' }), null);
  assert.equal(asIsoDate('not-a-date'), '');
});

test('only related posts with safe title and slug are rendered', () => {
  assert.equal(isRenderableRelatedPost({ slug: 'valid-post', title: 'Valid post' }), true);
  assert.equal(isRenderableRelatedPost({ slug: 'valid-post', title: { text: 'bad' } }), false);
  assert.equal(isRenderableRelatedPost({ slug: { value: 'bad' }, title: 'Bad slug' }), false);
  assert.equal(isRenderableRelatedPost({ slug: 'bad/path', title: 'Unsafe slug' }), false);
});
