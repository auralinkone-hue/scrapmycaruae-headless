/** Production route manifest verified against the live Wix site on 6 October 2026. */
export const indexableStaticRoutes = [
  '/',
  '/sell-my-car/',
  '/sell-damaged-car/',
  '/sell-accident-damaged-car/',
  '/sell-non-running-car/',
  '/sell-car-with-engine-problems/',
  '/sell-car-with-gearbox-problems/',
  '/sell-flood-damaged-car/',
  '/sell-car-with-expired-registration/',
  '/scrap-my-car/',
  '/scrap-car-value/',
  '/car-removal/',
  '/scrap-old-car/',
  '/fleet-disposal/',
  '/locations/',
  '/locations/dubai/',
  '/locations/abu-dhabi/',
  '/locations/sharjah/',
  '/locations/ajman/',
  '/locations/ras-al-khaimah/',
  '/locations/al-ain/',
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

