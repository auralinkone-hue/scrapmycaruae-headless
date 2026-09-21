import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient, OAuthStrategy } from '@wix/sdk';

const clientId = process.env.PUBLIC_WIX_CLIENT_ID;

if (!clientId) {
  throw new Error('PUBLIC_WIX_CLIENT_ID is required.');
}

const wixClient = createClient({
  auth: OAuthStrategy({ clientId })
});

const tokens = await wixClient.auth.generateVisitorTokens();
const accessToken = tokens.accessToken?.value;

if (!accessToken) {
  throw new Error('Could not generate a Wix visitor access token.');
}

const outputDir = path.resolve('seo-inventory');
await fs.mkdir(outputDir, { recursive: true });

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return '"' + text.replaceAll('"', '""') + '"';
}

function getTag(tags, predicate) {
  return (tags ?? []).find(predicate);
}

function extractApiSeo(post) {
  const tags = post.seoData?.tags ?? [];
  const titleTag = getTag(tags, (tag) => tag.type === 'title');
  const descriptionTag = getTag(
    tags,
    (tag) => tag.type === 'meta' && tag.props?.name === 'description'
  );
  const canonicalTag = getTag(
    tags,
    (tag) => tag.type === 'link' && tag.props?.rel === 'canonical'
  );
  const mainKeyword = (post.seoData?.settings?.keywords ?? []).find((keyword) => keyword.isMain);

  return {
    apiSeoTitle: titleTag?.children ?? '',
    apiMetaDescription: descriptionTag?.props?.content ?? '',
    apiCanonical: canonicalTag?.props?.href ?? '',
    focusKeyword: mainKeyword?.term ?? ''
  };
}

function extractHtmlSeo(html) {
  const pick = (regex) => {
    const match = html.match(regex);
    return match?.[1]?.trim() ?? '';
  };

  return {
    liveTitle: pick(/<title[^>]*>([\s\S]*?)<\/title>/i),
    liveMetaDescription:
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ||
      pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i),
    liveCanonical:
      pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) ||
      pick(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i),
    liveRobots:
      pick(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i) ||
      pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["'][^>]*>/i),
    liveOgTitle:
      pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["'][^>]*>/i) ||
      pick(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["'][^>]*>/i),
    liveOgDescription:
      pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ||
      pick(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["'][^>]*>/i),
    liveOgImage:
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["'][^>]*>/i) ||
      pick(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["'][^>]*>/i),
    jsonLdCount: (html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi) ?? []).length
  };
}

async function queryAllPosts() {
  const posts = [];
  let cursor;

  do {
    const response = await fetch('https://www.wixapis.com/v3/posts/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: accessToken
      },
      body: JSON.stringify({
        fieldsets: ['URL', 'SEO'],
        query: {
          cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 },
          sort: [{ fieldName: 'firstPublishedDate', order: 'DESC' }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Wix Blog query failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    posts.push(...(data.posts ?? []));
    cursor = data.pagingMetadata?.cursors?.next;
  } while (cursor);

  return posts;
}

async function fetchLiveSeo(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'SMC-Headless-SEO-Inventory/1.0' }
    });

    const html = await response.text();

    return {
      liveStatus: response.status,
      liveFinalUrl: response.url,
      ...extractHtmlSeo(html),
      crawlError: ''
    };
  } catch (error) {
    return {
      liveStatus: '',
      liveFinalUrl: '',
      liveTitle: '',
      liveMetaDescription: '',
      liveCanonical: '',
      liveRobots: '',
      liveOgTitle: '',
      liveOgDescription: '',
      liveOgImage: '',
      jsonLdCount: 0,
      crawlError: error instanceof Error ? error.message : String(error)
    };
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      results[current] = await mapper(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

console.log('Fetching all published Wix Blog posts...');
const posts = await queryAllPosts();
console.log(`Found ${posts.length} published posts.`);

const apiRows = posts.map((post) => {
  const url = post.url?.base && post.url?.path
    ? post.url.base + post.url.path
    : `https://www.scrapmycaruae.com/post/${post.slug}`;

  return {
    id: post.id,
    title: post.title ?? '',
    slug: post.slug ?? '',
    url,
    excerpt: post.excerpt ?? '',
    firstPublishedDate: post.firstPublishedDate ?? '',
    lastPublishedDate: post.lastPublishedDate ?? '',
    language: post.language ?? '',
    minutesToRead: post.minutesToRead ?? '',
    coverImage: post.media?.wixMedia?.image?.url ?? '',
    coverImageAlt: post.media?.altText ?? '',
    ...extractApiSeo(post)
  };
});

console.log('Crawling live post pages to capture rendered SEO tags...');
const rows = await mapWithConcurrency(apiRows, 6, async (row, i) => {
  if ((i + 1) % 25 === 0 || i === 0) {
    console.log(`Crawling ${i + 1}/${apiRows.length}`);
  }
  return { ...row, ...(await fetchLiveSeo(row.url)) };
});

const columns = [
  'id',
  'title',
  'slug',
  'url',
  'liveStatus',
  'liveFinalUrl',
  'firstPublishedDate',
  'lastPublishedDate',
  'language',
  'minutesToRead',
  'coverImage',
  'coverImageAlt',
  'focusKeyword',
  'apiSeoTitle',
  'apiMetaDescription',
  'apiCanonical',
  'liveTitle',
  'liveMetaDescription',
  'liveCanonical',
  'liveRobots',
  'liveOgTitle',
  'liveOgDescription',
  'liveOgImage',
  'jsonLdCount',
  'crawlError',
  'excerpt'
];

const csv = [
  columns.map(csvEscape).join(','),
  ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(','))
].join('\n');

await fs.writeFile(path.join(outputDir, 'blog-seo-inventory.csv'), csv, 'utf8');
await fs.writeFile(
  path.join(outputDir, 'blog-seo-inventory.json'),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    site: 'https://www.scrapmycaruae.com',
    totalPublishedPosts: rows.length,
    rows
  }, null, 2),
  'utf8'
);

console.log('');
console.log('SEO inventory complete.');
console.log(`Posts: ${rows.length}`);
console.log(`Non-200 live URLs: ${rows.filter((row) => row.liveStatus !== 200).length}`);
console.log(`Missing live meta descriptions: ${rows.filter((row) => !row.liveMetaDescription).length}`);
console.log(`Missing live canonicals: ${rows.filter((row) => !row.liveCanonical).length}`);
console.log(`CSV: ${path.join(outputDir, 'blog-seo-inventory.csv')}`);
console.log(`JSON: ${path.join(outputDir, 'blog-seo-inventory.json')}`);
