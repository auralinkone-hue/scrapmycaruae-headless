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
export const readBlogArchivePostsResponse = (result: WixBlogPostsResponse) => {
  const posts = Array.isArray(result.posts) ? result.posts : [];
  const totalCount = typeof result.pagingMetadata?.total === 'number'
    ? result.pagingMetadata.total
    : posts.length;

  return { posts, totalCount };
};
