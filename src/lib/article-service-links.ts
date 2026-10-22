export interface ArticleServiceLink {
  href: string;
  anchor: string;
  context: string;
}

// Explicit Phase 3 report rows approved in Batches 2 and 3 only.
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
  },
  'what-documents-do-you-need-to-scrap-your-car-in-the-uae': {
    href: '/scrap-my-car/#paperwork-title',
    anchor: 'Vehicle paperwork and status before scrapping',
    context: 'Planning the next step after the document checklist? Review vehicle paperwork and status before discussing a scrap-car valuation.'
  },
  'documents-needed-to-scrap-a-car-in-the-uae-in-2025-everything-you-should-know': {
    href: '/scrap-my-car/#paperwork-title',
    anchor: 'Check paperwork before your valuation',
    context: 'Use the paperwork guide to prepare the information you have available. Confirm current requirements with the relevant registration authority for your circumstances.'
  },
  'how-to-sell-your-scrap-car-in-the-uae-in-2025-a-complete-guide': {
    href: '/scrap-my-car/',
    anchor: 'Request a scrap-car valuation',
    context: 'Moving from the selling guide to your own car? Explore the valuation and collection process for an unwanted, damaged or non-running vehicle.'
  },
  'how-much-cash-can-you-get-for-a-scrap-car-in-dubai-scrap-my-car-uae': {
    href: '/locations/dubai/',
    anchor: 'Value a scrap car in Dubai',
    context: 'For your own vehicle in Dubai, share its details, condition and location for an individual assessment. Price examples are not a confirmed offer for your car.'
  },
  'car-scrapping-prices-in-uae-what-to-expect-in-2025': {
    href: '/scrap-car-value/',
    anchor: 'Scrap-car valuation factors',
    context: 'To put the price guide in context for your own car, review the vehicle, condition, usable-parts and collection factors behind an individual valuation.'
  },
  'can-you-sell-a-car-with-deployed-airbags': {
    href: '/sell-accident-damaged-car/',
    anchor: 'Accident-damaged car assessment',
    context: 'Considering a sale after airbag deployment? Review assessment and collection details for accident-damaged vehicles. A valuation enquiry does not establish that a car is safe to drive.'
  },
  'can-i-scrap-a-car-without-ownership-in-dubai': {
    href: '/scrap-my-car/#paperwork-title',
    anchor: 'Ownership and paperwork checks',
    context: 'A valuation enquiry does not bypass proof of ownership or authorisation. Review ownership and paperwork checks before discussing whether the vehicle can proceed.'
  }
};

/** Uses only already-rendered Wix HTML. Suppress a second contextual link when
 * the original body already links to this service, including URL/slash variants.
 */
export function getArticleServiceLink(slug: string, articleHtml: string): ArticleServiceLink | null {
  if (!Object.hasOwn(articleServiceLinks, slug)) return null;
  const link = articleServiceLinks[slug];
  const targetPath = new URL(link.href, 'https://www.scrapmycaruae.com').pathname.replace(/\/+$/, '');
  const anchors = articleHtml.matchAll(/<a\b[^>]*?\s+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi);
  for (const match of anchors) {
    try {
      const url = new URL((match[1] ?? match[2] ?? match[3]).replaceAll('&amp;', '&'), 'https://www.scrapmycaruae.com');
      if (['https:', 'http:'].includes(url.protocol) &&
          ['www.scrapmycaruae.com', 'scrapmycaruae.com'].includes(url.hostname) &&
          url.pathname.replace(/\/+$/, '') === targetPath) return null;
    } catch { /* A malformed article link is not a matching destination. */ }
  }
  return link;
}
