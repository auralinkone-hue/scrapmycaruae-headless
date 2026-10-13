import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readPage = (name) => readFile(new URL(`../src/pages/${name}.astro`, import.meta.url), 'utf8');
const desktopScale = 'font-size:clamp(3rem,4.1vw,4.5rem);font-weight:700;line-height:1;letter-spacing:-.055em';
const mobileScale = 'font-size:clamp(2.65rem,12vw,3.6rem);line-height:.96;letter-spacing:-.045em';

test('sell-service heroes share typography and spacing rhythm', async () => {
  const [sellMyCar, damagedCar, accidentDamagedCar, nonRunningCar, engineProblems] = await Promise.all([
    readPage('sell-my-car'),
    readPage('sell-damaged-car'),
    readPage('sell-accident-damaged-car'),
    readPage('sell-non-running-car'),
    readPage('sell-car-with-engine-problems')
  ]);

  for (const page of [sellMyCar, damagedCar, accidentDamagedCar, nonRunningCar, engineProblems]) {
    assert.match(page, new RegExp(desktopScale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(page, new RegExp(mobileScale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(page, /column-gap:clamp\(44px,6vw,84px\);row-gap:20px;margin-top:28px/);
    assert.match(page, /@media\(min-width:981px\)\{\.[\w-]+__copy\{align-self:end\}\}/);
    assert.match(page, /@media\(max-width:980px\)\{\.[\w-]+__copy\{align-self:auto\}\}/);
  }
});
