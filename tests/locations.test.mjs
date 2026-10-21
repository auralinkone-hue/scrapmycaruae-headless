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

test('service coverage keeps its grouped design while the homepage uses a compact map', async () => {
  const [home, sellMyCar, damagedCar, footer, list] = await Promise.all([
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/pages/sell-damaged-car.astro'),
    readProjectFile('src/components/SiteFooter.astro'),
    readProjectFile('src/components/LocationCoverageList.astro')
  ]);

  assert.match(home, /<UaeCoverageMap/);
  assert.match(home, /href="\/locations\/"/);
  for (const page of [sellMyCar, damagedCar]) {
    assert.match(page, /<LocationCoverageList/);
    assert.doesNotMatch(page, /UaeCollectionIllustration/);
  }

  assert.match(footer, /footerDubaiLocations/);
  assert.match(footer, /footerUaeLocations/);
  assert.match(list, /uaeLocationGroups/);
  assert.match(list, /locationIcon/);
  assert.match(list, /location-item__icon/);
  assert.match(list, /location-group--dubai/);
  assert.match(list, /label="Talk to the team" intent="contact"/);
  assert.match(list, /label="How selling works" intent="process"/);
  assert.match(list, /location-coverage__actions/);
  assert.match(list, /background-image: url\("data:image\/svg\+xml/);
  assert.doesNotMatch(list, /<details|max-height:\s*\d+px|overflow:\s*auto/);
  assert.match(list, /@media \(max-width: 480px\)/);
});

test('homepage location coverage stays full width instead of the old split layout', async () => {
  const homepage = await readProjectFile('src/pages/index.astro');

  assert.match(homepage, /\.coverage-grid\s*\{\s*display:\s*block;/);
  assert.doesNotMatch(
    homepage,
    /\.coverage-grid\s*\{[^}]*grid-template-columns:\s*1fr\s+\.9fr;/s
  );
});
