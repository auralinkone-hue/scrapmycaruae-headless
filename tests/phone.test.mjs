import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePhoneNumber, isValidPhoneNumber, phoneExample } from '../src/lib/phone.ts';
import { countryDialOptions, countryFlag } from '../src/lib/country-codes.ts';
import { isSupportedCountry } from 'libphonenumber-js/max';

for (const [country, inputs, expected] of [
  ['AE', ['050 123 4567', '50 123 4567', '+971 50 123 4567', '00971 50 123 4567', '971501234567'], '+971501234567'],
  ['GB', ['07742 107109', '+44 7742 107109', '0044 7742 107109', '+44 (0) 7742 107109'], '+447742107109'],
  ['PK', ['0300 1234567', '+92 300 1234567', '0092 300 1234567'], '+923001234567'],
  ['US', ['(202) 555-0123', '+1 (202) 555-0123'], '+12025550123'],
  ['IT', ['06 12345678', '+39 06 12345678'], '+390612345678']
]) {
  test(`${country}: national, trunk and international input share one E.164 representation`, () => {
    for (const input of inputs) {
      const phone = normalizePhoneNumber(input, country);
      assert.equal(phone?.e164, expected, input);
      assert.equal(phone.digits, expected.slice(1));
      assert.equal(normalizePhoneNumber(phone.national, country)?.e164, expected);
      assert.equal(isValidPhoneNumber(input, country), true);
    }
  });
}

test('rejects incomplete, impossible and malformed numbers instead of merely counting digits', () => {
  for (const input of ['', null, 971501234567, '050123', '0000000000', '1234567890', '+6512345678',
    '+971971501234567', '+971501234567123456', '+971 501234567 ext 2', '050abc1234567',
    '++447742107109', '44+7742107109', '+97150123\n4567', 'Call +971501234567']) {
    assert.equal(normalizePhoneNumber(input, 'AE'), null, String(input));
  }
});

test('country-specific local numbers cannot pass another country plan, but explicit international pastes identify their country', () => {
  assert.equal(normalizePhoneNumber('07742 107109', 'AE'), null);
  assert.equal(normalizePhoneNumber('+44 7742 107109', 'AE')?.country, 'GB');
  assert.equal(normalizePhoneNumber('0044 7742 107109', 'AE')?.e164, '+447742107109');
  for (const country of ['', 'XX', null, ['AE'], 971]) assert.equal(normalizePhoneNumber('+971501234567', country), null);
});

test('legacy explicit international payloads remain valid; unprefixed input requires a country', () => {
  for (const input of ['+971501234567', '+447742107109', '+92 300 1234567', '00971 50 123 4567']) {
    assert.ok(normalizePhoneNumber(input), input);
  }
  for (const input of ['0501234567', '07742107109', '03001234567', '557458322', '2025550123', '971501234567', '447742107109']) assert.equal(normalizePhoneNumber(input), null, input);
});

test('every existing country option has a supported plan, flag and example; AE remains the exact default example', () => {
  assert.deepEqual(phoneExample('AE'), { national: '50 123 4567', international: '+971 50 123 4567' });
  assert.equal(countryFlag('AE'), '🇦🇪');
  for (const country of countryDialOptions) {
    assert.equal(isSupportedCountry(country.iso), true, country.name);
    assert.ok(countryFlag(country.iso));
    assert.ok(phoneExample(country.iso).national);
  }
  assert.match(phoneExample('GB').international, /^\+44 /);
  assert.match(phoneExample('PK').international, /^\+92 /);
});
