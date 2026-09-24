# Scrap My Car UAE Headless

## SEO environments

SEO behavior is controlled at build time:

- Staging and preview: `PUBLIC_SEO_ENV=staging`. Pages emit `noindex,nofollow`, `robots.txt` disallows all crawling, and the sitemap returns 404.
- Production: `PUBLIC_SEO_ENV=production` and `PUBLIC_SITE_URL=https://www.scrapmycaruae.com`. Canonical-host pages emit `index,follow`, `robots.txt` allows crawling, and the dynamic sitemap includes public pages plus every published Wix Blog post.

Use `npm run deploy` for production. It refuses to build or deploy unless both production SEO values are explicitly correct. Use `npm run deploy:staging` only for non-production preview deployments. A runtime guard also returns 503 if a staging build is ever served from the production hostname.
