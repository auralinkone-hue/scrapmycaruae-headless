import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  abuDhabiLocations,
  dubaiLocations,
  footerUaeLocations,
  priorityCoverageLocations,
  uaeLocationGroups
} from '../src/lib/locations.ts';

const readProjectFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('location source keeps normalized Dubai and UAE names in clear groups', () => {
  for (const location of [
    'Al Qusais',
    'Al Mizhar',
    'Sheikh Zayed Road',
    'Dubai Media City',
    'Palm Jumeirah',
    'Jumeirah Lakes Towers (JLT)',
    'Dubai Sports City',
    'Dubai Investments Park (DIP)',
    'Dubailand',
    'Umm Suqeim',
    'Oud Metha',
    'Dubai Waterfront'
  ]) assert.ok(dubaiLocations.includes(location));

  for (const location of [
    'Reem Island',
    'Khalifa City',
    'Shakhbout City',
    'Musaffah',
    'Mohammed Bin Zayed City'
  ]) assert.ok(abuDhabiLocations.includes(location));

  assert.ok(priorityCoverageLocations.includes('Umm Al Quwain'));
  assert.ok(priorityCoverageLocations.includes('Ras Al Khaimah'));
  assert.ok(footerUaeLocations.includes('Ras Al Khaimah'));
  assert.equal(uaeLocationGroups.length, 3);
  assert.ok(!abuDhabiLocations.includes('Khalifa City B'));
});

test('all rendered coverage lists use the shared source and reusable disclosure', async () => {
  const [home, sellMyCar, damagedCar, footer, list] = await Promise.all([
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/pages/sell-damaged-car.astro'),
    readProjectFile('src/components/SiteFooter.astro'),
    readProjectFile('src/components/LocationCoverageList.astro')
  ]);

  for (const page of [home, sellMyCar, damagedCar]) {
    assert.match(page, /<LocationCoverageList/);
    assert.match(page, /<UaeCollectionIllustration/);
  }

  assert.match(footer, /footerDubaiLocations/);
  assert.match(footer, /footerUaeLocations/);
  assert.match(list, /priorityCoverageLocations/);
  assert.match(list, /uaeLocationGroups/);
  assert.match(list, /<details class="location-coverage__all">/);
  assert.match(list, /@media \(max-width: 620px\)/);
});
