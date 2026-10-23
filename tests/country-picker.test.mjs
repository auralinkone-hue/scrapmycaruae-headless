import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { countryGroups, countryPickerPosition, initialiseCountryPicker } from '../src/lib/country-picker.ts';
import { countryDialOptions, countryFlagAsset } from '../src/lib/country-codes.ts';

const root = new URL('../public/flags/', import.meta.url);

test('country groups cover every supported country exactly once, with useful defaults first', () => {
  const groups = countryGroups();
  assert.deepEqual(groups[0].countries.map(country => country.iso), ['AE', 'SA', 'GB', 'PK', 'IN']);
  const codes = groups.flatMap(group => group.countries.map(country => country.iso));
  assert.equal(codes.length, countryDialOptions.length);
  assert.equal(new Set(codes).size, countryDialOptions.length);
  assert.deepEqual(new Set(codes), new Set(countryDialOptions.map(country => country.iso)));
  assert.equal(groups[1].countries[0].name, 'Afghanistan');
  assert.equal(groups[1].countries.at(-1).name, 'Zimbabwe');
});

test('country search supports names, accents, ISO, common aliases and calling codes', () => {
  const codes = query => countryGroups(query).flatMap(group => group.countries.map(country => country.iso));
  assert.deepEqual(codes('  UAE '), ['AE']);
  assert.deepEqual(codes('UK'), ['GB']);
  assert.deepEqual(codes('+971'), ['AE']);
  assert.deepEqual(codes('Pakistan'), ['PK']);
  assert.ok(codes('Cote').includes('CI'));
  assert.ok(codes('+1').includes('CA'));
  assert.ok(codes('+1').includes('US'));
  assert.deepEqual(codes('no-such-country-999'), []);
});

test('every listed country has a small local SVG flag, without external image dependencies or scripts', async () => {
  const files = await readdir(root);
  let bytes = 0;
  for (const country of countryDialOptions) {
    const filename = country.iso.toLowerCase() + '.svg';
    assert.ok(files.includes(filename), filename);
    assert.equal(countryFlagAsset(country.iso), '/flags/' + filename);
    const svg = await readFile(new URL(filename, root), 'utf8');
    bytes += Buffer.byteLength(svg);
    assert.match(svg, /^<svg\b/);
    assert.match(svg, /viewBox="0 0 512 512"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+=|(?:href|src)=["'](?:https?:|data:|javascript:)/i);
  }
  assert.ok(bytes < 200_000, 'Country flags should stay lightweight');
  assert.match(await readFile(new URL('LICENSE.txt', root), 'utf8'), /MIT License/);
  assert.equal(countryFlagAsset('../../remote'), '/flags/ae.svg');
});

for (const width of [360, 390, 430, 768, 1024, 1440]) {
  test(`country popup stays within a ${width}px viewport, including a narrow sidebar`, () => {
    for (const rect of [
      { left: 16, top: 140, bottom: 190, width: width - 32 },
      { left: width - 280, top: 700, bottom: 751, width: 260 },
      { left: width - 50, top: 390, bottom: 440, width: 320 }
    ]) {
      const panel = countryPickerPosition(rect, { width, height: 844 });
      assert.ok(panel.left >= 12);
      assert.ok(panel.left + panel.width <= width - 12);
      assert.ok(panel.top >= 12);
      assert.ok(panel.top + panel.maxHeight <= 832);
      assert.ok(panel.maxHeight > 0);
    }
  });
}

test('popup chooses available space without overlapping its anchor and adapts to the mobile keyboard viewport', () => {
  const above = countryPickerPosition({ left: 16, top: 700, bottom: 751, width: 358 }, { width: 390, height: 844 });
  assert.equal(above.opensAbove, true); assert.ok(above.top + above.maxHeight <= 694);
  const below = countryPickerPosition({ left: 16, top: 400, bottom: 451, width: 358 }, { width: 390, height: 780 });
  assert.equal(below.opensAbove, false); assert.ok(below.top >= 457); assert.ok(below.top + below.maxHeight <= 768);
  const keyboard = countryPickerPosition({ left: 16, top: 270, bottom: 321, width: 358 }, { width: 390, height: 340 });
  assert.ok(keyboard.top >= 12 && keyboard.top + keyboard.maxHeight <= 328);
  const panned = countryPickerPosition({ left: 20, top: 330, bottom: 381, width: 300 }, { width: 360, height: 320, top: 200 });
  assert.ok(panned.top >= 212 && panned.top + panned.maxHeight <= 508);
});

test('unsupported browsers retain the accessible native select without an incomplete custom control', () => {
  const country = { hidden: false }, trigger = {}, menu = {};
  const nodes = { '[data-phone-country]': country, '[data-country-trigger]': trigger, '[data-country-menu]': menu };
  const picker = initialiseCountryPicker({ querySelector: selector => nodes[selector] });
  assert.doesNotThrow(() => picker.sync());
  assert.equal(country.hidden, false);
  assert.deepEqual(trigger, {});
});
