import type { APIRoute } from 'astro';
import { isIndexableRequest, siteUrl } from '../lib/seo';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const indexable = isIndexableRequest(url);
  const body = indexable
    ? `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
    : `User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': indexable ? 'public, max-age=3600' : 'no-store',
      'X-Robots-Tag': indexable ? 'index, follow' : 'noindex, nofollow, noarchive'
    }
  });
};
