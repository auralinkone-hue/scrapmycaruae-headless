// Read-only preview diagnostics. Never emit request headers, query strings or log bodies.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const worker = 'smc-headless-worker';
const base = 'https://smc-headless-worker.hussain-gscx.workers.dev';
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'tail', worker, '--format=json', '--method=GET'], { stdio: ['ignore', 'pipe', 'pipe'] });
const outcomes = [];
let buffer = '', depth = 0, quoted = false, escaped = false, exitCode = null;
child.on('exit', code => { exitCode = code; });
child.stderr.resume(); // Wrangler errors can contain account details; do not publish them.
child.stdout.setEncoding('utf8');
child.stdout.on('data', text => {
  for (const character of text) {
    if (depth === 0) { if (character !== '{') continue; buffer = ''; quoted = false; escaped = false; }
    buffer += character;
    if (quoted) { if (escaped) escaped = false; else if (character === '\\') escaped = true; else if (character === '"') quoted = false; }
    else if (character === '"') quoted = true;
    else if (character === '{') depth++;
    else if (character === '}') depth--;
    if (depth !== 0) continue;
    try {
      const event = JSON.parse(buffer);
      const url = new URL(event.event?.request?.url || base);
      if (url.origin !== base || !url.pathname.startsWith('/post/')) continue;
      outcomes.push({ path: url.pathname, outcome: event.outcome, status: event.event?.response?.status,
        cpuTime: event.cpuTime, wallTime: event.wallTime,
        exceptions: (event.exceptions || []).map(exception => ({ name: exception.name })) });
    } catch { /* Ignore non-event startup output. */ }
  }
});
await delay(4000);
const probes = [];
for (const slug of ['maximizing-your-car-s-resale-value-tips-and-tricks', 'maximizing-sales-strategies-for-selling-cars-in-the-uae-summer-heat', 'maximizing-the-return-uncovering-the-best-value-for-your-scrap-car', 'recognizing-the-top-5-signs-of-transmission-failure', 'imple-steps-to-sell-your-scrap-car-in-uae-for-the-best-price']) {
  const path = `/post/${slug}`;
  const start = performance.now();
  try {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(20000), redirect: 'manual' });
    await response.arrayBuffer();
    probes.push({ path, status: response.status, responseMs: Math.round(performance.now() - start), retryAfter: response.headers.get('retry-after') });
  } catch (error) { probes.push({ path, error: error.name }); }
  await delay(2000);
}
await delay(6000);
child.kill('SIGTERM');
console.log('DEVELOPMENT_BLOG_DIAGNOSTICS ' + JSON.stringify({ worker, base, tailEvents: outcomes.length, tailExitCode: exitCode, outcomes, probes }));
