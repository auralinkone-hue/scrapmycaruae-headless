import { asIsoDate } from './wix-post-values.ts';

// Existing public identity in SiteHeader, SiteFooter and Contact Us. No inferred
// legal name, office coordinates, opening hours, social profiles or review claims.
export const businessIdentity = {
  name: 'Scrap My Car UAE',
  url: 'https://www.scrapmycaruae.com/',
  telephone: '+971557458322',
  email: 'info@scrapmycaruae.com',
  logo: 'https://static.wixstatic.com/media/ff8df3_ee2506a8a7ed4752b5b7832449c71105~mv2.png'
} as const;
export const defaultSocialImage = '/sections/scrap-car-pickup-dubai.webp';
export const defaultSocialImageAlt = 'Illustration of a used car prepared for collection in Dubai';
const organizationId = `${businessIdentity.url}#organization`;
const websiteId = `${businessIdentity.url}#website`;
const absolute = (path: string) => new URL(path, businessIdentity.url).href;
const organizationReference = () => ({
  '@type': 'Organization', '@id': organizationId, name: businessIdentity.name, url: businessIdentity.url,
  logo: { '@type': 'ImageObject', url: businessIdentity.logo }
});
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export function homepageIdentitySchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        ...organizationReference(), telephone: businessIdentity.telephone, email: businessIdentity.email,
        contactPoint: {
          '@type': 'ContactPoint', contactType: 'customer support',
          telephone: businessIdentity.telephone, email: businessIdentity.email, url: absolute('/contact-us/')
        },
        areaServed: { '@type': 'Country', name: 'United Arab Emirates' }
      },
      {
        '@type': 'WebSite', '@id': websiteId, name: businessIdentity.name,
        url: businessIdentity.url, inLanguage: 'en', publisher: { '@id': organizationId }
      }
    ]
  };
}

const servicePages: Record<string, { name: string; description: string }> = {
  '/sell-my-car/': { name: 'Sell My Car', description: 'Vehicle valuation and collection guidance for selling a car in the UAE.' },
  '/scrap-my-car/': { name: 'Scrap My Car', description: 'Scrap-car valuation and collection guidance in the UAE.' }
};
export function serviceSchemaForPath(pathname: string) {
  const path = pathname.replace(/\/$/, '') + '/';
  const service = servicePages[path];
  return service ? {
    '@context': 'https://schema.org', '@type': 'Service', '@id': absolute(path) + '#service',
    ...service, url: absolute(path), provider: organizationReference(),
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' }
  } : null;
}

const webUrl = (value: string | undefined) => {
  try {
    const url = new URL(value || '');
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
};
export interface ArticleSchemaInput {
  canonical: string;
  headline: string;
  description: string;
  publishedDate: Date | string | null;
  updatedDate: Date | string | null;
  image?: string;
  author?: { name: string; slug: string; photoUrl: string } | null;
}
export function blogPostingSchema(input: ArticleSchemaInput) {
  const author = input.author;
  const authorUrl = author?.slug ? absolute(`/author/${encodeURIComponent(author.slug)}`) : '';
  const authorImage = webUrl(author?.photoUrl);
  const image = webUrl(input.image);
  return {
    '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': input.canonical + '#article',
    headline: input.headline, description: input.description, mainEntityOfPage: input.canonical,
    datePublished: asIsoDate(input.publishedDate) || undefined,
    dateModified: asIsoDate(input.updatedDate) || asIsoDate(input.publishedDate) || undefined,
    image: image ? [image] : undefined,
    // The public Wix byline is authoritative. Do not fabricate an absent author.
    author: author?.name ? {
      '@type': /^SMC UAE Team$/i.test(author.name) ? 'Organization' : 'Person',
      name: author.name, ...(authorUrl ? { '@id': authorUrl + '#author', url: authorUrl } : {}),
      ...(authorImage ? { image: authorImage } : {})
    } : undefined,
    publisher: organizationReference(), isPartOf: { '@id': websiteId }
  };
}
