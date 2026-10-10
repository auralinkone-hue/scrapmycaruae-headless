import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contact = await readFile(new URL('../src/pages/contact-us.astro', import.meta.url), 'utf8');
const faqs = await readFile(new URL('../src/pages/faqs.astro', import.meta.url), 'utf8');

test('contact page keeps real conversion links in its scoped redesign', () => {
  assert.match(contact, /<main class="contact-page">/);
  assert.match(contact, /href="tel:\+971557458322"/);
  assert.match(contact, /https:\/\/api\.whatsapp\.com\/send\?phone=%2B971557458322/);
  assert.match(contact, /href="\/free-quote"/);
  assert.match(contact, /heading-accent/);
  assert.match(contact, /@media \(max-width: 700px\)/);
});

test('FAQ page preserves structured data, all questions, and semantic accordion behavior', () => {
  assert.match(faqs, /<main class="faq-page">/);
  assert.match(faqs, /"@type":"FAQPage"/);
  assert.match(faqs, /faqs\.map\(\(\[question, answer\], index\) => <details open=\{index === 0\}>/);
  assert.equal((faqs.match(/\["/g) || []).length, 10);
  assert.match(faqs, /href="\/free-quote"/);
  assert.match(faqs, /heading-accent/);
});
