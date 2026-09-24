import { canonicalUrl } from './seo';
import { wixClient } from './wix';

export interface BlogCategoryBreadcrumb {
  label: string;
  href: string;
}

export interface BlogBreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

const categoryRoute = (slug: string) =>
  `/blogs/category/${encodeURIComponent(slug)}`;

const asCategoryId = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value : null;

/**
 * Resolves a category directly from Wix. The returned URL is served by the
 * matching category landing page in src/pages/blogs/category/[slug].astro.
 * Missing, incomplete, and placeholder categories deliberately fall back to
 * the category-free breadcrumb.
 */
export async function getPostCategoryBreadcrumb(post: {
  categoryIds?: unknown;
}): Promise<BlogCategoryBreadcrumb | null> {
  if (!Array.isArray(post.categoryIds)) {
    return null;
  }

  const categoryId = post.categoryIds.map(asCategoryId).find(Boolean);
  if (!categoryId) return null;

  try {
    const { category } = await wixClient.categories.getCategory(categoryId);
    const label = category?.label?.trim();
    const slug = category?.slug?.trim();

    if (!label || !slug || label.toLowerCase() === 'uncategorized') return null;

    return {
      label,
      href: categoryRoute(slug)
    };
  } catch {
    return null;
  }
}

export function getArticleBreadcrumbItems(
  articleTitle: string,
  articleHref: string,
  category: BlogCategoryBreadcrumb | null
): BlogBreadcrumbItem[] {
  const items: BlogBreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Blogs', href: '/blogs' }
  ];

  if (category) items.push(category);

  items.push({
    label: articleTitle,
    href: articleHref,
    current: true
  });

  return items;
}

export function getBreadcrumbJsonLd(items: BlogBreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: canonicalUrl(item.href)
    }))
  };
}
