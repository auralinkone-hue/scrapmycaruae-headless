const base = process.env.PREVIEW_URL || 'http://localhost:4321';

const routes = [
  '/',
  '/free-quote',
  '/contact-us',
  '/faqs',
  '/blogs',
  '/terms-conditions',
  '/privay-policy',
  '/privacy-policy',
  '/robots.txt'
];

let failed = false;

for (const route of routes) {
  try {
    const response = await fetch(new URL(route, base), {
      redirect: 'manual'
    });

    const allowed =
      response.ok ||
      (route === '/privacy-policy' && response.status === 301);

    console.log(
      `${allowed ? 'PASS' : 'FAIL'} ${response.status} ${route}`
    );

    if (!allowed) failed = true;

    const robots = response.headers.get('x-robots-tag');
    if (base.includes('workers.dev') && route !== '/privacy-policy') {
      if (!robots?.includes('noindex')) {
        console.log(`FAIL missing X-Robots-Tag noindex on ${route}`);
        failed = true;
      }
    }
  } catch (error) {
    console.log(`FAIL ${route}: ${error instanceof Error ? error.message : error}`);
    failed = true;
  }
}

if (failed) process.exit(1);
