import { parsePhoneNumberFromString, isSupportedCountry, getCountryCallingCode, getExampleNumber, type CountryCode } from 'libphonenumber-js/max';
import examples from 'libphonenumber-js/mobile/examples';

export interface NormalizedPhone {
  e164: string;
  digits: string;
  country?: CountryCode;
  national: string;
  international: string;
}

/** A country is required for unprefixed input; explicit international input also supports older clients. */
export function normalizePhoneNumber(value: unknown, selectedCountry?: unknown): NormalizedPhone | null {
  if (typeof value !== 'string' || value.length > 64 || /[\r\n\u0000-\u001f\u007f]/.test(value)) return null;
  const raw = value.trim();
  if (!/^\+?[\d ().-]+$/.test(raw)) return null;
  const country = typeof selectedCountry === 'string' ? selectedCountry.toUpperCase() : undefined;
  if (selectedCountry !== undefined && (!country || !isSupportedCountry(country))) return null;
  const explicit = raw.startsWith('+') || raw.startsWith('00');
  // A bare national number can also resemble another country's international digits.
  // Never invent a calling code in the absence of the customer's country choice.
  if (!country && !explicit) return null;
  const input = raw.startsWith('00') ? '+' + raw.slice(2) : raw;
  try {
    const phone = parsePhoneNumberFromString(input, { defaultCountry: country as CountryCode | undefined, extract: false });
    if (!phone?.isValid() || phone.ext) return null;
    // A local number must belong to the selected plan. International pastes can select their own country.
    if (!explicit && country && phone.country !== country) return null;
    return { e164: phone.number, digits: phone.number.slice(1), country: phone.country,
      national: phone.formatNational(), international: phone.formatInternational() };
  } catch { return null; }
}

export function isValidPhoneNumber(value: unknown, country?: unknown): boolean {
  return normalizePhoneNumber(value, country) !== null;
}

/** Area codes in the existing country list belong in the national input (e.g. +1 territories). */
export function phoneDialCode(country: string): string {
  return '+' + getCountryCallingCode(country as CountryCode);
}

export function phoneExample(country: string): { national: string; international: string } {
  const example = isSupportedCountry(country) ? getExampleNumber(country as CountryCode, examples) : undefined;
  if (country === 'AE') return { national: '50 123 4567', international: '+971 50 123 4567' };
  return { national: example?.formatNational() || 'Phone number', international: example?.formatInternational() || '' };
}
