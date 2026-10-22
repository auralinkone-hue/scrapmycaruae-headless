export interface ArticleServiceLink {
  href: string;
  anchor: string;
  context: string;
}

// Explicit Phase 3 report rows 1, 2, 5, 6, 7, 11 and 12 only.
// Template-level guidance; never inserted into or saved over Wix article content.
export const articleServiceLinks: Readonly<Record<string, ArticleServiceLink>> = {
  'how-much-is-my-scrap-car-worth-in-2025-uae-pricing-explained': {
    href: '/scrap-car-value/',
    anchor: 'Understand scrap-car value in the UAE',
    context: 'Assessing your own car? See how vehicle details, condition and collection access affect an individual valuation.'
  },
  'before-scrapping-how-to-deregister-your-car-in-uae': {
    href: '/scrap-my-car/',
    anchor: 'Explore scrap-car valuation and collection',
    context: 'Alongside your paperwork checks, explore the next steps for a damaged, non-running or end-of-life vehicle.'
  },
  'car-scrapping-rules-you-should-know-if-you-live-in-abu-dhabi-or-sharjah': {
    href: '/locations/abu-dhabi/',
    anchor: 'Abu Dhabi vehicle valuation and collection',
    context: 'For a car located in Abu Dhabi, the local guide explains which vehicle and parking-access details to share. It does not replace official registration requirements.'
  },
  'how-to-prepare-your-car-for-scrapping-in-dubai': {
    href: '/locations/dubai/',
    anchor: 'Dubai scrap-car valuation and collection',
    context: 'Preparing for the next step in Dubai? Review the local guide to vehicle condition, parking position and collection access.'
  },
  'imple-steps-to-sell-your-scrap-car-in-uae-for-the-best-price': {
    href: '/scrap-my-car/',
    anchor: 'Request a scrap-car valuation',
    context: 'Apply the guide to your own vehicle: explore the assessment process before deciding how to proceed with an unwanted or damaged car.'
  },
  'selling-a-car-with-a-faulty-engine-in-the-uae-your-options': {
    href: '/sell-car-with-engine-problems/',
    anchor: 'Selling a car with engine problems',
    context: 'Considering an as-is sale? See which known engine symptoms, vehicle details and collection information are useful for an assessment.'
  },
  'how-to-sell-a-car-with-gearbox-problems-scrap-my-car-uae': {
    href: '/sell-car-with-gearbox-problems/',
    anchor: 'Selling a car with gearbox problems',
    context: 'If a gearbox fault is affecting your next decision, review the details to share about the transmission, vehicle mobility and collection access.'
  }
};

/** Uses only already-rendered Wix HTML. Suppress a second contextual link when
 * the original body already links to this service, including URL/slash variants.
 */
export function getArticleServiceLink(slug: string, articleHtml: string): ArticleServiceLink | null {
  if (!Object.hasOwn(articleServiceLinks, slug)) return null;
  const link = articleServiceLinks[slug];
  const anchors = articleHtml.matchAll(/<a\b[^>]*?\s+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi);
  for (const match of anchors) {
    try {
      const url = new URL((match[1] ?? match[2] ?? match[3]).replaceAll('&amp;', '&'), 'https://www.scrapmycaruae.com');
      if (['https:', 'http:'].includes(url.protocol) &&
          ['www.scrapmycaruae.com', 'scrapmycaruae.com'].includes(url.hostname) &&
          url.pathname.replace(/\/+$/, '') === link.href.replace(/\/+$/, '')) return null;
    } catch { /* A malformed article link is not a matching destination. */ }
  }
  return link;
}
