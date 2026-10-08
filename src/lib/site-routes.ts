/** Production route manifest verified against the live Wix site on 6 October 2026. */
export const indexableStaticRoutes = [
  '/',
  '/free-quote',
  '/contact-us',
  '/faqs',
  '/blogs',
  '/terms-conditions',
  '/privacy-policy'
] as const;

/** Permanent, single-hop compatibility redirects. */
export const permanentRedirects = {
  '/blog': '/blogs',
  '/privay-policy': '/privacy-policy'
} as const;
