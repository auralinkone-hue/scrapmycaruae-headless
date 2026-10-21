import { readFile, writeFile } from 'node:fs/promises';

// Development CI only. No database is created, migrated or contacted here.
const databaseId = process.env.QUOTE_NOTIFICATIONS_DATABASE_ID?.trim();
if (databaseId) {
  if (process.env.GITHUB_REF !== 'refs/heads/development' || process.env.PUBLIC_SEO_ENV !== 'staging' || process.env.WIX_QUOTE_REQUESTS_COLLECTION_ID !== 'QuoteRequestsStaging') {
    throw new Error('Notification binding configuration is restricted to development staging.');
  }
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(databaseId)) throw new Error('Invalid notification database ID.');
  const configPath = new URL('../wrangler.jsonc', import.meta.url);
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  config.d1_databases = [...(config.d1_databases || []).filter(db => db.binding !== 'QUOTE_NOTIFICATIONS_DB'), {
    binding: 'QUOTE_NOTIFICATIONS_DB', database_name: 'smc-quote-notifications-staging', database_id: databaseId,
    migrations_dir: 'migrations/quote-notifications'
  }];
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  console.info('Configured the development notification ledger binding.');
} else {
  console.info('Notification ledger not configured; email delivery remains unavailable.');
}
