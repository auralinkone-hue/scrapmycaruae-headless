import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('shared section actions require a semantic intent icon', async () => {
  const button = await readProjectFile('src/components/SectionActionButton.astro');

  assert.match(button, /valuation:\s*'ph-calculator'/);
  assert.match(button, /contact:\s*'ph-chats-circle'/);
  assert.match(button, /blogs:\s*'ph-newspaper-clipping'/);
  assert.match(button, /process:\s*'ph-list-checks'/);
  assert.match(button, /faqs:\s*'ph-question'/);
  assert.doesNotMatch(button, /ph-arrow-right|ph-arrow-up-right/);
});

test('every shared section action declares its intent', async () => {
  const pages = await Promise.all([
    readProjectFile('src/components/LocationCoverageList.astro'),
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/pages/sell-damaged-car.astro')
  ]);

  const usages = pages.flatMap((page) => page.match(/<SectionActionButton\b[^>]*\/>/g) ?? []);
  assert.ok(usages.length > 0);
  for (const usage of usages) assert.match(usage, /\sintent="(?:valuation|contact|blogs|process|faqs)"/);
});

test('the exact free valuation label is reserved for the form submit', async () => {
  const [form, header, home, sellMyCar, damagedCar, contact, faqs, article, notFound] = await Promise.all([
    readProjectFile('src/components/QuoteForm.astro'),
    readProjectFile('src/components/SiteHeader.astro'),
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/pages/sell-damaged-car.astro'),
    readProjectFile('src/pages/contact-us.astro'),
    readProjectFile('src/pages/faqs.astro'),
    readProjectFile('src/pages/post/[slug].astro'),
    readProjectFile('src/pages/404.astro')
  ]);

  assert.match(form, />Get My Free Valuation <i class="ph ph-calculator"/);
  for (const source of [header, home, sellMyCar, damagedCar, contact, faqs, article, notFound]) {
    assert.doesNotMatch(source, />Get My Free Valuation\s*</);
  }
  assert.match(damagedCar, /Tell us about the damage/);
  assert.match(damagedCar, /Compare before you repair/);
  assert.match(damagedCar, /Check your car's value/);
});

test('valuation buttons and forms use the calculator icon instead of generic arrows', async () => {
  const files = await Promise.all([
    readProjectFile('src/components/QuoteForm.astro'),
    readProjectFile('src/components/SiteHeader.astro'),
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/pages/sell-my-car.astro'),
    readProjectFile('src/pages/sell-damaged-car.astro'),
    readProjectFile('src/pages/contact-us.astro'),
    readProjectFile('src/pages/faqs.astro'),
    readProjectFile('src/pages/post/[slug].astro'),
    readProjectFile('src/pages/404.astro')
  ]);

  for (const source of files) {
    const valuationActions = source.match(/<(?:a|button)[^>]*(?:free-quote|data-submit|data-analytics-quote-cta)[^>]*>[\s\S]*?<\/(?:a|button)>/g) ?? [];
    for (const action of valuationActions) {
      assert.match(action, /ph-calculator/);
      assert.doesNotMatch(action, /ph-arrow-right|ph-arrow-up-right|→/);
    }
  }
});

test('blog actions use reading icons and decorative cards do not show action arrows', async () => {
  const [home, blogCard, latestBlogs, archive] = await Promise.all([
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/components/BlogArticleCard.astro'),
    readProjectFile('src/components/LatestBlogsSidebar.astro'),
    readProjectFile('src/pages/blogs.astro')
  ]);

  assert.doesNotMatch(home, /benefit-arrow/);
  assert.match(home, /Read article <i class="ph ph-book-open-text"/);
  assert.match(blogCard, /ph-book-open-text/);
  assert.match(latestBlogs, /ph-newspaper-clipping/);
  assert.match(latestBlogs, /ph-book-open-text/);
  assert.match(archive, /ph-book-open-text/);
});
