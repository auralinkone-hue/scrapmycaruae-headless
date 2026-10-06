import { indexableStaticRoutes, permanentRedirects } from '../src/lib/site-routes.ts';

const configuredEnvironment = String(process.env.PUBLIC_SEO_ENV || 'staging')
  .trim()
  .toLowerCase();
const baseUrl = new URL(
  process.env.SEO_AUDIT_URL || process.env.PUBLIC_SITE_URL || 'http://localhost:4321'
);
const postPaths = String(process.env.SEO_AUDIT_POST_PATHS || '')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean)
  .map((path) => path.startsWith('/') ? path : `/${path}`);

if (!['staging', 'production'].includes(configuredEnvironment)) {
  throw new Error('PUBLIC_SEO_ENV must be staging or production.');
}

const expectedIndexable = configuredEnvironment === 'production';
const auditRoutes = [...indexableStaticRoutes, ...postPaths];
let failed = false;

const textFrom = (html, pattern) => html.match(pattern)?.[1]?.trim() ?? '';
const count = (html, pattern) => (html.match(pattern) ?? []).length;
const expectedUrl = (pathname) => new URL(pathname, baseUrl).toString();

for (const pathname of auditRoutes) {
  const response = await fetch(new URL(pathname, baseUrl));
  const html = await response.text();
  const canonical = textFrom(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) ||
    textFrom(html, /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  const robots = textFrom(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i).toLowerCase();
  const title = textFrom(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = textFrom(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const canonicalCount = count(html, /<link\b[^>]*\brel=["']canonical["']/gi);
  const h1Count = count(html, /<h1(?:\s|>)/gi);
  const expectedCanonical = expectedUrl(pathname);
  const expectedRobots = expectedIndexable ? 'index,follow' : 'noindex,nofollow';
  const checks = [
    [response.status === 200, `HTTP ${response.status}`],
    [Boolean(title), 'missing title'],
    [Boolean(description), 'missing meta description'],
    [canonicalCount === 1, `canonical count ${canonicalCount}`],
    [canonical === expectedCanonical, `canonical ${canonical || '(missing)'}`],
    [robots.includes(expectedRobots), `robots ${robots || '(missing)'}`],
    [h1Count === 1, `H1 count ${h1Count}`]
  ];
  const issues = checks.filter(([ok]) => !ok).map(([, issue]) => issue);
  console.log(`${issues.length ? 'FAIL' : 'PASS'} ${pathname}${issues.length ? ` — ${issues.join('; ')}` : ''}`);
  if (issues.length) failed = true;
}

for (const [from, to] of Object.entries(permanentRedirects)) {
  const response = await fetch(new URL(from, baseUrl), { redirect: 'manual' });
  const location = response.headers.get('location');
  const expectedLocation = expectedUrl(to);
  const resolvedLocation = location ? new URL(location, baseUrl).toString() : '';
  const ok = response.status === 301 && resolvedLocation === expectedLocation;
  console.log(`${ok ? 'PASS' : 'FAIL'} redirect ${from} -> ${to}`);
  if (!ok) {
    console.log(`  got ${response.status} ${location || '(no location)'}, expected 301 ${expectedLocation}`);
    failed = true;
  }
}

const sitemap = await fetch(new URL('/sitemap.xml', baseUrl), { redirect: 'manual' });
const sitemapBody = await sitemap.text();
if (expectedIndexable) {
  const missing = indexableStaticRoutes.filter((path) => !sitemapBody.includes(expectedUrl(path)));
  const ok = sitemap.status === 200 && sitemapBody.includes('<urlset') && missing.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} sitemap.xml${missing.length ? ` missing ${missing.join(', ')}` : ''}`);
  if (!ok) failed = true;
} else {
  const ok = sitemap.status === 404 && sitemap.headers.get('x-robots-tag')?.includes('noindex');
  console.log(`${ok ? 'PASS' : 'FAIL'} staging sitemap blocked`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
