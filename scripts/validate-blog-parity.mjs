import { createClient, OAuthStrategy } from '@wix/sdk';
import { posts } from '@wix/blog';

const clientId = process.env.PUBLIC_WIX_CLIENT_ID;
if (!clientId) throw new Error('PUBLIC_WIX_CLIENT_ID is required.');

const wix = createClient({
  modules: { posts },
  auth: OAuthStrategy({ clientId })
});

const slugs = [
  'what-happens-to-your-scrap-car-battery-after-you-sell-your-car',
  'tubeless-tyres-vs-tube-tyres-in-uae-key-differences-explained',
  'what-to-do-when-your-car-starts-overheating',
  'how-scrapping-old-cars-helps-reduce-carbon-emissions-in-the-uae',
  'how-is-technology-reshaping-car-scrapping-in-the-uae-1',
  'recognizing-the-top-5-signs-of-transmission-failure',
  'can-you-scrap-a-car-without-the-mulkiya-in-the-uae',
  'how-to-sell-a-non-gcc-car-in-dubai-and-get-a-fair-cash-price',
  'what-to-do-with-an-old-electric-car-in-the-uae-best-practices-for-selling-or-scrapping-your-ev',
  'best-ways-for-scrapping-old-cars-in-dubai-a-step-by-step-process-by-scrap-my-car-uae'
];

function countTypes(richContent) {
  const counts = {};
  const walk = (node) => {
    if (!node) return;
    if (node.type) counts[node.type] = (counts[node.type] || 0) + 1;
    for (const child of node.nodes ?? []) walk(child);
  };
  for (const node of richContent?.nodes ?? []) walk(node);
  return counts;
}

function seoValue(post, kind) {
  const tags = post?.seoData?.tags ?? [];
  if (kind === 'title') {
    return tags.find((t) => t.type === 'title' && !t.disabled)?.children ?? '';
  }
  if (kind === 'description') {
    return tags.find(
      (t) => t.type === 'meta' && t.props?.name === 'description' && !t.disabled
    )?.props?.content ?? '';
  }
  return '';
}

let failed = 0;

for (const slug of slugs) {
  try {
    const result = await wix.posts.getPostBySlug(slug, {
      fieldsets: ['URL', 'SEO', 'RICH_CONTENT', 'CONTENT_TEXT']
    });
    const post = result.post;

    if (!post) {
      failed++;
      console.log(`FAIL  ${slug} — post not returned`);
      continue;
    }

    const counts = countTypes(post.richContent);
    const required = {
      title: Boolean(post.title),
      slug: post.slug === slug,
      content: Boolean(post.richContent?.nodes?.length || post.contentText),
      seoTitle: Boolean(seoValue(post, 'title') || post.title),
      metaDescription: Boolean(seoValue(post, 'description') || post.excerpt),
      cover: Boolean(post.media?.wixMedia?.image || post.heroImage)
    };

    const missing = Object.entries(required)
      .filter(([, ok]) => !ok)
      .map(([key]) => key);

    if (missing.length) {
      failed++;
      console.log(`FAIL  ${slug} — missing: ${missing.join(', ')}`);
    } else {
      console.log(`PASS  ${slug}`);
      console.log(`      nodes: ${Object.entries(counts).map(([k,v]) => `${k}=${v}`).join(', ')}`);
    }
  } catch (error) {
    failed++;
    console.log(`FAIL  ${slug} — ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log('');
console.log(`Validation complete: ${slugs.length - failed}/${slugs.length} passed.`);

if (failed > 0) {
  process.exitCode = 1;
}
