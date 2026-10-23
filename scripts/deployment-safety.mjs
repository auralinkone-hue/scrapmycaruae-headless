import { readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';

export const STAGING_WORKER = 'smc-headless-worker';
const ORIGIN = 'https://www.scrapmycaruae.com';
const fail = message => { throw new Error(`Deployment blocked: ${message}`); };

/** Pure configuration validation. No network, credentials or Cloudflare calls. */
export function validateDeployment(environment, env, targets, config) {
  if (!['staging', 'production'].includes(environment)) fail('explicit staging or production environment required.');
  const target = targets[environment];
  if (!target) fail('no owner-approved target exists for this environment.');
  if (environment === 'production' && !target.approvalReference?.trim()) fail('production target requires a recorded owner approval reference.');
  if (environment === 'staging' && (target.workerName !== STAGING_WORKER || target.configFile !== 'wrangler.jsonc')) fail('staging target must remain the existing preview Worker and config.');
  if (environment === 'production' && (target.workerName === STAGING_WORKER || target.configFile === targets.staging?.configFile)) fail('production must have a separate Worker and config.');
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(target.workerName || '')) fail('approved Worker name is invalid.');
  if (env.DEPLOYMENT_WORKER_NAME !== target.workerName || env.DEPLOYMENT_CONFIG_FILE !== target.configFile) fail('explicit target parameters must match the approval manifest.');
  if (env.PUBLIC_SEO_ENV !== environment) fail('SEO environment does not match the deployment target.');
  if (!['https://www.scrapmycaruae.com', 'https://www.scrapmycaruae.com/'].includes(env.PUBLIC_SITE_URL)) fail('canonical origin must be the existing production origin.');
  if (!/^[a-f0-9-]{36}$/i.test(env.PUBLIC_WIX_CLIENT_ID || '')) fail('explicit Wix client configuration required.');
  const collection = environment === 'staging' ? 'QuoteRequestsStaging' : 'QuoteRequests';
  if (env.WIX_QUOTE_REQUESTS_COLLECTION_ID !== collection) fail('quote collection must exactly match the deployment environment.');
  if (!['true', 'false'].includes(env.PUBLIC_ANALYTICS_ENABLED) || (environment === 'staging' && env.PUBLIC_ANALYTICS_ENABLED !== 'false')) fail('explicit analytics setting required; staging analytics must be disabled.');
  if (env.PUBLIC_ANALYTICS_ENABLED === 'true' && !/^GTM-[A-Z0-9]+$/.test(env.PUBLIC_GTM_ID || '')) fail('enabled analytics requires the existing GTM configuration.');
  if (env.GITHUB_REF && env.GITHUB_REF !== 'refs/heads/development') fail('this deployment pathway is restricted to development.');
  if (env.CLOUDFLARE_ENV || env.WRANGLER_ENV) fail('implicit named Wrangler environments are not supported.');
  if (config.name !== target.workerName || config.env && Object.keys(config.env).length) fail('Wrangler target must match explicitly, without named environment overrides.');
  if (environment === 'staging' && (config.route || config.routes?.length || config.zone_id)) fail('preview config must not attach domain routes.');
  for (const [key, expected] of Object.entries({ PUBLIC_SEO_ENV: environment, WIX_QUOTE_REQUESTS_COLLECTION_ID: collection, PUBLIC_SITE_URL: env.PUBLIC_SITE_URL, PUBLIC_ANALYTICS_ENABLED: env.PUBLIC_ANALYTICS_ENABLED })) {
    if (config.vars?.[key] !== undefined && config.vars[key] !== expected) fail('runtime vars conflict with validated build settings.');
  }
  return { ...target, environment, collection, origin: ORIGIN };
}

export function loadDeployment(environment, env = process.env, root = process.cwd()) {
  const targets = JSON.parse(readFileSync(resolve(root, 'deployment-targets.json'), 'utf8'));
  const file = targets[environment]?.configFile;
  if (!file || isAbsolute(file) || relative(root, resolve(root, file)).startsWith('..')) fail('approved repository-local config is required. Production is blocked until approved.');
  const config = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
  return validateDeployment(environment, env, targets, config);
}

/** Check the actual adapter output, not just the source configuration. */
export function verifyDeploymentBuild(plan, env = process.env, root = process.cwd()) {
  const generated = JSON.parse(readFileSync(resolve(root, 'dist/server/wrangler.json'), 'utf8'));
  const targets = JSON.parse(readFileSync(resolve(root, 'deployment-targets.json'), 'utf8'));
  validateDeployment(plan.environment, env, targets, generated);
  if (resolve(generated.userConfigPath || generated.configPath || '') !== resolve(root, plan.configFile)) fail('build was generated from a different Wrangler config.');
  const redirect = JSON.parse(readFileSync(resolve(root, '.wrangler/deploy/config.json'), 'utf8'));
  if (resolve(root, '.wrangler/deploy', redirect.configPath || '') !== resolve(root, 'dist/server/wrangler.json') || redirect.auxiliaryWorkers?.length) fail('unexpected generated deployment target.');
  const directive = plan.environment === 'staging' ? 'noindex,nofollow' : 'index,follow';
  for (const page of ['contact-us', 'faqs', 'terms-conditions']) {
    const html = readFileSync(resolve(root, `dist/client/${page}/index.html`), 'utf8');
    for (const name of ['robots', 'googlebot']) {
      if (!html.includes(`<meta name="${name}" content="${directive}"`)) fail('built indexing directives do not match target.');
    }
    if (!html.includes(`<link rel="canonical" href="${plan.origin}/${page}"`)) fail('built canonical origin changed.');
  }
  if (plan.environment === 'staging') {
    const headers = readFileSync(resolve(root, 'dist/client/_headers'), 'utf8');
    if (!headers.includes('X-Robots-Tag: noindex, nofollow, noarchive')) fail('built staging asset noindex protection missing.');
  }
}
