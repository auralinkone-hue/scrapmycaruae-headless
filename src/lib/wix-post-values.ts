import { asTrimmedString } from './wix-seo-values.ts';

/** Wix Blog data is external input; malformed optional values must not abort SSR. */
export { asTrimmedString };

export const asFiniteNumber = (value: unknown, fallback = 0) => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const asPositiveNumber = (value: unknown, fallback = 0) => {
  const number = asFiniteNumber(value);
  return number > 0 ? number : fallback;
};

export const asValidDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const asIsoDate = (value: unknown) => asValidDate(value)?.toISOString() || '';

export const asSafeArticleSlug = (value: unknown) => {
  const slug = asTrimmedString(value);
  return slug && !slug.includes('/') && !slug.includes('\\') ? slug : '';
};

export const asSafeText = (value: unknown, fallback = '') => asTrimmedString(value) || fallback;

export type WixMedia = { url?: unknown; altText?: unknown; width?: unknown; height?: unknown };

export const asWixMedia = (value: unknown): WixMedia | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as WixMedia : null;

export const isRenderableRelatedPost = (post: unknown): post is Record<string, unknown> => {
  if (!post || typeof post !== 'object' || Array.isArray(post)) return false;
  const candidate = post as Record<string, unknown>;
  return Boolean(asSafeArticleSlug(candidate.slug) && asTrimmedString(candidate.title));
};
