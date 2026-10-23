type WixBlogPostsResponse = {
  posts?: unknown[];
  pagingMetadata?: {
    total?: number | null;
  } | null;
};

export const createBlogArchivePostsQuery = (
  page: number,
  pageSize: number,
  categoryId?: string
) => ({
  paging: {
    limit: pageSize,
    offset: (page - 1) * pageSize
  },
  sort: [
    {
      fieldName: 'firstPublishedDate',
      order: 'DESC'
    }
  ],
  ...(categoryId
    ? {
        filter: {
          categoryIds: {
            $hasSome: [categoryId]
          }
        }
      }
    : {})
});

/**
 * The installed Wix Blog public query response uses posts with
 * pagingMetadata.total; it is distinct from the query-builder find result.
 */
export const readBlogArchivePostsResponse = (result: unknown, categoryId?: string) => {
  const response = result as WixBlogPostsResponse | null;
  if (!Array.isArray(response?.posts)) throw new Error('Malformed Wix archive post list.');
  const posts = response.posts;
  const totalCount = response.pagingMetadata?.total;
  if (typeof totalCount !== 'number' || !Number.isSafeInteger(totalCount) || totalCount < posts.length) {
    throw new Error('Malformed Wix archive pagination data.');
  }
  for (const value of posts) {
    const post = value as { slug?: unknown; title?: unknown; categoryIds?: unknown } | null;
    if (!post || typeof post.slug !== 'string' || !post.slug.trim() ||
        typeof post.title !== 'string' || !post.title.trim() ||
        (post.categoryIds != null && !Array.isArray(post.categoryIds)) ||
        (categoryId && (!Array.isArray(post.categoryIds) || !post.categoryIds.includes(categoryId)))) {
      throw new Error('Malformed Wix archive article data.');
    }
  }

  return { posts, totalCount };
};
