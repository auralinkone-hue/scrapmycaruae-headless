import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { isValidPhoneNumber } from '../src/lib/phone.ts';

test('accepts local and international phone formats without restricting country', () => {
  for (const phone of ['0557458322', '557458322', '971557458322', '+971557458322', '055-745-8322', '+44 7742 107109', '03001234567', '+92 300 1234567', '+1 (202) 555-0123']) {
    assert.equal(isValidPhoneNumber(phone), true, phone);
  }
});
test('rejects empty, malformed, implausibly short/long or zero-only phone numbers', () => {
  for (const phone of ['', null, '050123', 'hello', '050abc1234567', '1234567890123456', '++447742107109', '44+7742107109', '0000000000']) assert.equal(isValidPhoneNumber(phone), false, String(phone));
});
test('actual browser phone validation accepts the same international formats', async () => {
  const source = await readFile(new URL('../src/components/QuoteForm.astro', import.meta.url), 'utf8');
  const branch = source.split("} else if (field.name === 'whatsapp') {")[1].split('\n        }')[0];
  const browserValidate = new Function('value', `let messageText = ''; ${branch}; return !messageText;`);
  for (const phone of ['0557458322', '+44 7742 107109', '+92 300 1234567', '+1 (202) 555-0123', 'abc1234567', '123', '44+7742107109']) assert.equal(browserValidate(phone), isValidPhoneNumber(phone), phone);
});
