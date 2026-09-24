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
const progressPath = path.join(outputDir, 'crawl-progress.json');
const csvPath = path.join(outputDir, 'blog-seo-inventory.csv');
const jsonPath = path.join(outputDir, 'blog-seo-inventory.json');

await fs.mkdir(outputDir, { recursive: true });

// Conservative crawl settings.
const REQUEST_DELAY_MS = 2000;      // ~30 live pages/minute
const MAX_429_RETRIES = 5;
const DEFAULT_429_WAIT_MS = 60_000; // fallback when Retry-After is absent
const MAX_BACKOFF_MS = 15 * 60_000;
const PROGRESS_SAVE_EVERY = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const mainKeyword = (post.seoData?.settings?.keywords ?? []).find(
    (keyword) => keyword.isMain
  );

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
    jsonLdCount:
      (html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi) ?? []).length
  };
}

function blankLiveSeo() {
  return {
    liveTitle: '',
    liveMetaDescription: '',
    liveCanonical: '',
    liveRobots: '',
    liveOgTitle: '',
    liveOgDescription: '',
    liveOgImage: '',
    jsonLdCount: 0
  };
}

function parseRetryAfter(value) {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1000);
  }

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function get429WaitMs(response, retryNumber) {
  const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));

  if (retryAfterMs != null) {
    return Math.min(retryAfterMs + 1000, MAX_BACKOFF_MS);
  }

  const exponential =
    DEFAULT_429_WAIT_MS * (2 ** Math.max(0, retryNumber - 1));

  return Math.min(exponential, MAX_BACKOFF_MS);
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
      throw new Error(
        `Wix Blog query failed: ${response.status} ${await response.text()}`
      );
    }

    const data = await response.json();
    posts.push(...(data.posts ?? []));
    cursor = data.pagingMetadata?.cursors?.next;
  } while (cursor);

  return posts;
}

async function fetchLiveSeo(url) {
  let retryCount = 0;

  while (true) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'SMC-Headless-SEO-Inventory/2.0',
          accept: 'text/html,application/xhtml+xml'
        }
      });

      if (response.status === 429) {
        retryCount += 1;

        if (retryCount > MAX_429_RETRIES) {
          return {
            liveStatus: 429,
            liveFinalUrl: response.url || url,
            ...blankLiveSeo(),
            crawlState: 'rate_limited',
            crawlError: `HTTP 429 after ${MAX_429_RETRIES} retries`,
            retryCount: MAX_429_RETRIES
          };
        }

        const waitMs = get429WaitMs(response, retryCount);
        console.log(
          `  429 received. Waiting ${Math.ceil(waitMs / 1000)}s before retry ${retryCount}/${MAX_429_RETRIES}...`
        );
        await sleep(waitMs);
        continue;
      }

      const html = await response.text();

      if (!response.ok) {
        return {
          liveStatus: response.status,
          liveFinalUrl: response.url || url,
          ...blankLiveSeo(),
          crawlState: 'http_error',
          crawlError: `HTTP ${response.status}`,
          retryCount
        };
      }

      return {
        liveStatus: response.status,
        liveFinalUrl: response.url,
        ...extractHtmlSeo(html),
        crawlState: 'success',
        crawlError: '',
        retryCount
      };
    } catch (error) {
      return {
        liveStatus: '',
        liveFinalUrl: '',
        ...blankLiveSeo(),
        crawlState: 'network_error',
        crawlError: error instanceof Error ? error.message : String(error),
        retryCount
      };
    }
  }
}

async function loadProgress() {
  try {
    const raw = await fs.readFile(progressPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.results && typeof parsed.results === 'object'
      ? parsed.results
      : {};
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    console.warn(`Could not read previous progress: ${error.message}`);
    return {};
  }
}

async function saveProgress(results, totalPosts) {
  await fs.writeFile(
    progressPath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        totalPosts,
        settings: {
          requestDelayMs: REQUEST_DELAY_MS,
          max429Retries: MAX_429_RETRIES,
          default429WaitMs: DEFAULT_429_WAIT_MS
        },
        results
      },
      null,
      2
    ),
    'utf8'
  );
}

console.log('Fetching all published Wix Blog posts...');
const posts = await queryAllPosts();
console.log(`Found ${posts.length} published posts.`);

const apiRows = posts.map((post) => {
  const url =
    post.url?.base && post.url?.path
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

const progressResults = await loadProgress();
const rows = [];

const resumableCount = apiRows.filter((row) => {
  const saved = progressResults[row.id];
  return (
    saved &&
    saved.url === row.url &&
    saved.crawlState === 'success' &&
    Number(saved.liveStatus) === 200
  );
}).length;

if (resumableCount > 0) {
  console.log(
    `Resuming with ${resumableCount} already-successful pages from progress.`
  );
}

console.log(
  `Crawling live post pages sequentially (${REQUEST_DELAY_MS / 1000}s between requests)...`
);

let newlyCrawledSinceSave = 0;

for (let i = 0; i < apiRows.length; i += 1) {
  const row = apiRows[i];
  const saved = progressResults[row.id];

  if (
    saved &&
    saved.url === row.url &&
    saved.crawlState === 'success' &&
    Number(saved.liveStatus) === 200
  ) {
    rows.push({ ...row, ...saved });

    if ((i + 1) % 25 === 0 || i === 0) {
      console.log(`Progress ${i + 1}/${apiRows.length} (resumed)`);
    }
    continue;
  }

  console.log(`Crawling ${i + 1}/${apiRows.length}: ${row.url}`);

  const live = await fetchLiveSeo(row.url);
  const combined = { ...row, ...live };

  rows.push(combined);

  progressResults[row.id] = {
    ...live,
    url: row.url
  };

  newlyCrawledSinceSave += 1;

  if (
    newlyCrawledSinceSave >= PROGRESS_SAVE_EVERY ||
    i === apiRows.length - 1
  ) {
    await saveProgress(progressResults, apiRows.length);
    newlyCrawledSinceSave = 0;
  }

  if (i < apiRows.length - 1) {
    await sleep(REQUEST_DELAY_MS);
  }
}

const rowById = new Map(rows.map((row) => [row.id, row]));
const orderedRows = apiRows.map((row) => rowById.get(row.id) ?? row);

const columns = [
  'id',
  'title',
  'slug',
  'url',
  'liveStatus',
  'liveFinalUrl',
  'crawlState',
  'retryCount',
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
  ...orderedRows.map((row) =>
    columns.map((column) => csvEscape(row[column])).join(',')
  )
].join('\n');

await fs.writeFile(csvPath, csv, 'utf8');

await fs.writeFile(
  jsonPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      site: 'https://www.scrapmycaruae.com',
      totalPublishedPosts: orderedRows.length,
      crawlSettings: {
        requestDelayMs: REQUEST_DELAY_MS,
        max429Retries: MAX_429_RETRIES,
        default429WaitMs: DEFAULT_429_WAIT_MS
      },
      rows: orderedRows
    },
    null,
    2
  ),
  'utf8'
);

const successes = orderedRows.filter(
  (row) => row.crawlState === 'success' && Number(row.liveStatus) === 200
);
const rateLimited = orderedRows.filter(
  (row) => row.crawlState === 'rate_limited'
);
const otherFailures = orderedRows.filter(
  (row) =>
    row.crawlState !== 'success' &&
    row.crawlState !== 'rate_limited'
);

const missingDescriptions = successes.filter(
  (row) => !row.liveMetaDescription
);
const missingCanonicals = successes.filter(
  (row) => !row.liveCanonical
);
const missingTitles = successes.filter(
  (row) => !row.liveTitle
);

console.log('');
console.log('SEO inventory complete.');
console.log('=======================');
console.log(`Posts from Wix API: ${orderedRows.length}`);
console.log(`Successfully crawled (200): ${successes.length}`);
console.log(`Still rate-limited after retries: ${rateLimited.length}`);
console.log(`Other crawl failures: ${otherFailures.length}`);
console.log('');
console.log('Actual SEO findings from successful pages only');
console.log('----------------------------------------------');
console.log(
  `Missing live meta descriptions: ${missingDescriptions.length}`
);
console.log(`Missing live canonicals: ${missingCanonicals.length}`);
console.log(`Missing live titles: ${missingTitles.length}`);
console.log('');
console.log(`Progress: ${progressPath}`);
console.log(`CSV: ${csvPath}`);
console.log(`JSON: ${jsonPath}`);
