import { normalizePhoneNumber, phoneExample, phoneDialCode } from './phone.ts';
import { countryDialOptions, countryFlag } from './country-codes.ts';

/** Native select retains platform keyboard, type-to-search and mobile picker behaviour. */
export function initialiseQuotePhone(root: Element) {
  const country = root.querySelector<HTMLSelectElement>('[data-phone-country]')!;
  const input = root.querySelector<HTMLInputElement>('input[name="whatsapp"]')!;
  const flag = root.querySelector<HTMLElement>('[data-phone-flag]')!;
  const dial = root.querySelector<HTMLElement>('[data-phone-dial]')!;
  const hint = root.querySelector<HTMLElement>('[data-phone-example]')!;
  const announcement = root.querySelector<HTMLElement>('[data-phone-status]')!;
  let previousCountry = country.value;
  const updateCountry = () => {
    const option = countryDialOptions.find(option => option.iso === country.value)!;
    const example = phoneExample(country.value);
    flag.textContent = countryFlag(option.iso);
    dial.textContent = phoneDialCode(option.iso);
    input.placeholder = example.national;
    hint.textContent = example.international ? `e.g. ${example.international}` : '';
    previousCountry = country.value;
  };
  const number = () => {
    const parsed = normalizePhoneNumber(input.value, country.value);
    if (parsed?.country && parsed.country !== country.value && countryDialOptions.some(option => option.iso === parsed.country)) {
      country.value = parsed.country;
      updateCountry();
      const selected = countryDialOptions.find(option => option.iso === country.value)!;
      announcement.textContent = `Country updated to ${selected.name} (${phoneDialCode(selected.iso)}) for your number.`;
    }
    return parsed;
  };
  input.addEventListener('input', number);
  input.addEventListener('blur', () => {
    const parsed = number();
    if (parsed) input.value = parsed.national;
  });
  country.addEventListener('change', () => {
    // An explicit country change keeps the national portion, rather than duplicating calling codes.
    const previous = normalizePhoneNumber(input.value, previousCountry);
    if (previous) input.value = previous.national;
    updateCountry();
    announcement.textContent = '';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  updateCountry();
  return { number, error: () => {
    if (!input.value.trim()) return 'Please enter your phone number.';
    return number() ? '' : `Enter a valid number for ${countryDialOptions.find(option => option.iso === country.value)?.name || 'the selected country'}, or paste a full international number.`;
  } };
}
