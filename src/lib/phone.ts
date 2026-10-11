/**
 * Converts the UAE mobile number formats accepted by the valuation form to
 * E.164 so the quote endpoint can consistently validate mobile submissions.
 */
export function normalizeUaeMobilePhone(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  // Permit normal visual separators, but reject other characters instead of
  // silently turning arbitrary text into a phone number.
  if (!/^[+\d\s().-]+$/.test(raw)) return null;

  const digits = raw.replace(/\D/g, '');
  let national = '';

  if (/^0?5\d{8}$/.test(digits)) {
    national = digits.startsWith('0') ? digits.slice(1) : digits;
  } else if (/^9715\d{8}$/.test(digits)) {
    national = digits.slice(3);
  } else {
    return null;
  }

  return `+971${national}`;
}
