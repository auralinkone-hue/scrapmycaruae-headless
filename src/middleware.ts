import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);

  const host = context.url.hostname.toLowerCase();
  const isPreview =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.workers.dev');

  if (isPreview) {
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
});
