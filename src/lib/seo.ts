const DEFAULT_SITE_URL = 'https://www.scrapmycaruae.com';

type SeoEnvironment = 'staging' | 'production';

const configuredEnvironment = String(import.meta.env.PUBLIC_SEO_ENV || 'staging')
  .trim()
  .toLowerCase();

if (!['staging', 'production'].includes(configuredEnvironment)) {
  throw new Error('PUBLIC_SEO_ENV must be either "staging" or "production".');
}

export const seoEnvironment = configuredEnvironment as SeoEnvironment;
export const isProductionSeo = seoEnvironment === 'production';

const configuredSiteUrl = String(import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim();

let parsedSiteUrl: URL;
try {
  parsedSiteUrl = new URL(configuredSiteUrl);
} catch {
  throw new Error('PUBLIC_SITE_URL must be a complete https URL.');
}

if (parsedSiteUrl.protocol !== 'https:') {
  throw new Error('PUBLIC_SITE_URL must use https.');
}

if (isProductionSeo && (
  parsedSiteUrl.hostname === 'localhost' ||
  parsedSiteUrl.hostname.endsWith('.workers.dev')
)) {
  throw new Error('Production SEO cannot use a localhost or workers.dev PUBLIC_SITE_URL.');
}

parsedSiteUrl.pathname = '/';
parsedSiteUrl.search = '';
parsedSiteUrl.hash = '';

export const siteUrl = parsedSiteUrl.toString().replace(/\/$/, '');
export const siteHostname = parsedSiteUrl.hostname.toLowerCase();

export const isCanonicalHost = (url: URL) =>
  url.hostname.toLowerCase() === siteHostname;

export const isIndexableRequest = (url: URL) =>
  isProductionSeo && isCanonicalHost(url);

export const robotsContent = (url: URL) =>
  isIndexableRequest(url) ? 'index,follow' : 'noindex,nofollow';

export const canonicalUrl = (value: string | URL) => {
  const url = new URL(String(value), `${siteUrl}/`);
  url.protocol = parsedSiteUrl.protocol;
  url.hostname = parsedSiteUrl.hostname;
  url.port = '';
  url.hash = '';
  return url.toString();
};

/** Prevent a staging build from ever serving the public hostname. */
export const hasUnsafeSeoConfiguration = (url: URL) =>
  isCanonicalHost(url) && !isProductionSeo;
