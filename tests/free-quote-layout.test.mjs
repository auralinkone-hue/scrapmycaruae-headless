import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('free quote places the reusable form in the hero and keeps reassurance content below it', async () => {
  const page = await readProjectFile('src/pages/free-quote.astro');
  assert.match(page, /<section class="free-quote-hero"/);
  assert.match(page, /<h1 id="free-quote-title">Get your free car valuation today\.<\/h1>/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /<section class="valuation-reassurance"/);
  assert.doesNotMatch(page, /inner-hero|quote-page-grid|Unlock a free car scrap quote today/);
});

test('free quote form variant preserves isolated existing variants and mobile-safe fields', async () => {
  const form = await readProjectFile('src/components/QuoteForm.astro');
  assert.match(form, /variant\?: 'default' \| 'blog-sidebar' \| 'free-quote'/);
  assert.match(form, /const isFreeQuote = variant === 'free-quote'/);
  assert.match(form, /quote-card--free-quote/);
  assert.match(form, /\.quote-card--free-quote \.field-grid \{ grid-template-columns: 1fr;/);
  assert.match(form, /input, select \{ height: 51px; font-size: 16px; \}/);
  assert.match(form, /window\.location\.assign\(result\.whatsappUrl\)/);
});
