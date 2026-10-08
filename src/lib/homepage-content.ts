import { wixClient } from './wix';
import { normalizeWixImage } from './wix-image';

const QUERY_URL = 'https://www.wixapis.com/data/v2/items/query';
const FRESH_CACHE_TTL_MS = 5 * 60 * 1000;
const EDGE_RETENTION_SECONDS = 24 * 60 * 60;
const EDGE_CACHE_KEY = new Request('https://homepage-content-cache.invalid/v1/content');

type CmsData = Record<string, unknown>;

export type HomeItem = {
  title: string;
  description: string;
  icon: string;
  image: string;
  imageAlt: string;
  imageDecorative: boolean;
  buttonLabel: string;
  buttonLink: string;
  sortOrder: number;
  isVisible: boolean;
  group: string;
  value: string;
  number: string;
  isOpenByDefault: boolean;
  question: string;
  answer: string;
  quote: string;
  author: string;
  rating: number;
  name: string;
  slug: string;
};

export type HomepageContent = {
  page: CmsData;
  settings: CmsData;
  badges: HomeItem[];
  faqs: HomeItem[];
  reviews: HomeItem[];
  popularMakes: HomeItem[];
  stats: HomeItem[];
  steps: HomeItem[];
};

const pageDefaults: CmsData = {
  title: 'Scrap My Car UAE | Free Quote & Collection - Dubai',
  description: 'Scrap My Car offers unbeatable prices & free scrap car valuation and collection service across all UAE locations. Obtaining a scrap car valuation has never been easier – simply share your name and contact number, and our expert car valuation team will reach out to you Shortly.',
  heroVisible: true,
  heroEyebrow: 'Scrap car buyers across the UAE',
  heroHeading: 'Sell your car.',
  heroHeadingAccent: 'Skip the hassle.',
  heroDescription: 'Get a free car valuation. Collection across the UAE.',
  heroPrimaryButtonLabel: 'Get Your Vehicle Price',
  heroPrimaryButtonLink: '#valuation',
  heroSecondaryButtonLabel: 'WhatsApp Us',
  heroSecondaryButtonLink: 'https://api.whatsapp.com/send?phone=%2B971557458322',
  makesVisible: true,
  makesHeading: 'Popular makes we buy',
  makesButtonLabel: 'WhatsApp Us',
  makesButtonLink: 'https://api.whatsapp.com/send?phone=%2B971557458322',
  benefitsVisible: true,
  benefitsKicker: 'Why Scrap My Car UAE',
  benefitsHeading: 'A simpler way to move on from your car.',
  benefitsDescription: 'One straightforward process from valuation request to vehicle collection.',
  processVisible: true,
  processKicker: 'How it works',
  processHeading: 'From vehicle details to collection in three clear steps.',
  processDescription: 'No classified ads, no endless buyer messages and no separate towing arrangement.',
  processButtonLabel: 'Start your valuation',
  processButtonLink: '#valuation',
  conditionsVisible: true,
  conditionsKicker: 'We buy more than perfect cars',
  conditionsHeading: 'Your car can still have value even when it has problems.',
  conditionsDescription: 'We assess cars with mechanical faults, electrical problems, accident damage, expired registration and other issues.',
  conditionsImage: '',
  conditionsImageAlt: 'Cars in different conditions, including damaged vehicles',
  conditionsImageDecorative: false,
  conditionsButtonLabel: 'Get a Free Valuation',
  conditionsButtonLink: '#valuation',
  valueVisible: true,
  valueKicker: 'Easy. Fast. Fair.',
  valueHeading: 'Designed around the way people actually want to sell a car.',
  coverageVisible: true,
  coverageKicker: 'UAE vehicle collection',
  coverageHeading: 'Wherever your car is, start with the same simple form.',
  coverageDescription: 'Scrap My Car UAE serves customers across Dubai and other major UAE locations.',
  coverageImage: '',
  coverageImageAlt: 'UAE vehicle collection coverage map',
  coverageImageDecorative: false,
  testimonialsVisible: true,
  testimonialsKicker: 'A straightforward service',
  testimonialsHeading: 'Less chasing. More clarity.',
  testimonialsDescription: 'Start online, speak directly with the team, and keep the whole vehicle-sale process simple.',
  blogVisible: true,
  blogKicker: 'Latest guides',
  blogHeading: 'Useful advice for UAE car owners.',
  blogButtonLabel: 'View all blogs',
  blogButtonLink: '/blogs',
  faqVisible: true,
  faqKicker: 'Common questions',
  faqHeading: 'What customers usually want to know.',
  faqDescription: 'Need something else? Message our team directly on WhatsApp.',
  faqButtonLabel: 'Ask on WhatsApp',
  faqButtonLink: 'https://api.whatsapp.com/send?phone=%2B971557458322',
  finalVisible: true,
  finalKicker: 'Ready when you are',
  finalHeading: 'Tell us which car you want to sell.',
  finalDescription: 'Choose your make, model and year to start your free valuation.',
  finalPrimaryButtonLabel: 'Get Your Vehicle Price',
  finalPrimaryButtonLink: '#valuation',
  finalSecondaryButtonLabel: 'WhatsApp',
  finalSecondaryButtonLink: 'https://api.whatsapp.com/send?phone=%2B971557458322'
};

const settingsDefaults: CmsData = {
  siteName: 'Scrap My Car UAE',
  phoneNumber: '0557458322',
  whatsappNumber: '971557458322',
  whatsappUrl: 'https://api.whatsapp.com/send?phone=%2B971557458322'
};

const badgeDefaults: HomeItem[] = [
  { group: 'heroProof', title: 'Free valuation', description: '', icon: 'ph-seal-check', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 1, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'heroProof', title: 'UAE-wide collection', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 2, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'heroProof', title: 'Any condition', description: '', icon: 'ph-car-profile', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 3, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'benefits', title: 'Any condition', description: 'Old, accident-damaged, non-running, high-mileage or mechanically faulty cars.', icon: 'ph-car-profile', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 1, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'benefits', title: 'Free collection', description: 'We arrange vehicle collection across Dubai, Sharjah and the wider UAE.', icon: 'ph-truck', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 2, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'benefits', title: 'Straightforward paperwork', description: 'A simple handover process with guidance on the details needed to complete the sale.', icon: 'ph-file-text', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 3, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'benefits', title: 'Direct support', description: 'Call or WhatsApp our team when you need help with your valuation or collection.', icon: 'ph-chats-circle', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 4, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'conditions', title: 'Non-running cars', description: 'We buy non-running cars across Dubai and the UAE, including vehicles that will not start or need recovery.', icon: 'ph-engine', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 1, isVisible: true, value: '', number: '', isOpenByDefault: true, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'conditions', title: 'Engine or gearbox faults', description: 'Request a valuation for cars with engine trouble, transmission faults or major mechanical issues.', icon: 'ph-gear-six', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 2, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'conditions', title: 'Accident-damaged cars', description: 'We assess accident-damaged vehicles in any condition and can arrange collection where needed.', icon: 'ph-warning-octagon', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 3, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'conditions', title: 'Electrical issues', description: 'Cars with electrical faults, warning lights or battery-related problems can still be submitted.', icon: 'ph-lightning', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 4, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'conditions', title: 'High-mileage vehicles', description: 'High mileage does not prevent a fair valuation. Share your vehicle details and condition first.', icon: 'ph-gauge', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 5, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'conditions', title: 'Expired Mulkiya', description: 'You can still ask about selling a car with expired Mulkiya; our team will explain the handover details.', icon: 'ph-calendar-x', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 6, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'conditions', title: 'Old cars', description: 'Older cars can still have value. We consider the make, model, year and overall condition.', icon: 'ph-clock-counter-clockwise', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 7, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'conditions', title: 'Running cars', description: 'We also buy running cars when you want a straightforward sale and UAE-wide collection.', icon: 'ph-car-profile', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 8, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'locations', title: 'Dubai', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 1, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'locations', title: 'Sharjah', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 2, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'locations', title: 'Abu Dhabi', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 3, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'locations', title: 'Ajman', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 4, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'locations', title: 'Ras Al Khaimah', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 5, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'locations', title: 'Fujairah', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 6, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'locations', title: 'Al Ain', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 7, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'locations', title: 'Umm Al Quwain', description: '', icon: 'ph-map-pin', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 8, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'testimonialProof', title: 'Online valuation request', description: '', icon: 'ph-clipboard-text', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 1, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'testimonialProof', title: 'Direct WhatsApp support', description: '', icon: 'ph-whatsapp-logo', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 2, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { group: 'testimonialProof', title: 'Collection arranged for you', description: '', icon: 'ph-truck', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 3, isVisible: true, value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' }
];

const stepDefaults: HomeItem[] = [
  { title: 'Choose your vehicle', description: 'Select the make, model and year from our vehicle database.', icon: 'ph-steering-wheel', number: '01', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 1, isVisible: true, group: '', value: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { title: 'Get your valuation', description: 'Add your name and WhatsApp number and send your request to our team.', icon: 'ph-chat-circle-dots', number: '02', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 2, isVisible: true, group: '', value: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { title: 'Arrange collection', description: 'If you accept the offer, we arrange the vehicle handover and collection.', icon: 'ph-truck', number: '03', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 3, isVisible: true, group: '', value: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' }
];

const statDefaults: HomeItem[] = [
  { value: '01', title: 'Easy', description: 'Select your vehicle and send one short request. No long listing process.', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 1, isVisible: true, group: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { value: '02', title: 'Fast', description: 'Your details go directly to the team handling valuations and collections.', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 2, isVisible: true, group: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { value: '03', title: 'Fair', description: 'Your vehicle is assessed using its actual make, model, year and condition.', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: 3, isVisible: true, group: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0, name: '', slug: '' }
];

const faqDefaults: HomeItem[] = [
  { question: 'Do you buy cars that are not running?', answer: 'Yes. We assess non-running cars as well as vehicles with engine, gearbox, electrical or accident damage.', isOpenByDefault: true, sortOrder: 1, isVisible: true, title: '', description: '', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', group: '', value: '', number: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { question: 'Is vehicle collection free?', answer: 'Free vehicle collection is available as part of our service across supported UAE locations.', isOpenByDefault: false, sortOrder: 2, isVisible: true, title: '', description: '', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', group: '', value: '', number: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { question: 'Can I request a valuation for a car with expired Mulkiya?', answer: 'Yes. Cars with expired Mulkiya can still be submitted for valuation. Our team can explain the required handover details for your situation.', isOpenByDefault: false, sortOrder: 3, isVisible: true, title: '', description: '', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', group: '', value: '', number: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { question: 'What information do I need to get a quote?', answer: 'Choose the vehicle make, model and year, then enter your name and mobile number so our team can contact you about the valuation.', isOpenByDefault: false, sortOrder: 4, isVisible: true, title: '', description: '', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', group: '', value: '', number: '', quote: '', author: '', rating: 0, name: '', slug: '' },
  { question: 'Which areas do you cover?', answer: 'We serve customers across Dubai and the UAE, including Sharjah, Abu Dhabi, Ajman, Ras Al Khaimah, Fujairah, Al Ain and Umm Al Quwain.', isOpenByDefault: false, sortOrder: 5, isVisible: true, title: '', description: '', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', group: '', value: '', number: '', quote: '', author: '', rating: 0, name: '', slug: '' }
];

const reviewDefaults: HomeItem[] = [
  'Quick valuation and a professional collection process.',
  'Simple form, clear communication and no unnecessary chasing.',
  'They handled the collection smoothly from start to finish.',
  'A straightforward way to sell a car with problems.',
  'The team explained the next step clearly and kept it easy.'
].map((quote, index) => ({ title: '', description: '', icon: '', image: '', imageAlt: '', imageDecorative: true, buttonLabel: '', buttonLink: '', sortOrder: index + 1, isVisible: true, group: '', value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote, author: 'Customer feedback', rating: 5, name: '', slug: '' }));

const makeDefaults: HomeItem[] = [
  { name: 'Honda', slug: 'honda', image: '', imageAlt: '', imageDecorative: true, icon: '/brands/honda.svg', sortOrder: 1 },
  { name: 'Toyota', slug: 'toyota', image: '', imageAlt: '', imageDecorative: true, icon: '/brands/toyota.svg', sortOrder: 2 },
  { name: 'Mercedes', slug: 'mercedes', image: '', imageAlt: '', imageDecorative: true, icon: '/brands/mercedes.svg', sortOrder: 3 },
  { name: 'Nissan', slug: 'nissan', image: '', imageAlt: '', imageDecorative: true, icon: '/brands/nissan.svg', sortOrder: 4 }
].map((item) => ({ ...item, title: '', description: '', buttonLabel: '', buttonLink: '', isVisible: true, group: '', value: '', number: '', isOpenByDefault: false, question: '', answer: '', quote: '', author: '', rating: 0 }));

const fallback: HomepageContent = {
  page: pageDefaults,
  settings: settingsDefaults,
  badges: badgeDefaults,
  faqs: faqDefaults,
  reviews: reviewDefaults,
  popularMakes: makeDefaults,
  stats: statDefaults,
  steps: stepDefaults
};

type CachedHomepage = {
  cachedAt: number;
  value: HomepageContent;
};

let cached: CachedHomepage | undefined;
let inFlight: Promise<HomepageContent> | undefined;

function normalizeCmsImage(value: unknown) {
  if (typeof value === 'string') return normalizeWixImage(value);
  if (value && typeof value === 'object' && 'url' in value) {
    const url = (value as { url?: unknown }).url;
    return normalizeWixImage(typeof url === 'string' ? url : '');
  }
  return '';
}

function coerceItem(data: CmsData): HomeItem {
  return {
    title: String(data.title ?? ''), description: String(data.description ?? ''), icon: String(data.icon ?? ''), image: normalizeCmsImage(data.image), imageAlt: String(data.imageAlt ?? ''), imageDecorative: Boolean(data.imageDecorative), buttonLabel: String(data.buttonLabel ?? ''), buttonLink: String(data.buttonLink ?? ''), sortOrder: Number(data.sortOrder ?? 9999), isVisible: data.isVisible !== false, group: String(data.group ?? ''), value: String(data.value ?? ''), number: String(data.number ?? ''), isOpenByDefault: Boolean(data.isOpenByDefault), question: String(data.question ?? ''), answer: String(data.answer ?? ''), quote: String(data.quote ?? ''), author: String(data.author ?? ''), rating: Number(data.rating ?? 0), name: String(data.name ?? ''), slug: String(data.slug ?? '')
  };
}

async function queryCollection(accessToken: string, dataCollectionId: string) {
  const response = await fetch(QUERY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: accessToken },
    body: JSON.stringify({ dataCollectionId, query: { paging: { limit: 1000, offset: 0 } } })
  });
  if (!response.ok) throw new Error(`Wix CMS query failed for ${dataCollectionId}: ${response.status}`);
  const result = await response.json();
  return (result.dataItems ?? []).map((item: { data?: CmsData }) => item.data ?? {});
}

function ordered(items: HomeItem[]) {
  return items.filter((item) => item.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizePageImages(page: CmsData): CmsData {
  return {
    ...page,
    conditionsImage: normalizeCmsImage(page.conditionsImage),
    coverageImage: normalizeCmsImage(page.coverageImage)
  };
}

function isFresh(entry: CachedHomepage) {
  return Date.now() - entry.cachedAt < FRESH_CACHE_TTL_MS;
}

async function readEdgeCache(): Promise<CachedHomepage | undefined> {
  if (typeof caches === 'undefined') return undefined;

  try {
    const response = await caches.default.match(EDGE_CACHE_KEY);
    if (!response) return undefined;
    const entry = await response.json() as CachedHomepage;
    return entry?.cachedAt && entry.value ? entry : undefined;
  } catch (error) {
    console.warn('Homepage edge cache read failed.', error);
    return undefined;
  }
}

async function writeEdgeCache(entry: CachedHomepage) {
  if (typeof caches === 'undefined') return;

  try {
    await caches.default.put(
      EDGE_CACHE_KEY,
      new Response(JSON.stringify(entry), {
        headers: {
          'Content-Type': 'application/json',
          // Freshness is managed in the envelope; retention enables stale-on-error.
          'Cache-Control': `public, s-maxage=${EDGE_RETENTION_SECONDS}`
        }
      })
    );
  } catch (error) {
    console.warn('Homepage edge cache write failed.', error);
  }
}

async function fetchHomepageContent(): Promise<HomepageContent> {
  const tokens = await wixClient.auth.generateVisitorTokens();
  const accessToken = tokens.accessToken?.value;
  if (!accessToken) throw new Error('Could not generate a Wix visitor access token.');

  const [pageRows, settingsRows, badgeRows, faqRows, reviewRows, makeRows, statRows, stepRows] = await Promise.all([
    queryCollection(accessToken, 'HomePage'),
    queryCollection(accessToken, 'SiteSettings'),
    queryCollection(accessToken, 'HomeBadges'),
    queryCollection(accessToken, 'HomeFAQs'),
    queryCollection(accessToken, 'HomeReviews'),
    queryCollection(accessToken, 'HomePopularMakes'),
    queryCollection(accessToken, 'HomeStats'),
    queryCollection(accessToken, 'HomeSteps')
  ]);

  return {
    page: normalizePageImages({ ...pageDefaults, ...(pageRows[0] ?? {}) }),
    settings: { ...settingsDefaults, ...(settingsRows[0] ?? {}) },
    badges: badgeRows.length ? ordered(badgeRows.map(coerceItem)) : badgeDefaults,
    faqs: faqRows.length ? ordered(faqRows.map(coerceItem)) : faqDefaults,
    reviews: reviewRows.length ? ordered(reviewRows.map(coerceItem)) : reviewDefaults,
    popularMakes: makeRows.length ? ordered(makeRows.map(coerceItem)) : makeDefaults,
    stats: statRows.length ? ordered(statRows.map(coerceItem)) : statDefaults,
    steps: stepRows.length ? ordered(stepRows.map(coerceItem)) : stepDefaults
  };
}

/**
 * The single server-side source for homepage CMS content. Cloudflare's native
 * cache is the production cache shared by Worker isolates at the edge. The
 * small process cache is only a local optimisation and development fallback.
 */
export async function getHomepageContent(): Promise<HomepageContent> {
  if (cached && isFresh(cached)) return cached.value;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const edgeEntry = await readEdgeCache();
    if (edgeEntry && isFresh(edgeEntry)) {
      cached = edgeEntry;
      return edgeEntry.value;
    }

    try {
      const value = await fetchHomepageContent();
      const entry = { cachedAt: Date.now(), value };
      cached = entry;
      await writeEdgeCache(entry);
      return value;
    } catch (error) {
      if (edgeEntry) {
        console.warn('Homepage CMS refresh failed; serving stale edge content.', error);
        cached = edgeEntry;
        return edgeEntry.value;
      }
      if (cached) {
        console.warn('Homepage CMS refresh failed; serving last known process content.', error);
        return cached.value;
      }
      console.error('Homepage CMS loader failed; serving the verified fallback content.', error);
      return fallback;
    } finally {
      inFlight = undefined;
    }
  })();

  return inFlight;
}
