// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { loadEnv } from 'vite';
import stagingAssetHeaders from './scripts/staging-asset-headers.mjs';

const seoEnvironment = String(process.env.PUBLIC_SEO_ENV || loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_').PUBLIC_SEO_ENV || 'staging').trim().toLowerCase();

export default defineConfig({
  session: false,
  integrations: [stagingAssetHeaders(seoEnvironment)],

  adapter: cloudflare({
    imageService: 'compile',
    prerenderEnvironment: 'node'
  })
});