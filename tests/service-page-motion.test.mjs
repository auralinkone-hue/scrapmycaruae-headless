import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('service pages use the shared lightweight reveal and parallax treatment', async () => {
  const [motion, sellMyCar, damagedCar, accidentDamagedCar, nonRunningCar] = await Promise.all([
    readProjectFile('src/components/ServicePageMotion.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/pages/sell-damaged-car.astro'),
    readProjectFile('src/pages/sell-accident-damaged-car.astro'),
    readProjectFile('src/pages/sell-non-running-car.astro')
  ]);

  for (const page of [sellMyCar, damagedCar, accidentDamagedCar, nonRunningCar]) {
    assert.match(page, /import ServicePageMotion from '\.\.\/components\/ServicePageMotion\.astro'/);
    assert.match(page, /data-service-motion/);
    assert.match(page, /<ServicePageMotion \/>/);
  }

  assert.match(motion, /IntersectionObserver/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /min-width: 981px/);
  assert.match(motion, /service-motion-glow/);
});
