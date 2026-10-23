import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { phoneExample } from '../src/lib/phone.ts';
import { initialiseQuotePhone } from '../src/lib/quote-phone-input.ts';

class Control extends EventTarget {
  value = ''; textContent = ''; placeholder = '';
}
function setup() {
  const country = new Control(), input = new Control(), flag = new Control(), dial = new Control(), status = new Control();
  country.value = 'AE';
  const nodes = { '[data-phone-country]': country, 'input[name="whatsapp"]': input, '[data-phone-flag]': flag,
    '[data-phone-dial]': dial, '[data-phone-status]': status };
  const phone = initialiseQuotePhone({ querySelector: selector => nodes[selector] });
  const type = value => { input.value = value; input.dispatchEvent(new Event('input')); };
  const select = value => { country.value = value; country.dispatchEvent(new Event('change')); };
  return { country, input, flag, dial, status, phone, type, select };
}

test('shared phone controller defaults to UAE flag, dial code, example inside the national placeholder', () => {
  const ui = setup();
  assert.equal(ui.country.value, 'AE'); assert.equal(ui.flag.src, '/flags/ae.svg');
  assert.equal(ui.dial.textContent, '+971'); assert.equal(ui.input.placeholder, 'e.g. 50 123 4567');
  assert.equal(ui.phone.error(), 'Please enter your phone number.');
});

test('country changes update visible flag, dial and examples; local UK and Pakistani input uses the selected plan', () => {
  const ui = setup();
  for (const [country, flag, code, input, expected] of [
    ['GB', '🇬🇧', '+44', '07742 107109', '+447742107109'],
    ['PK', '🇵🇰', '+92', '0300 1234567', '+923001234567']
  ]) {
    ui.select(country); ui.type(input);
    assert.equal(ui.flag.src, `/flags/${country.toLowerCase()}.svg`); assert.equal(ui.dial.textContent, code);
    assert.equal(ui.input.placeholder, `e.g. ${phoneExample(country).national}`); assert.equal(ui.phone.number().e164, expected);
    assert.equal(ui.phone.error(), '');
  }
});

test('Saudi selection updates the in-field example without changing entered text', () => {
  const ui = setup(); ui.type('123'); ui.select('SA');
  assert.equal(ui.dial.textContent, '+966');
  assert.equal(ui.input.placeholder, `e.g. ${phoneExample('SA').national}`);
  assert.equal(ui.input.value, '123');
});

test('international paste changes the selected country, announces it and does not duplicate the calling code on blur', () => {
  for (const input of ['+44 7742 107109', '0044 7742 107109']) {
    const ui = setup(); ui.type(input);
    assert.equal(ui.country.value, 'GB'); assert.equal(ui.dial.textContent, '+44');
    assert.match(ui.status.textContent, /Country updated to United Kingdom/);
    ui.input.dispatchEvent(new Event('blur'));
    assert.equal(ui.input.value, '07742 107109');
    assert.equal(ui.phone.number().e164, '+447742107109');
  }
  const ui = setup(); ui.type('+971 50 123 4567'); ui.input.dispatchEvent(new Event('blur'));
  assert.equal(ui.phone.number().digits, '971501234567');
});

test('validation is invalid for incomplete input and clears as soon as a valid number is entered', () => {
  const ui = setup(); ui.type('050'); assert.match(ui.phone.error(), /valid number for United Arab Emirates/);
  ui.type('050 123 4567'); assert.equal(ui.phone.error(), '');
  assert.equal(ui.phone.number().e164, '+971501234567');
});

test('each form has isolated country and phone state, including the blog sidebar and free quote variant', () => {
  const a = setup(), b = setup(), c = setup();
  a.type('+44 7742 107109'); b.type('0501234567'); c.select('PK'); c.type('03001234567');
  assert.equal(a.country.value, 'GB'); assert.equal(b.country.value, 'AE'); assert.equal(c.country.value, 'PK');
  assert.equal(b.phone.number().e164, '+971501234567');
});

test('manual country selection stays authoritative and triggers validation of the retained national portion', () => {
  const ui = setup(); ui.type('+44 7742 107109');
  let changes = 0; ui.input.addEventListener('change', () => changes++);
  ui.select('AE');
  assert.equal(ui.country.value, 'AE'); assert.equal(ui.input.value, '07742 107109');
  assert.match(ui.phone.error(), /United Arab Emirates/); assert.equal(changes, 1);
});

test('native controls preserve keyboard access, labels, autofill, inline error association and per-instance IDs', async () => {
  const source = await readFile(new URL('../src/components/QuoteForm.astro', import.meta.url), 'utf8');
  assert.match(source, /crypto.randomUUID\(\)/);
  assert.match(source, /<label class="field-label" for=\{phoneId\}>Phone \/ WhatsApp<\/label>/);
  assert.match(source, /<select name="phoneCountry" data-phone-country aria-label="Phone country and calling code"/);
  assert.match(source, /selected=\{country.iso === 'AE'\}/);
  assert.match(source, /countryDialOptions.map/); assert.match(source, /countryFlag\(country.iso\)/);
  assert.match(source, /type="tel" inputmode="tel" autocomplete="tel-national"/);
  assert.match(source, /aria-describedby=\{`\$\{phoneId\}-error`\}/);
  assert.match(source, /data-phone-status role="status" aria-live="polite"/);
  assert.match(source, /phone-country:focus-within/);
  assert.match(source, /phone-field.is-invalid/);
  assert.match(source, /data.whatsapp = phone.number\(\).e164/);
  assert.match(source, /document.addEventListener\('astro:page-load', initialiseQuoteForms\)/);
  assert.match(source, /if \(root.dataset.quoteReady\) return/);
});

test('actual QuoteForm validation shows an inline phone error and clears it after correction', async () => {
  const source = await readFile(new URL('../src/components/QuoteForm.astro', import.meta.url), 'utf8');
  const start = source.indexOf('      const validateField =');
  const fragment = source.slice(start, source.indexOf("      makeSelect.addEventListener", start));
  const ui = setup(); ui.input.name = 'whatsapp';
  let error = '', invalid = false;
  const validate = new Function('phone', 'validationMessages', 'showError', 'clearError', `${fragment};return validateField;`)(
    ui.phone, { whatsapp: 'Please enter your phone number.' },
    (_, message) => { error = message; invalid = true; }, () => { error = ''; invalid = false; });
  ui.type('050'); assert.equal(validate(ui.input), false); assert.equal(invalid, true); assert.match(error, /valid number/);
  ui.type('050 123 4567'); assert.equal(validate(ui.input), true); assert.equal(invalid, false); assert.equal(error, '');
  ui.type('+44 7742 107109'); assert.equal(validate(ui.input), true); assert.equal(ui.country.value, 'GB');
});

test('shared +1 countries show the true calling code and keep their area code in the national input', () => {
  const ui = setup(); ui.select('AS');
  assert.equal(ui.dial.textContent, '+1');
  ui.type('+1 684 733 1234'); ui.input.dispatchEvent(new Event('blur'));
  assert.equal(ui.country.value, 'AS');
  assert.equal(ui.phone.number().e164, '+16847331234');
  assert.match(ui.input.value, /684/);
});
