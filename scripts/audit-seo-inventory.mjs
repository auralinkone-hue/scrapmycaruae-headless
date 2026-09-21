import fs from 'node:fs/promises';
import path from 'node:path';

const inputPath = path.resolve('seo-inventory/blog-seo-inventory.json');
const outputPath = path.resolve('seo-inventory/seo-issues.csv');

const raw = await fs.readFile(inputPath, 'utf8');
const inventory = JSON.parse(raw);
const rows = inventory.rows ?? [];

const issues = rows
  .map((row) => {
    const problems = [];
    if (Number(row.liveStatus) !== 200) {
      problems.push(`NON_200:${row.liveStatus || 'UNKNOWN'}`);
    }
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

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return '"' + text.replaceAll('"', '""') + '"';
}

const columns = [
  'problems',
  'liveStatus',
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

const csv = [
  columns.map(csvEscape).join(','),
  ...issues.map((row) =>
    columns.map((column) =>
      csvEscape(column === 'problems' ? row.problems.join(' | ') : row[column])
    ).join(',')
  )
].join('\n');

await fs.writeFile(outputPath, csv, 'utf8');

const non200 = issues.filter((row) => row.problems.some((p) => p.startsWith('NON_200')));
const missingDescriptions = issues.filter((row) => row.problems.includes('MISSING_META_DESCRIPTION'));
const missingCanonicals = issues.filter((row) => row.problems.includes('MISSING_CANONICAL'));
const missingTitles = issues.filter((row) => row.problems.includes('MISSING_TITLE'));

console.log('');
console.log('SEO audit summary');
console.log('=================');
console.log(`Total published posts: ${rows.length}`);
console.log(`Posts with at least one issue: ${issues.length}`);
console.log(`Non-200 live URLs: ${non200.length}`);
console.log(`Missing live meta descriptions: ${missingDescriptions.length}`);
console.log(`Missing live canonicals: ${missingCanonicals.length}`);
console.log(`Missing live titles: ${missingTitles.length}`);
console.log('');
console.log('Non-200 URLs');
console.log('------------');
for (const row of non200) {
  console.log(`[${row.liveStatus || 'UNKNOWN'}] ${row.url}`);
}
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
console.log(`Issue CSV: ${outputPath}`);
