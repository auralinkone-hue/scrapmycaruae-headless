import { wixClient } from './wix';

const MAX_RELATED_POSTS = 3;
const CANDIDATE_LIMIT = 8;

type WixPost = Record<string, any>;

function values(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function hasNoindexDirective(post: WixPost): boolean {
  const tags = post?.seoData?.tags;
  if (!Array.isArray(tags)) return false;

  return tags.some((tag) => {
    const name = String(tag?.name ?? tag?.props?.name ?? '').toLowerCase();
    const content = String(tag?.content ?? tag?.props?.content ?? '').toLowerCase();
    return name === 'robots' && content.includes('noindex');
  });
}

function isValidPost(post: WixPost, currentPost: WixPost): boolean {
  if (!post?._id || !post?.slug || !post?.title) return false;
  if (post._id === currentPost._id || post.slug === currentPost.slug) return false;
  return !hasNoindexDirective(post);
}

function addCandidates(
  selected: WixPost[],
  candidates: WixPost[] | undefined,
  currentPost: WixPost,
): void {
  for (const candidate of candidates ?? []) {
    if (selected.length >= MAX_RELATED_POSTS) return;
    if (!isValidPost(candidate, currentPost)) continue;
    if (selected.some((post) => post._id === candidate._id || post.slug === candidate.slug)) continue;
    selected.push(candidate);
  }
}

async function findPosts(
  configure: (query: any) => any,
): Promise<WixPost[]> {
  try {
    const result = await configure(
      wixClient.posts
        .queryPosts({ fieldsets: ['SEO'] })
        .descending('firstPublishedDate')
        .limit(CANDIDATE_LIMIT),
    ).find();
    return result.items ?? [];
  } catch {
    // A matching facet can be unavailable while Wix content is being updated.
    // Other deterministic sources below can still provide useful results.
    return [];
  }
}

/**
 * Builds a small, deterministic set of public Wix posts. Each query is capped
 * at eight records: no complete blog collection is fetched for an article.
 */
export async function getRelatedPosts(currentPost: WixPost): Promise<WixPost[]> {
  const selected: WixPost[] = [];
  const categoryIds = values(currentPost.categoryIds);
  const tagIds = values(currentPost.tagIds);
  const topics = values(currentPost.hashtags);

  if (categoryIds.length) {
    addCandidates(
      selected,
      await findPosts((query) => query.hasSome('categoryIds', categoryIds)),
      currentPost,
    );
  }

  if (selected.length < MAX_RELATED_POSTS && tagIds.length) {
    addCandidates(
      selected,
      await findPosts((query) => query.hasSome('tagIds', tagIds)),
      currentPost,
    );
  }

  // Wix hashtags are the existing topic metadata exposed on a post. They are
  // used only when category/tag matches have not filled the recommendation set.
  if (selected.length < MAX_RELATED_POSTS && topics.length) {
    addCandidates(
      selected,
      await findPosts((query) => query.hasSome('hashtags', topics)),
      currentPost,
    );
  }

  if (selected.length < MAX_RELATED_POSTS) {
    addCandidates(selected, await findPosts((query) => query), currentPost);
  }

  return selected;
}
