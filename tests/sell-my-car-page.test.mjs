import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { indexableStaticRoutes } from '../src/lib/site-routes.ts';

const readProjectFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('sell my car hub has transactional SEO, schemas, and the reusable valuation form', async () => {
  const page = await readProjectFile('src/pages/sell-my-car.astro');

  assert.match(page, /export const prerender = false/);
  assert.match(page, /Sell My Car UAE \| Free Valuation & Vehicle Collection/);
  assert.match(page, /canonical="\/sell-my-car\/"/);
  assert.match(page, /'@type': 'BreadcrumbList'/);
  assert.match(page, /'@type': 'FAQPage'/);
  assert.match(page, /<QuoteForm[\s\S]*?variant="free-quote"/);
  assert.match(page, /Start with my car details/);
  assert.doesNotMatch(page, /No obligation\. Your details are saved securely before we open WhatsApp\./);
});

test('sell my car hub links the live service pages while using existing data sources', async () => {
  const page = await readProjectFile('src/pages/sell-my-car.astro');

  assert.match(page, /getVehicleData/);
  assert.match(page, /getLatestPosts/);
  assert.match(page, /BlogArticleCard/);
  assert.match(page, /wixResponsiveImage/);
  assert.match(page, /'Damaged cars'[\s\S]*?'\/sell-damaged-car\//);
  assert.match(page, /View details/);
  assert.match(page, /condition-card-link__details/);
  assert.match(page, /'Engine problems'[\s\S]*?'\/sell-car-with-engine-problems\//);
  assert.doesNotMatch(page, /href="\/sell-non-running-car\//);
  assert.doesNotMatch(page, /href="\/cars\//);
});

test('sell my car refinement keeps the form ahead of trust content and uses the shared make rail', async () => {
  const page = await readProjectFile('src/pages/sell-my-car.astro');
  const rail = await readProjectFile('src/components/MakeLogoRail.astro');
  const home = await readProjectFile('src/pages/index.astro');

  assert.ok(page.indexOf('sell-hero__form') < page.indexOf('trust-points'));
  assert.match(page, /grid-template-areas: 'copy form' 'trust form'/);
  assert.match(page, /class="smc-container intro-bento"/);
  assert.match(page, /class="factor-list"/);
  assert.match(page, /<MakeLogoRail makes=\{selectedMakes\}/);
  assert.match(rail, /prefers-reduced-motion/);
  assert.match(rail, /makeLogoForName/);
  assert.match(rail, /animation-duration: 38s/);
  assert.match(page, /class="mobile-makes"/);
  assert.match(page, /\.makes \{ display:none; \}/);
  assert.match(home, /makeLogoForName\(make\.make\)/);
});

test('sell my car final page exposes the full visible FAQ schema and cautious official-source facts', async () => {
  const page = await readProjectFile('src/pages/sell-my-car.astro');

  assert.equal((page.match(/\['(?:Valuation & process|Vehicle condition|Ownership & paperwork|Collection)'/g) ?? []).length, 20);
  assert.match(page, /mainEntity: faqs\.map/);
  assert.match(page, /UAE vehicle data at a glance/);
  assert.match(page, /UAE Ministry of Interior/);
  assert.match(page, /FCSC/);
  assert.match(page, /Dubai RTA/);
  assert.match(page, /rel="noopener noreferrer"/);
  assert.match(page, /<SectionActionButton href="\/blogs" label="View all blogs"/);
  assert.match(page, /<ul class="factor-list">/);
});

test('sell my car visual polish keeps section hierarchy concise and centers the blog action', async () => {
  const page = await readProjectFile('src/pages/sell-my-car.astro');

  assert.match(page, /href="\/free-quote" data-analytics-quote-cta="sell_my_car_intro">Start with my car details/);
  assert.match(page, /class="section-heading section-heading--centered"/);
  assert.match(page, /Helpful answers and practical guidance for selling, valuing and managing your vehicle in the UAE/);
  assert.match(page, /\.guides__action \{ justify-content:center/);
  assert.doesNotMatch(page, />Simple from the start</);
  assert.doesNotMatch(page, />Understanding a valuation</);
  assert.doesNotMatch(page, />From the blog</);
  assert.doesNotMatch(page, />Questions answered</);
});

test('sell my car condition cards use an equal responsive grid and reserve details treatment for the live route', async () => {
  const page = await readProjectFile('src/pages/sell-my-car.astro');

  assert.match(page, /\.condition-grid \{ grid-template-columns:repeat\(3,minmax\(0,1fr\)\); grid-auto-rows:1fr;/);
  assert.match(page, /@media \(max-width:980px\) \{ \.condition-grid \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\);/);
  assert.match(page, /@media \(max-width:700px\) \{ \.condition-grid \{ grid-template-columns:1fr;/);
  assert.match(page, /min-height:228px; padding:24px/);
  assert.doesNotMatch(page, /article:last-child \{ grid-column:auto; grid-row:auto; display:flex/);
  assert.equal((page.match(/View details/g) ?? []).length, 1);
});

test('sell my car route is registered once for the production sitemap and header navigation', async () => {
  const header = await readProjectFile('src/components/SiteHeader.astro');

  assert.equal(indexableStaticRoutes.filter((route) => route === '/sell-my-car/').length, 1);
  assert.match(header, /href: '\/sell-my-car\/', label: 'Sell My Car'/);
  assert.match(header, /href: '\/sell-my-car\/', label: 'Sell My Car'/);
  assert.match(header, /Value My Car/);
  assert.match(header, /const sellMyCarServices/);
  assert.match(header, /label: 'Sell Damaged Car'/);
  assert.match(header, /label: 'Sell Accident-Damaged Car'/);
  assert.match(header, /children: sellMyCarServices/);
  assert.match(header, /class:list=\{\['nav-dropdown'/);
  assert.match(header, /class="mobile-view mobile-view--main is-active"/);
  assert.match(header, /label: 'Engine Problems'/);
  for (const href of ['/sell-my-car/', '/sell-damaged-car/', '/sell-accident-damaged-car/', '/sell-non-running-car/', '/sell-car-with-engine-problems/']) {
    assert.match(header, new RegExp(`href: '${href.replaceAll('/', '\\/')}'`));
  }
  assert.match(header, /nav-dropdown__panel/);
  assert.match(header, /data-mobile-forward/);
  assert.match(header, /label: 'Expired Registration'/);
});
