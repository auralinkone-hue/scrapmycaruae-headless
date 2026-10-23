/** A Wix outage must not advertise an existing resource as permanently missing. */
export function blogLoadErrorStatus(error: unknown): 404 | 503 {
  if (typeof error !== 'object' || error === null) return 503;
  const value = error as { status?: unknown; details?: { applicationError?: { code?: unknown } } };
  if (value.status !== undefined) return value.status === 404 ? 404 : 503;
  return value.details?.applicationError?.code === 'POST_NOT_FOUND' ? 404 : 503;
}
