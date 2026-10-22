import { readFile, writeFile } from 'node:fs/promises';

export function addStagingNoindexHeaders(existing, environment) {
  if (environment === 'production') return existing;
  if (environment !== 'staging') throw new Error('Invalid SEO environment for asset headers.');
  return `${existing.trimEnd()}\n\n/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n`.trimStart();
}

/** Static HTML bypasses Worker middleware; protect it at the asset layer too. */
export default function stagingAssetHeaders(environment) {
  return {
    name: 'smc-staging-asset-headers',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        if (environment === 'production') return;
        const file = new URL('./_headers', dir);
        const existing = await readFile(file, 'utf8').catch(error => {
          if (error.code === 'ENOENT') return '';
          throw error;
        });
        await writeFile(file, addStagingNoindexHeaders(existing, environment));
      }
    }
  };
}
