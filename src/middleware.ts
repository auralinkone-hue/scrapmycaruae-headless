import { defineMiddleware } from 'astro:middleware';
import { hasUnsafeSeoConfiguration, isIndexableRequest, robotsContent } from './lib/seo';

export const onRequest = defineMiddleware(async (context, next) => {
  if (hasUnsafeSeoConfiguration(context.url)) {
    return new Response('Production host is receiving a staging SEO configuration.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Cache-Control': 'no-store'
      }
    });
  }

  const response = await next();
  const headers = new Headers(response.headers);

  headers.set(
    'X-Robots-Tag',
    isIndexableRequest(context.url)
      ? 'index, follow'
      : `${robotsContent(context.url)}, noarchive`
  );

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
});
