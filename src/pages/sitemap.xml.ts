import type { APIRoute } from 'astro';
import { wixClient } from '../lib/wix';
import { isIndexableRequest, siteUrl } from '../lib/seo';

export const prerender = false;

const staticUrls = [
  '/',
  '/free-quote',
  '/contact-us',
  '/faqs',
  '/blogs',
  '/terms-conditions',
  '/privay-policy'
];

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function getAllPosts() {
  const tokens = await wixClient.auth.generateVisitorTokens();
  const accessToken = tokens.accessToken?.value;

  if (!accessToken) {
    throw new Error('Could not generate a Wix visitor access token.');
  }

  const posts: Array<{
    slug?: string;
    lastPublishedDate?: string;
    firstPublishedDate?: string;
  }> = [];

  let cursor: string | undefined;

  do {
    const response = await fetch('https://www.wixapis.com/v3/posts/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: accessToken
      },
      body: JSON.stringify({
        fieldsets: ['URL'],
        query: {
          cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 },
          sort: [{ fieldName: 'firstPublishedDate', order: 'DESC' }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Wix Blog sitemap query failed: ${response.status}`);
    }

    const data = await response.json();
    posts.push(...(data.posts ?? []));
    cursor = data.pagingMetadata?.cursors?.next;
  } while (cursor);

  return posts;
}

export const GET: APIRoute = async ({ url }) => {
  if (!isIndexableRequest(url)) {
    return new Response('Preview sitemap disabled.', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    });
  }

  let posts: Awaited<ReturnType<typeof getAllPosts>> = [];

  try {
    posts = await getAllPosts();
  } catch (error) {
    console.error('Could not load blog posts for sitemap', error);
  }

  const staticEntries = staticUrls
    .map((path) => {
      const loc = path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`;
      return `  <url><loc>${escapeXml(loc)}</loc></url>`;
    })
    .join('\n');

  const postEntries = posts
    .filter((post) => post.slug)
    .map((post) => {
      const loc = `${siteUrl}/post/${post.slug}`;
      const lastmod = post.lastPublishedDate || post.firstPublishedDate;
      const lastmodTag = lastmod
        ? `<lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>`
        : '';
      return `  <url><loc>${escapeXml(loc)}</loc>${lastmodTag}</url>`;
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    staticEntries,
    postEntries,
    '</urlset>',
    ''
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
