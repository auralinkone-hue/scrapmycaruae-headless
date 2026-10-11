const WIX_COLLECTION_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,99}$/;

export function requireQuoteRequestsCollectionId(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Quote submission collection is not configured.');
  }

  const collectionId = value.trim();

  if (!WIX_COLLECTION_ID_PATTERN.test(collectionId)) {
    throw new Error('Quote submission collection configuration is invalid.');
  }

  return collectionId;
}
