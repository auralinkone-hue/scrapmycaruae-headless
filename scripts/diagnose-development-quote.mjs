// Read-only incident diagnostics. Never emit raw provider logs, secret values or request bodies.
const worker = 'smc-headless-worker';
if (process.env.GITHUB_REF !== 'refs/heads/development') throw new Error('Development only.');
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !account) throw new Error('Cloudflare diagnostic credentials unavailable.');
const api = `https://api.cloudflare.com/client/v4/accounts/${account}/workers`;
async function read(url, body) {
  try {
    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000)
    });
    const result = await response.json();
    return { status: response.status, success: result.success, result: result.result,
      errorCodes: (result.errors || []).map(e => typeof e.code === 'number' ? e.code : null) };
  } catch (error) { return { error: error.name }; }
}
const settings = await read(`${api}/scripts/${worker}/settings`);
const bindings = settings.result?.bindings || [];
const names = ['QUOTE_EMAIL_MODE', 'BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME', 'QUOTE_NOTIFICATIONS_DB', 'WIX_QUOTE_REQUESTS_COLLECTION_ID', 'PUBLIC_WIX_CLIENT_ID', 'PUBLIC_SEO_ENV'];
const safeBindings = names.map(name => {
  const binding = bindings.find(b => b.name === name);
  const safeValues = name === 'QUOTE_EMAIL_MODE' ? ['off', 'staging-test', 'live']
    : name === 'WIX_QUOTE_REQUESTS_COLLECTION_ID' ? ['QuoteRequestsStaging', 'QuoteRequests']
    : name === 'PUBLIC_SEO_ENV' ? ['staging', 'production'] : [];
  return { name, present: !!binding, type: binding?.type,
    ...(safeValues.length && binding?.type === 'plain_text'
      ? { configuredValue: safeValues.includes(binding.text) ? binding.text : 'unexpected-value' } : {}) };
});
const timeframe = { from: Date.parse('2026-10-22T10:48:00Z'), to: Date.now() };
const query = await read(`${api}/observability/telemetry/query`, {
  queryId: 'staging-quote-incident-20261022', timeframe, view: 'events', dry: true, limit: 200,
  parameters: { filters: [{ key: '$metadata.service', type: 'string', operation: 'eq', value: worker }] }
});
const events = query.result?.events?.events || [];
const relevant = events.filter(event => {
  const text = JSON.stringify(event);
  return /\/api\/quote|Quote submission|Quote request insert|validation query failed|Quote email/.test(text);
});
function logCodes(text) {
  const codes = [];
  if (/Quote submission collection configuration is unavailable/.test(text)) codes.push('quote_collection_config_unavailable');
  if (/Could not generate Wix visitor token/.test(text)) codes.push('visitor_token_missing');
  for (const collection of ['VehicleMakes', 'VehicleModels', 'VehicleYears'])
    if (text.includes(`${collection} validation query failed`)) codes.push(`${collection}_validation_failed`);
  const insert = text.match(/Quote request insert failed:\s*(\d{3})/);
  if (insert) codes.push(`wix_insert_http_${insert[1]}`);
  if (/Quote submission failed/.test(text)) codes.push('quote_submission_failed');
  if (/Quote email scheduling unavailable/.test(text)) codes.push('email_schedule_unavailable');
  if (/Quote email unavailable/.test(text)) codes.push('email_unavailable');
  if (/Quote email rejected/.test(text)) codes.push('email_rejected');
  if (/exceededCpu|exceededMemory|Worker exceeded resource limits/.test(text)) codes.push('worker_resource_limit');
  return codes;
}
const safeEvents = relevant.map(event => {
  const source = event.source || {};
  const w = source.$workers || event.$workers || {};
  const m = event.$metadata || {};
  const req = w.event?.request || {};
  return { timestamp: event.timestamp || m.timestamp,
    status: w.event?.response?.status || m.statusCode,
    method: req.method,
    outcome: w.outcome,
    cpuTimeMs: w.cpuTimeMs,
    wallTimeMs: w.wallTimeMs,
    logCodes: logCodes(JSON.stringify(event)),
    sourceKeys: Object.keys(source).filter(k => !['headers', 'body', 'request'].includes(k)) };
});
console.log('DEVELOPMENT_QUOTE_DIAGNOSTICS ' + JSON.stringify({ worker,
  settings: { status: settings.status, success: settings.success, error: settings.error, errorCodes: settings.errorCodes,
    bindings: safeBindings, limits: settings.result?.limits, observability: settings.result?.observability },
  logs: { status: query.status, success: query.success, error: query.error, errorCodes: query.errorCodes,
    timeframe, returned: events.length, matched: relevant.length,
    total: query.result?.events?.count, events: safeEvents }
}));
