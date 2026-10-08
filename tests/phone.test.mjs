import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeUaeMobilePhone } from '../src/lib/phone.ts';

test('accepts supported UAE mobile formats for quote validation', () => {
  for (const phone of ['0557458322', '557458322', '971557458322', '+971557458322', '055-745-8322']) {
    assert.equal(normalizeUaeMobilePhone(phone), '+971557458322');
  }
  assert.equal(normalizeUaeMobilePhone('050123'), null);
  assert.equal(normalizeUaeMobilePhone('hello'), null);
});
