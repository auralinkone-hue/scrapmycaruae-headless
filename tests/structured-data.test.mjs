import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { businessIdentity, homepageIdentitySchema, blogPostingSchema, serviceSchemaForPath, serializeJsonLd, defaultSocialImage } from '../src/lib/structured-data.ts';
import { indexableStaticRoutes } from '../src/lib/site-routes.ts';
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('homepage defines one connected WebSite and Organization using existing public contact information', async () => {
  const graph = JSON.parse(serializeJsonLd(homepageIdentitySchema()))['@graph'];
  assert.deepEqual(graph.map(node => node['@type']), ['Organization', 'WebSite']);
  assert.equal(new Set(graph.map(node => node['@id'])).size, 2);
  const [org, site] = graph;
  assert.equal(site.publisher['@id'], org['@id']);
  assert.equal(org.url, businessIdentity.url);
  const footer = await read('src/components/SiteFooter.astro');
  for (const value of [org.telephone, org.email, org.logo.url]) assert.ok(footer.includes(value), value);
  assert.equal(org.areaServed.name, 'United Arab Emirates');
  for (const key of ['sameAs', 'address', 'openingHours', 'aggregateRating', 'review', 'legalName', 'priceRange']) assert.equal(org[key], undefined);
  assert.equal(site.potentialAction, undefined, 'no unsupported site-search endpoint');
});

const article = {
  canonical: 'https://www.scrapmycaruae.com/post/original-wix-slug', headline: 'Original Wix title', description: 'Original Wix description',
  publishedDate: '2026-01-02T08:00:00Z', updatedDate: '2026-03-04T09:00:00Z',
  image: 'https://static.wixstatic.com/media/fixture.jpg',
  author: { name: 'Amina Example', slug: 'amina-example', photoUrl: 'https://static.wixstatic.com/media/author.jpg' }
};
test('BlogPosting uses existing article data and the actual public Wix author without extra requests', () => {
  const schema = blogPostingSchema(article);
  assert.equal(schema.headline, article.headline);
  assert.equal(schema.description, article.description);
  assert.equal(schema.mainEntityOfPage, article.canonical);
  assert.equal(schema.author['@type'], 'Person');
  assert.equal(schema.author.name, article.author.name);
  assert.equal(schema.author.url, 'https://www.scrapmycaruae.com/author/amina-example');
  assert.equal(schema.author.image, article.author.photoUrl);
  assert.equal(schema.datePublished, '2026-01-02T08:00:00.000Z');
  assert.equal(schema.dateModified, '2026-03-04T09:00:00.000Z');
  assert.deepEqual(schema.image, [article.image]);
  assert.equal(schema.publisher.logo.url, businessIdentity.logo);
  assert.equal(schema.publisher['@id'], homepageIdentitySchema()['@graph'][0]['@id']);
});
test('the known editorial team is an Organization; missing authors, dates and invalid images are omitted', () => {
  assert.equal(blogPostingSchema({ ...article, author: { ...article.author, name: 'SMC UAE Team' } }).author['@type'], 'Organization');
  const schema = JSON.parse(serializeJsonLd(blogPostingSchema({ ...article, author: null, publishedDate: 'invalid', updatedDate: null, image: 'javascript:bad' })));
  for (const key of ['author', 'datePublished', 'dateModified', 'image']) assert.equal(schema[key], undefined);
  const noPhoto = blogPostingSchema({ ...article, author: { ...article.author, photoUrl: 'javascript:bad' } });
  assert.equal(noPhoto.author.image, undefined);
  assert.equal(blogPostingSchema({ ...article, updatedDate: null }).dateModified, '2026-01-02T08:00:00.000Z');
});
test('JSON-LD preserves customer/CMS text while preventing script termination', () => {
  const data = blogPostingSchema({ ...article, headline: '</script><img src=x onerror=bad>&"' });
  const text = serializeJsonLd(data);
  assert.ok(!text.includes('<'));
  assert.equal(JSON.parse(text).headline, data.headline);
});
test('Service schema describes only the two existing parent services without fabricated offers or locations', () => {
  for (const path of ['/sell-my-car/', '/scrap-my-car/']) {
    assert.ok(indexableStaticRoutes.includes(path));
    const schema = serviceSchemaForPath(path);
    assert.equal(schema['@type'], 'Service');
    assert.equal(schema.url, businessIdentity.url.slice(0, -1) + path);
    assert.equal(schema.provider['@id'], homepageIdentitySchema()['@graph'][0]['@id']);
    assert.equal(schema.areaServed.name, 'United Arab Emirates');
    assert.equal(schema.offers, undefined);
    assert.deepEqual(serviceSchemaForPath(path.slice(0,-1)), schema);
  }
  for (const path of ['/', '/contact-us/', '/cars/toyota/', '/locations/dubai/']) assert.equal(serviceSchemaForPath(path), null);
});
test('homepage and article emit the new schemas once and hidden homepage FAQs emit no FAQPage', async () => {
  const [home, post, layout] = await Promise.all([read('src/pages/index.astro'),read('src/pages/post/[slug].astro'),read('src/layouts/BaseLayout.astro')]);
  assert.equal((home.match(/serializeJsonLd\(homepageIdentitySchema\(\)\)/g) || []).length, 1);
  assert.match(home, /home\.faqVisible && faqs\.length > 0 && <script[^>]+serializeJsonLd\(faqJsonLd\)/);
  assert.equal((post.match(/blogPostingSchema\(\{/g) || []).length, 1);
  assert.match(post, /publishedDate, updatedDate, image: coverImage, author/);
  assert.match(post, /set:html=\{serializeJsonLd\(jsonLd\)\}/);
  assert.match(layout, /serviceSchema && <script[^>]+serializeJsonLd\(serviceSchema\)/);
  assert.doesNotMatch(home + post + layout, /['"]@type['"]:\s*['"]LocalBusiness/);
});
test('navigation preserves clear links to the six priority destinations and fallback sharing image exists', async () => {
  const footer = await read('src/components/SiteFooter.astro');
  for (const [href, label] of [['/free-quote','Free Quote'],['/sell-my-car/','Sell My Car'],['/scrap-my-car/','Scrap My Car'],['/locations/','UAE Locations'],['/contact-us/','Contact Us'],['/blogs','Blogs']]) {
    assert.match(footer, new RegExp(`href="${href}"[^>]*>${label}</a>`));
  }
  await access(new URL('../public' + defaultSocialImage, import.meta.url));
});
test('actual robots handler allows legitimate search crawlers in production and continues blocking staging', async () => {
  const source = stripTypeScriptTypes(await read('src/pages/robots.txt.ts')).replace(/^import .*\n/gm, '').replace(/export /g, '');
  for (const environment of ['production','staging']) {
    const seoCode = stripTypeScriptTypes((await read('src/lib/seo.ts')).replaceAll('import.meta.env', JSON.stringify({PUBLIC_SEO_ENV:environment,PUBLIC_SITE_URL:businessIdentity.url})));
    const seo = await import('data:text/javascript;base64,' + Buffer.from(seoCode).toString('base64'));
    const handler = new Function('isIndexableRequest','siteUrl',source+';return GET;')(seo.isIndexableRequest,seo.siteUrl);
    const response = await handler({url:new URL(businessIdentity.url+'robots.txt')});
    const text = await response.text();
    for (const bot of ['Googlebot','Bingbot','OAI-SearchBot']) {
      assert.match(text, /User-agent: \*/);
      assert.match(text, environment === 'production' ? /Allow: \/\n/ : /Disallow: \/\n/, bot);
      assert.ok(!text.includes('User-agent: '+bot), 'no specific override silently blocks '+bot);
    }
  }
});
