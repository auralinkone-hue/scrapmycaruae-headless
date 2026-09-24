const EXPECTED_PRODUCTION_URL = 'https://www.scrapmycaruae.com';

const seoEnvironment = String(process.env.PUBLIC_SEO_ENV || '')
  .trim()
  .toLowerCase();

if (seoEnvironment !== 'production') {
  throw new Error(
    'Production deployment stopped: PUBLIC_SEO_ENV must be explicitly set to "production".'
  );
}

let siteUrl;
try {
  siteUrl = new URL(String(process.env.PUBLIC_SITE_URL || ''));
} catch {
  throw new Error(
    `Production deployment stopped: PUBLIC_SITE_URL must be ${EXPECTED_PRODUCTION_URL}.`
  );
}

const normalizedSiteUrl = `${siteUrl.protocol}//${siteUrl.host}${siteUrl.pathname}`
  .replace(/\/$/, '');

if (normalizedSiteUrl !== EXPECTED_PRODUCTION_URL || siteUrl.search || siteUrl.hash) {
  throw new Error(
    `Production deployment stopped: PUBLIC_SITE_URL must be exactly ${EXPECTED_PRODUCTION_URL}.`
  );
}

console.log(`Production SEO verified for ${EXPECTED_PRODUCTION_URL}.`);
