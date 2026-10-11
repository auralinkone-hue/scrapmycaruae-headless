export type PostPageEnrichment<TAuthor = unknown, TCategory = unknown, TRelatedPost = unknown> = {
  author: TAuthor | null;
  categoryBreadcrumb: TCategory | null;
  relatedPosts: TRelatedPost[];
};

type EnrichmentLoaders<TAuthor, TCategory, TRelatedPost> = {
  loadAuthor: () => Promise<TAuthor | null>;
  loadCategoryBreadcrumb: () => Promise<TCategory | null>;
  loadRelatedPosts: () => Promise<TRelatedPost[]>;
};

/**
 * Author, category, and related-article data improve a post but are not part
 * of the article itself. A Wix enrichment outage must therefore never abort
 * SSR after the essential post record has been loaded successfully.
 */
export async function loadPostPageEnrichment<TAuthor, TCategory, TRelatedPost>(
  loaders: EnrichmentLoaders<TAuthor, TCategory, TRelatedPost>
): Promise<PostPageEnrichment<TAuthor, TCategory, TRelatedPost>> {
  const [author, categoryBreadcrumb, relatedPosts] = await Promise.allSettled([
    loaders.loadAuthor(),
    loaders.loadCategoryBreadcrumb(),
    loaders.loadRelatedPosts()
  ]);

  return {
    author: author.status === 'fulfilled' ? author.value : null,
    categoryBreadcrumb:
      categoryBreadcrumb.status === 'fulfilled' ? categoryBreadcrumb.value : null,
    relatedPosts: relatedPosts.status === 'fulfilled' ? relatedPosts.value : []
  };
}
