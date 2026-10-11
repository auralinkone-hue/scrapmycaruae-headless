import { canonicalUrl } from './seo';
import { asTrimmedString } from './wix-seo-values';

type WixSeoTag = {
  type?: string;
  children?: string;
  disabled?: boolean;
  props?: Record<string, unknown>;
};

type WixSeoData = { tags?: WixSeoTag[] };

type WixSeoItem = {
  slug?: string;
  seoData?: WixSeoData;
  title?: string;
  excerpt?: string;
};

const findTag = (tags: WixSeoTag[], predicate: (tag: WixSeoTag) => boolean) =>
  tags.find((tag) => !tag.disabled && predicate(tag));

const stringProp = (tag: WixSeoTag | undefined, key: string) => {
  const value = tag?.props?.[key];
  return asTrimmedString(value);
};

/** Keeps Wix Blog SEO authoritative while enforcing the current environment host. */
export function getWixPostSeo(post: WixSeoItem) {
  const rawTags = post.seoData?.tags;
  const tags = Array.isArray(rawTags) ? rawTags : [];
  const title = asTrimmedString(findTag(tags, (tag) => tag.type === 'title')?.children);
  const description = stringProp(
    findTag(tags, (tag) => tag.type === 'meta' && String(tag.props?.name).toLowerCase() === 'description'),
    'content'
  );
  const canonicalTag = stringProp(
    findTag(tags, (tag) => tag.type === 'link' && String(tag.props?.rel).toLowerCase() === 'canonical'),
    'href'
  );
  const robots = stringProp(
    findTag(tags, (tag) => tag.type === 'meta' && String(tag.props?.name).toLowerCase() === 'robots'),
    'content'
  ).toLowerCase();

  let canonicalPath = `/post/${post.slug ?? ''}`;
  if (canonicalTag) {
    try {
      const candidate = new URL(canonicalTag, 'https://www.scrapmycaruae.com');
      // Reject malformed CMS canonicals that would merge an article into an unrelated page.
      if (candidate.pathname.startsWith('/post/')) canonicalPath = candidate.pathname;
    } catch {
      // The stable /post/{slug} fallback remains valid.
    }
  }

  return {
    title: title || post.title || 'Scrap My Car UAE',
    description: description || post.excerpt || '',
    canonical: canonicalUrl(canonicalPath),
    noindex: robots.split(',').map((value) => value.trim()).includes('noindex')
  };
}
