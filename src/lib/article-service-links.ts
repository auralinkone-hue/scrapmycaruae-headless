export interface ArticleServiceLink {
  href: string;
  anchor: string;
  context: string;
}

// Explicit Phase 3 report rows approved in Batches 2–5 only.
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
  },
  "scrap-or-sell-the-ultimate-decision-guide-for-dubai-car-owners": {
    href: "/locations/dubai/",
    anchor: "Sell or scrap your car in Dubai",
    context: "Deciding what to do with your own car in Dubai? Review vehicle condition and collection-access details before requesting an individual assessment."
  },
  "the-step-by-step-guide-to-scrapping-a-car-legally-in-the-uae": {
    href: "/scrap-my-car/",
    anchor: "Start a scrap-car valuation enquiry",
    context: "For the commercial next step, review the valuation and collection process. An enquiry does not replace official deregistration or ownership requirements; confirm current procedures with the relevant authority."
  },
  "value-of-scrap-cars-in-the-uae-market": {
    href: "/scrap-car-value/",
    anchor: "Understand your scrap car’s value",
    context: "Apply the market discussion to your own vehicle: review how identity, condition, usable parts and collection access affect an individual assessment. Historical price examples are not an offer for your car."
  },
  "regional-hotspots-for-car-scrapping-in-the-uae": {
    href: "/locations/",
    anchor: "UAE vehicle-collection locations",
    context: "Compare the UAE service-area guides for your vehicle location and collection access. These describe coverage areas, not business branches; discuss access and arrangements for your specific car."
  },
  "scrap-car-laws-in-dubai-what-every-owner-should-know-in-2025": {
    href: "/locations/dubai/",
    anchor: "Dubai vehicle valuation and collection",
    context: "For a vehicle located in Dubai, review the practical details to share for valuation and collection. Confirm current legal and registration requirements with the relevant authority separately."
  },
  "selling-your-damaged-vehicle-in-the-uae-expert-advice-and-proven-tips": {
    href: "/sell-damaged-car/",
    anchor: "Sell a damaged car in the UAE",
    context: "Considering an as-is sale? Review which known faults, damage photos and vehicle-access details to share for a damaged-car assessment."
  },
  "car-scrapping-laws-you-must-follow-in-dubai-and-sharjah": {
    href: "/locations/sharjah/",
    anchor: "Sharjah vehicle valuation and collection",
    context: "If your vehicle is located in Sharjah, review the local valuation and collection guide. This covers practical service details, not legal clearance; confirm current Sharjah requirements with the relevant authority."
  },
  'how-long-can-you-keep-a-non-registered-car-in-dubai-before-it-s-fined': {
    href: '/sell-car-with-expired-registration/',
    anchor: 'Valuation with expired registration',
    context: 'If your car was previously registered and that registration has expired, review the vehicle-status and paperwork details for a valuation enquiry. This guidance is not for never-registered vehicles and does not replace current authority requirements.'
  },
  'how-to-deregister-and-scrap-your-old-car-in-the-uae-in-2026-a-complete-guide': {
    href: '/scrap-old-car/',
    anchor: 'Compare options for your old car',
    context: 'Considering the next step for an old car after reviewing deregistration? Explore assessment and collection considerations before deciding how to proceed. Confirm current paperwork requirements with the relevant authority.'
  },
  'old-cars-new-value-how-dubai-s-scrap-car-industry-works': {
    href: '/locations/dubai/',
    anchor: 'Dubai scrap-car valuation',
    context: 'Apply the Dubai industry overview to your own vehicle: review the condition, parking location and collection-access details to share for an individual assessment.'
  },
  'get-the-best-price-for-your-scrap-car-in-dubai': {
    href: '/scrap-car-value/',
    anchor: 'Factors affecting your scrap-car valuation',
    context: 'When comparing quotes, review how vehicle details, usable parts, condition and collection access affect an individual assessment. A valuation enquiry does not guarantee the highest price.'
  },
  'a-step-by-step-guide-to-scrapping-your-car-in-dubai-with-scrap-my-car-uae': {
    href: '/locations/dubai/',
    anchor: 'Scrapping your car in Dubai',
    context: 'Planning collection for a car in Dubai? Review which vehicle, parking-position and access details to share before agreeing arrangements. Confirm current deregistration requirements separately with the relevant authority.'
  },
  'car-inspection-failure-in-the-uae-essential-steps-to-take-after-failing-the-test': {
    href: '/scrap-my-car/',
    anchor: 'Compare repair, sale and scrap options',
    context: 'A failed inspection alone does not require scrapping. If repair estimates make keeping the car uneconomic, review the scrap-car assessment process alongside repair or sale options before deciding.'
  },
  'how-scrap-car-pickup-works-in-the-uae-what-to-expect-on-collection-day': {
    href: '/car-removal/',
    anchor: 'Vehicle collection and access guidance',
    context: 'Preparing for collection day? Review how keys, steering, wheels, parking restrictions and loading access affect removal planning. Share any access limits before agreeing collection arrangements.'
  },
  'who-will-take-your-non-running-car-in-the-uae-fast-solutions-you-should-know': {
    href: '/sell-non-running-car/',
    anchor: 'Non-running car valuation and collection',
    context: 'For a car that will not start or move, review the known faults, available keys and collection-access details to share for an assessment. Collection arrangements depend on the vehicle and its location.'
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
