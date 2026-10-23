/** A Wix outage must not advertise an existing resource as permanently missing. */
export function blogLoadErrorStatus(error: unknown): 404 | 503 {
  if (typeof error !== 'object' || error === null) return 503;
  type Details = { applicationError?: { code?: unknown } };
  const value = error as { status?: unknown; details?: Details; response?: { status?: unknown; data?: { details?: Details } } };
  // The installed Wix SDK wraps HTTP status in SDKError.response.status.
  const status = value.status === undefined ? value.response?.status : value.status;
  if (status !== undefined) return status === 404 ? 404 : 503;
  const code = value.details?.applicationError?.code ?? value.response?.data?.details?.applicationError?.code;
  return code === 'POST_NOT_FOUND' ? 404 : 503;
}
