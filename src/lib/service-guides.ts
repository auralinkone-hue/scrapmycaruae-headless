import { wixClient } from './wix';

// Established protected Wix articles selected for each existing service's intent.
// These are service → guide recommendations, not edits to the articles themselves.
export const serviceGuideSlugs = {
  'sell-my-car': [
    'how-to-sell-your-scrap-car-in-the-uae-in-2025-a-complete-guide',
    'scrap-or-sell-the-ultimate-decision-guide-for-dubai-car-owners',
    'selling-your-damaged-vehicle-in-the-uae-expert-advice-and-proven-tips'
  ],
  'scrap-my-car': [
    'imple-steps-to-sell-your-scrap-car-in-uae-for-the-best-price',
    'before-scrapping-how-to-deregister-your-car-in-uae',
    'how-much-is-my-scrap-car-worth-in-2025-uae-pricing-explained'
  ],
  'sell-damaged-car': [
    'selling-your-damaged-vehicle-in-the-uae-expert-advice-and-proven-tips',
    'can-you-sell-a-car-with-deployed-airbags',
    'selling-a-car-with-a-faulty-engine-in-the-uae-your-options'
  ],
  'sell-accident-damaged-car': [
    'can-you-sell-a-car-with-deployed-airbags',
    'selling-your-damaged-vehicle-in-the-uae-expert-advice-and-proven-tips',
    'how-much-is-my-scrap-car-worth-in-2025-uae-pricing-explained'
  ],
  'sell-non-running-car': [
    'who-will-take-your-non-running-car-in-the-uae-fast-solutions-you-should-know',
    'selling-a-car-with-a-faulty-engine-in-the-uae-your-options',
    'how-to-sell-a-car-with-gearbox-problems-scrap-my-car-uae'
  ],
  'sell-car-with-engine-problems': [
    'selling-a-car-with-a-faulty-engine-in-the-uae-your-options',
    'who-will-take-your-non-running-car-in-the-uae-fast-solutions-you-should-know',
    'how-much-is-my-scrap-car-worth-in-2025-uae-pricing-explained'
  ],
  'sell-car-with-gearbox-problems': [
    'how-to-sell-a-car-with-gearbox-problems-scrap-my-car-uae',
    'who-will-take-your-non-running-car-in-the-uae-fast-solutions-you-should-know',
    'selling-your-damaged-vehicle-in-the-uae-expert-advice-and-proven-tips'
  ]
} as const;

type ServiceGuideKey = keyof typeof serviceGuideSlugs;
type WixPost = Record<string, any>;

function renderableGuide(post: WixPost | null | undefined): post is WixPost {
  if (!post || typeof post._id !== 'string' || !post._id.trim() ||
      typeof post.title !== 'string' || !post.title.trim()) return false;
  const tags = post.seoData?.tags;
  return !Array.isArray(tags) || !tags.some((tag) => {
    if (!tag || tag.disabled) return false;
    const name = String(tag.name ?? tag.props?.name ?? '').toLowerCase();
    const content = String(tag.content ?? tag.props?.content ?? '').toLowerCase();
    return ['robots', 'googlebot'].includes(name) && /\bnoindex\b/.test(content);
  });
}

/** One bounded query replaces the previous newest-post query. No fallback fetch,
 * pagination, rich-content retrieval, caching changes or synthetic article data.
 * Missing/unpublished/noindexed guides leave fewer cards, as the UI already supports.
 */
export async function getServiceGuidePosts(service: ServiceGuideKey): Promise<WixPost[]> {
  if (!Object.hasOwn(serviceGuideSlugs, service)) return [];
  const slugs = serviceGuideSlugs[service];
  try {
    const result = await wixClient.posts
      .queryPosts({ fieldsets: ['SEO'] })
      .hasSome('slug', [...slugs])
      .limit(slugs.length)
      .find();
    const items: WixPost[] = Array.isArray(result.items) ? result.items : [];
    const selected: WixPost[] = [];
    for (const slug of slugs) {
      const post = items.find((candidate) => renderableGuide(candidate) && candidate.slug === slug &&
        !selected.some((guide) => guide._id === candidate._id));
      if (post) selected.push(post);
    }
    return selected;
  } catch {
    // Optional editorial content must not prevent the service/form from rendering.
    return [];
  }
}
