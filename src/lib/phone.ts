/** Basic local/international phone format validation, without a country restriction. */
export function isValidPhoneNumber(value: unknown): boolean {
  const raw = String(value ?? '').trim();
  if (!/^\+?[\d\s().-]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, '');
  return /^\d{7,15}$/.test(digits) && /[1-9]/.test(digits);
}
