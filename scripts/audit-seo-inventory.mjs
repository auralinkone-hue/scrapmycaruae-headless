import fs from 'node:fs/promises';
import path from 'node:path';

const inputPath = path.resolve('seo-inventory/blog-seo-inventory.json');
const outputPath = path.resolve('seo-inventory/seo-issues.csv');
const crawlFailuresPath = path.resolve('seo-inventory/crawl-failures.csv');

const raw = await fs.readFile(inputPath, 'utf8');
const inventory = JSON.parse(raw);
const rows = inventory.rows ?? [];

function isSuccessfulCrawl(row) {
  return (
    Number(row.liveStatus) === 200 &&
    (!row.crawlState || row.crawlState === 'success')
  );
}

const successfulRows = rows.filter(isSuccessfulCrawl);

const issues = successfulRows
  .map((row) => {
    const problems = [];

    if (!row.liveMetaDescription) {
      problems.push('MISSING_META_DESCRIPTION');
    }
    if (!row.liveCanonical) {
      problems.push('MISSING_CANONICAL');
    }
    if (!row.liveTitle) {
      problems.push('MISSING_TITLE');
    }

    return problems.length ? { ...row, problems } : null;
  })
  .filter(Boolean);

const crawlFailures = rows.filter((row) => !isSuccessfulCrawl(row));

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return '"' + text.replaceAll('"', '""') + '"';
}

const issueColumns = [
  'problems',
  'liveStatus',
  'crawlState',
  'title',
  'slug',
  'url',
  'liveFinalUrl',
  'liveTitle',
  'liveMetaDescription',
  'liveCanonical',
  'apiSeoTitle',
  'apiMetaDescription',
  'apiCanonical',
  'focusKeyword',
  'crawlError'
];

const issueCsv = [
  issueColumns.map(csvEscape).join(','),
  ...issues.map((row) =>
    issueColumns
      .map((column) =>
        csvEscape(
          column === 'problems'
            ? row.problems.join(' | ')
            : row[column]
        )
      )
      .join(',')
  )
].join('\n');

await fs.writeFile(outputPath, issueCsv, 'utf8');

const failureColumns = [
  'liveStatus',
  'crawlState',
  'retryCount',
  'title',
  'slug',
  'url',
  'liveFinalUrl',
  'crawlError'
];

const failureCsv = [
  failureColumns.map(csvEscape).join(','),
  ...crawlFailures.map((row) =>
    failureColumns.map((column) => csvEscape(row[column])).join(',')
  )
].join('\n');

await fs.writeFile(crawlFailuresPath, failureCsv, 'utf8');

const missingDescriptions = issues.filter((row) =>
  row.problems.includes('MISSING_META_DESCRIPTION')
);
const missingCanonicals = issues.filter((row) =>
  row.problems.includes('MISSING_CANONICAL')
);
const missingTitles = issues.filter((row) =>
  row.problems.includes('MISSING_TITLE')
);
const rateLimited = crawlFailures.filter(
  (row) =>
    Number(row.liveStatus) === 429 ||
    row.crawlState === 'rate_limited'
);

console.log('');
console.log('SEO audit summary');
console.log('=================');
console.log(`Total published posts: ${rows.length}`);
console.log(`Successfully crawled pages: ${successfulRows.length}`);
console.log(
  `Crawl failures excluded from SEO scoring: ${crawlFailures.length}`
);
console.log(`Still rate-limited: ${rateLimited.length}`);
console.log(`Pages with actual SEO issues: ${issues.length}`);
console.log(
  `Missing live meta descriptions: ${missingDescriptions.length}`
);
console.log(`Missing live canonicals: ${missingCanonicals.length}`);
console.log(`Missing live titles: ${missingTitles.length}`);
console.log('');
console.log('Missing meta descriptions');
console.log('-------------------------');
for (const row of missingDescriptions) {
  console.log(`- ${row.url}`);
}
console.log('');
console.log('Missing canonicals');
console.log('------------------');
for (const row of missingCanonicals) {
  console.log(`- ${row.url}`);
}
console.log('');
console.log('Missing titles');
console.log('--------------');
for (const row of missingTitles) {
  console.log(`- ${row.url}`);
}
console.log('');
console.log(`SEO issue CSV: ${outputPath}`);
console.log(`Crawl failure CSV: ${crawlFailuresPath}`);
