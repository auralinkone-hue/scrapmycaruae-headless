type Operation = 'post-by-slug' | 'archive-categories' | 'archive-posts' | 'category-by-slug' | 'category-posts' | 'author-by-slug' | 'author-posts';
type RouteType = 'article' | 'archive' | 'category' | 'author';
type Classification = 'not_found' | 'rate_limited' | 'authorization' | 'upstream_http' | 'timeout' | 'aborted' | 'network' | 'invalid_json' | 'malformed_response' | 'unknown';
type FailureEvent = {
  event: 'blog_load_failure'; operation: Operation; routeType: RouteType;
  responseStatus: number | null; upstreamStatus: number | null;
  durationMs: number | null; classification: Classification;
};
const operations = new Set(['post-by-slug', 'archive-categories', 'archive-posts', 'category-by-slug', 'category-posts', 'author-by-slug', 'author-posts']);
const routes = new Set(['article', 'archive', 'category', 'author']);
const malformedMessages = new Set([
  'Malformed Wix article response.', 'Malformed Wix category response.',
  'Malformed Wix category articles response.', 'Malformed Wix archive categories.',
  'Malformed Wix archive post list.', 'Malformed Wix archive pagination data.',
  'Malformed Wix archive article data.', 'Malformed Wix author response.',
  'Malformed Wix author query response.'
]);
const httpStatus = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 599 ? value : null;

function failureDetails(error: unknown): { upstreamStatus: number | null; classification: Classification } {
  if (!error || typeof error !== 'object') return { upstreamStatus: null, classification: 'unknown' };
  const value = error as {
    status?: unknown; response?: { status?: unknown; data?: { details?: { applicationError?: { code?: unknown } } } };
    details?: { applicationError?: { code?: unknown } }; name?: unknown; message?: unknown;
    cause?: { code?: unknown };
  };
  const upstreamStatus = httpStatus(value.status === undefined ? value.response?.status : value.status);
  let classification: Classification = 'unknown';
  if (upstreamStatus === 404) classification = 'not_found';
  else if (upstreamStatus === 429) classification = 'rate_limited';
  else if (upstreamStatus === 401 || upstreamStatus === 403) classification = 'authorization';
  else if (upstreamStatus !== null) classification = 'upstream_http';
  else if ((value.details?.applicationError?.code ?? value.response?.data?.details?.applicationError?.code) === 'POST_NOT_FOUND') classification = 'not_found';
  else if (value.name === 'TimeoutError' || ['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(String(value.cause?.code))) classification = 'timeout';
  else if (value.name === 'AbortError') classification = 'aborted';
  else if (['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(String(value.cause?.code)) ||
    (value.name === 'TypeError' && ['fetch failed', 'Failed to fetch'].includes(String(value.message)))) classification = 'network';
  else if (value.name === 'SyntaxError') classification = 'invalid_json';
  else if (malformedMessages.has(String(value.message))) classification = 'malformed_response';
  // Never serialize the error, message, cause, headers, URL, provider code or body.
  return { upstreamStatus, classification };
}

/** Failure-only, server-side diagnostics. Starting an operation never logs a success.
 * Logging is best-effort and cannot alter responses. Platform CPU/memory termination
 * can prevent any application log; use Cloudflare invocation outcomes for those.
 */
export function createBlogFailureDiagnostics({
  environment,
  sink = (event: FailureEvent): unknown => console.error(event),
  now = () => performance.now()
}: { environment?: string; sink?: (event: FailureEvent) => unknown; now?: () => number }) {
  return (operation: Operation, routeType: RouteType): ((error: unknown, responseStatus: number) => void) => {
    try {
      if (environment !== 'staging' || !operations.has(operation) || !routes.has(routeType)) return () => {};
      const started = now();
      return (error, responseStatus) => {
        try {
          const elapsed = now() - started;
          const event: FailureEvent = {
            event: 'blog_load_failure', operation, routeType,
            responseStatus: httpStatus(responseStatus), ...failureDetails(error),
            durationMs: Number.isFinite(elapsed) ? Math.max(0, Math.round(elapsed)) : null
          };
          // Also consume a rejected asynchronous sink without delaying rendering.
          void Promise.resolve(sink(event)).catch(() => {});
        } catch { /* Diagnostics must never affect page rendering or error policy. */ }
      };
    } catch { return () => {}; }
  };
}

// The Astro build fixes this server-only environment; missing/production is silent.
export const startBlogOperation = createBlogFailureDiagnostics({ environment: import.meta.env?.PUBLIC_SEO_ENV });
