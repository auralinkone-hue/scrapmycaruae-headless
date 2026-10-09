import assert from 'node:assert/strict';
import test from 'node:test';

import { renderRicosDocumentWithTableOfContents } from '../src/lib/rich-content.ts';

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
