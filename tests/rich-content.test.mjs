import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeRichContentUrl,
  renderRicosDocumentWithTableOfContents,
} from '../src/lib/rich-content.ts';

test('malformed Wix Ricos collections render safely instead of aborting a post response', () => {
  const rendered = renderRicosDocumentWithTableOfContents({
    nodes: { unexpected: 'object' }
  });

  assert.deepEqual(rendered, { html: '', items: [], headingCount: 0 });
});

test('valid Wix Ricos article content remains rendered', () => {
  const rendered = renderRicosDocumentWithTableOfContents({
    nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'Article body' } }] }]
  });

  assert.equal(rendered.html, '<p>Article body</p>');
});

test('normalizes Scrap My Car UAE absolute rich-content URLs to headless-relative URLs', () => {
  assert.equal(
    normalizeRichContentUrl('https://www.scrapmycaruae.com/post/example'),
    '/post/example',
  );
  assert.equal(
    normalizeRichContentUrl('https://scrapmycaruae.com/blogs?page=2'),
    '/blogs?page=2',
  );
  assert.equal(
    normalizeRichContentUrl('http://scrapmycaruae.com/#valuation'),
    '/#valuation',
  );
  assert.equal(
    normalizeRichContentUrl('https://www.scrapmycaruae.com/post/example?source=blog#contact'),
    '/post/example?source=blog#contact',
  );
});

test('preserves approved external, contact, and in-page rich-content links', () => {
  assert.equal(normalizeRichContentUrl('https://example.com/article?ref=smc#top'), 'https://example.com/article?ref=smc#top');
  assert.equal(normalizeRichContentUrl('mailto:info@example.com'), 'mailto:info@example.com');
  assert.equal(normalizeRichContentUrl('tel:+971557458322'), 'tel:+971557458322');
  assert.equal(normalizeRichContentUrl('#valuation'), '#valuation');
  assert.equal(normalizeRichContentUrl('?page=2'), '?page=2');
});

test('rejects unsafe rich-content URL schemes', () => {
  assert.equal(normalizeRichContentUrl('javascript:alert(1)'), '');
  assert.equal(normalizeRichContentUrl('data:text/html,unsafe'), '');
  assert.equal(normalizeRichContentUrl('//untrusted.example/path'), '');
});
