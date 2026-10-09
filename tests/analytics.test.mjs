import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('GTM is the conditional-only analytics loader', async () => {
  const layout = await readProjectFile('src/layouts/BaseLayout.astro');

  assert.match(layout, /PUBLIC_ANALYTICS_ENABLED === 'true'/);
  assert.match(layout, /www\.googletagmanager\.com\/gtm\.js\?id=/);
  assert.match(layout, /googletagmanager\.com\/ns\.html\?id=/);
  assert.doesNotMatch(layout, /gtag\/js/);
});

test('development deployment keeps analytics disabled while retaining the GTM container', async () => {
  const workflow = await readProjectFile('.github/workflows/deploy-development-preview.yml');

  assert.match(workflow, /^\s*PUBLIC_GTM_ID:\s*GTM-TFQ7BDGX\s*$/m);
  assert.match(workflow, /^\s*PUBLIC_ANALYTICS_ENABLED:\s*["']false["']\s*$/m);
});

test('quote analytics follow the successful CMS response and precede WhatsApp navigation', async () => {
  const form = await readProjectFile('src/components/QuoteForm.astro');
  const success = form.indexOf('if (!response.ok || !result.ok || !result.whatsappUrl)');
  const lead = form.indexOf("track('generate_lead'");
  const handoff = form.indexOf("track('whatsapp_handoff'");
  const redirect = form.indexOf('window.location.assign(result.whatsappUrl)');

  assert.ok(success < lead);
  assert.ok(lead < handoff);
  assert.ok(handoff < redirect);
  assert.doesNotMatch(form, /requestId/);
});

test('analytics helper limits browser event parameters to non-PII values', async () => {
  const helper = await readProjectFile('src/scripts/analytics.ts');

  assert.match(helper, /const allowedParams = \['form_name', 'cta_location', 'destination_type'\]/);
  assert.doesNotMatch(helper, /customerName|requestId|email_address|phone_number/i);
});
