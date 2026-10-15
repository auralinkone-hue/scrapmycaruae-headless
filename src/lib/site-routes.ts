/** Production route manifest verified against the live Wix site on 6 October 2026. */
export const indexableStaticRoutes = [
  '/',
  '/sell-my-car/',
  '/sell-damaged-car/',
  '/sell-accident-damaged-car/',
  '/sell-non-running-car/',
  '/sell-car-with-engine-problems/',
  '/scrap-my-car/',
  '/scrap-car-value/',
  '/car-removal/',
  '/free-quote',
  '/contact-us',
  '/faqs',
  '/blogs',
  '/author/smc-uae',
  '/terms-conditions',
  '/privacy-policy'
] as const;

/** Permanent, single-hop compatibility redirects. */
export const permanentRedirects = {
  '/blog': '/blogs',
  '/privay-policy': '/privacy-policy'
} as const;

