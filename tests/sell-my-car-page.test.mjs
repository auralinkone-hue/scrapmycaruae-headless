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
  assert.match(page, /Get My Free Valuation/);
  assert.doesNotMatch(page, /No obligation\. Your details are saved securely before we open WhatsApp\./);
});

test('sell my car hub avoids future-route links while using existing data sources', async () => {
  const page = await readProjectFile('src/pages/sell-my-car.astro');

  assert.match(page, /getVehicleData/);
  assert.match(page, /getLatestPosts/);
  assert.match(page, /BlogArticleCard/);
  assert.match(page, /wixResponsiveImage/);
  assert.doesNotMatch(page, /href="\/sell-damaged-car\//);
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
  assert.match(home, /makeLogoForName\(make\.name\)/);
});

test('sell my car final page exposes the full visible FAQ schema and cautious official-source facts', async () => {
  const page = await readProjectFile('src/pages/sell-my-car.astro');

  assert.equal((page.match(/\['(?:Valuation & process|Vehicle condition|Ownership & paperwork|Collection)'/g) ?? []).length, 20);
  assert.match(page, /mainEntity: faqs\.map/);
  assert.match(page, /UAE vehicle facts at a glance/);
  assert.match(page, /Dubai RTA vehicle services/);
  assert.match(page, /rel="noopener noreferrer"/);
  assert.match(page, /<SectionActionButton href="\/blogs" label="View all blogs"/);
  assert.match(page, /<ul class="factor-list">/);
});

test('sell my car route is registered once for the production sitemap and header navigation', async () => {
  const header = await readProjectFile('src/components/SiteHeader.astro');

  assert.equal(indexableStaticRoutes.filter((route) => route === '/sell-my-car/').length, 1);
  assert.match(header, /href: '\/sell-my-car\/', label: 'Sell My Car'/);
  assert.match(header, /href="\/sell-my-car\/"/);
  assert.match(header, /Get a Free Valuation/);
});
