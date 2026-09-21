import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const host = url.hostname.toLowerCase();
  const isPreview =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.workers.dev');

  const body = isPreview
    ? [
        'User-agent: *',
        'Disallow: /',
        ''
      ].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        'Sitemap: https://www.scrapmycaruae.com/sitemap.xml',
        ''
      ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
