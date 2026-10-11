/** Returns a trimmed string only when Wix supplies a scalar text value. */
export const asTrimmedString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';
