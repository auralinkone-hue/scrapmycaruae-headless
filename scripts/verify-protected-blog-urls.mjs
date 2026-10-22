import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export function retryDelayMs(attempt, retryAfter, now = Date.now()) {
  const seconds = Number(retryAfter);
  const headerDelay = retryAfter ? (Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - now) : 0;
  return Math.max(attempt === 1 ? 2000 : 8000, Number.isFinite(headerDelay) ? headerDelay : 0);
}

export function classifyAttempt(attempt) {
  if (attempt.error) return /403|forbidden|tunnel|proxy/i.test(attempt.error) ? 'network-access-blocked' : 'network-error';
  if (attempt.status === 200) return attempt.articlePresent ? 'article-ok' : 'unexpected-200-body';
  if (attempt.status === 404) return 'not-found-unconfirmed';
  if (/Worker exceeded resource limits/i.test(attempt.title || '')) return 'worker-resource-limit';
  if (attempt.status === 503) return 'temporarily-unavailable';
  if (attempt.status === 403 && /1010|cloudflare|forbidden/i.test(attempt.responseSample || '')) return 'edge-access-blocked';
  return 'http-error';
}

export async function runAudit({ base, paths, output, concurrency = 3, spacingMs = 750, maxAttempts = 3 }) {
  const target = new URL(base);
  if (target.origin !== 'https://smc-headless-worker.hussain-gscx.workers.dev') throw new Error('This audit is restricted to the development staging Worker.');
  const startedAt = new Date().toISOString();
  const results = [];
  let nextIndex = 0;
  let nextStart = 0;
  let gate = Promise.resolve();
  let consecutiveBlocks = 0;
  let stoppedForAccess = false;
  const pace = () => {
    const wait = gate.then(async () => {
      await delay(Math.max(0, nextStart - Date.now()));
      nextStart = Date.now() + spacingMs;
    });
    gate = wait.catch(() => {});
    return wait;
  };
  const snapshot = async (complete = false) => {
    const finalStatuses = {};
    for (const row of results) finalStatuses[row.finalStatus ?? 'network-error'] = (finalStatuses[row.finalStatus ?? 'network-error'] || 0) + 1;
    const successful = results.filter(row => row.outcome === 'first-attempt-success' || row.outcome === 'recovered-on-retry').length;
    const report = { base: target.origin, startedAt, finishedAt: complete ? new Date().toISOString() : null,
      settings: { concurrency, spacingMs, maxAttempts, timeoutMs: 30000, maximumRetryWaitMs: 120000 },
      summary: { planned: paths.length, completed: results.length, successful, finalStatuses,
        recoveredOnRetry: results.filter(row => row.outcome === 'recovered-on-retry').length,
        unresolved: results.filter(row => !['first-attempt-success', 'recovered-on-retry'].includes(row.outcome)).map(row => row.path),
        untested: paths.filter(path => !results.some(row => row.path === path)), stoppedForAccess,
        passed: complete && successful === paths.length }, results: [...results].sort((a, b) => a.path.localeCompare(b.path)) };
    await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
    return report;
  };
  // Serialize checkpoint writes so parallel workers cannot overwrite newer results.
  let checkpoint = Promise.resolve();
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (nextIndex < paths.length && !stoppedForAccess) {
      const path = paths[nextIndex++];
      const attempts = [];
      const began = performance.now();
      for (let number = 1; number <= maxAttempts; number++) {
        await pace();
        const started = performance.now();
        let record;
        try {
          const response = await fetch(new URL(path, target), { redirect: 'manual', signal: AbortSignal.timeout(30000) });
          const body = await response.text();
          record = { number, at: new Date().toISOString(), status: response.status, responseMs: Math.round(performance.now() - started),
            retryAfter: response.headers.get('retry-after'), cacheControl: response.headers.get('cache-control'), cloudflareRay: response.headers.get('cf-ray'),
            articlePresent: /<article\b[^>]*class=["'][^"']*\barticle-content\b/i.test(body),
            canonical: body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || '',
            title: body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '' };
          if (response.status === 403) record.responseSample = body.slice(0, 200);
        } catch (error) {
          record = { number, at: new Date().toISOString(), status: null, responseMs: Math.round(performance.now() - started),
            error: `${error.name}: ${error.message}${error.cause?.message ? `; ${error.cause.message}` : ''}` };
        }
        record.classification = classifyAttempt(record);
        attempts.push(record);
        if (record.classification.includes('access-blocked')) {
          consecutiveBlocks++;
          if (consecutiveBlocks >= 3) stoppedForAccess = true;
          break;
        }
        consecutiveBlocks = 0;
        if (record.classification === 'article-ok' || number === maxAttempts || stoppedForAccess) break;
        const waitMs = retryDelayMs(number, record.retryAfter);
        if (waitMs > 120000) { record.retrySkipped = 'Retry-After exceeds bounded audit wait'; break; }
        record.waitBeforeRetryMs = waitMs;
        await delay(waitMs);
      }
      const last = attempts.at(-1);
      results.push({ path, finalStatus: last.status, totalMs: Math.round(performance.now() - began), attempts,
        outcome: last.classification === 'article-ok' ? attempts.length === 1 ? 'first-attempt-success' : 'recovered-on-retry' : last.classification });
      checkpoint = checkpoint.then(() => snapshot());
      await checkpoint;
      if (results.length % 10 === 0 || path === paths.at(-1)) console.log(`${results.length}/${paths.length}: ${path} -> ${last.status ?? last.classification} (${attempts.length} attempt(s))`);
    }
  }));
  await checkpoint;
  const report = await snapshot(true);
  console.log(JSON.stringify(report.summary));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const phase = process.argv.includes('--failed') ? 'failed' : 'all';
  const manifest = await fs.readFile('docs/seo-migration/protected-wix-blog-url-manifest.txt', 'utf8');
  const evidence = JSON.parse(await fs.readFile('docs/qa/prelaunch-2026-10-22-evidence.json', 'utf8'));
  const paths = phase === 'failed' ? evidence.initialCrawl.protectedFailures
    : manifest.split('\n').filter(line => line.startsWith('https://')).map(line => new URL(line).pathname);
  const output = process.env.BLOG_AUDIT_OUTPUT || `docs/qa/blog-url-recheck-2026-10-22-${phase}.json`;
  const report = await runAudit({ base: 'https://smc-headless-worker.hussain-gscx.workers.dev', paths, output });
  if (!report.summary.passed) process.exitCode = 1;
}
