import { countryDialOptions, countryFlagAsset, type CountryDialOption } from './country-codes.ts';
import { phoneDialCode } from './phone.ts';

const commonCodes = ['AE', 'SA', 'GB', 'PK', 'IN'];
const alphabetical = [...countryDialOptions].sort((a, b) => a.name.localeCompare(b.name, 'en'));
const plain = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();

export function countryGroups(query = ''): { label: string; countries: CountryDialOption[] }[] {
  const term = plain(query);
  if (term) {
    const exactCode = ({ uae: 'AE', uk: 'GB', usa: 'US' } as Record<string, string>)[term] || term.toUpperCase();
    const exact = countryDialOptions.find(country => country.iso === exactCode);
    if (exact) return [{ label: 'Search results', countries: [exact] }];
    const aliases: Record<string, string> = { AE: 'uae emirates', GB: 'uk britain' };
    return [{ label: 'Search results', countries: alphabetical.filter(country =>
      plain(`${country.name} ${country.iso} ${phoneDialCode(country.iso)} ${aliases[country.iso] || ''}`).includes(term)) }];
  }
  return [
    { label: 'Common countries', countries: commonCodes.map(code => countryDialOptions.find(country => country.iso === code)!) },
    { label: 'All other countries', countries: alphabetical.filter(country => !commonCodes.includes(country.iso)) }
  ];
}

/** Keep the popover inside the visual viewport, including when the phone keyboard opens. */
export function countryPickerPosition(rect: { left: number; top: number; bottom: number; width: number }, viewport: { width: number; height: number; left?: number; top?: number }) {
  const leftEdge = (viewport.left || 0) + 12, topEdge = (viewport.top || 0) + 12;
  const width = Math.max(0, Math.min(rect.width, 380, viewport.width - 24));
  const below = (viewport.top || 0) + viewport.height - 12 - rect.bottom - 6;
  const above = rect.top - topEdge - 6;
  const opensAbove = below < 280 && above > below;
  const maxHeight = Math.max(0, Math.min(360, opensAbove ? above : below, viewport.height - 24));
  const left = Math.max(leftEdge, Math.min(rect.left, leftEdge + viewport.width - 24 - width));
  const proposedTop = opensAbove ? rect.top - 6 - maxHeight : rect.bottom + 6;
  const top = Math.max(topEdge, Math.min(proposedTop, topEdge + viewport.height - 24 - maxHeight));
  return { left, top, width, maxHeight, opensAbove };
}

/** Enhance the existing select; its value and FormData field remain the source of truth. */
export function initialiseCountryPicker(root: Element) {
  const country = root.querySelector<HTMLSelectElement>('[data-phone-country]')!;
  const trigger = root.querySelector<HTMLButtonElement>('[data-country-trigger]');
  const menu = root.querySelector<HTMLElement>('[data-country-menu]');
  // Older browsers retain the fully functional native select.
  if (!trigger || !menu || typeof menu.showPopover !== 'function') return { sync() {} };
  const search = menu.querySelector<HTMLInputElement>('[data-country-search]')!;
  const list = menu.querySelector<HTMLElement>('[data-country-list]')!;
  const empty = menu.querySelector<HTMLElement>('[data-country-empty]')!;
  const resultStatus = menu.querySelector<HTMLElement>('[data-country-results]')!;
  const closeButton = menu.querySelector<HTMLButtonElement>('[data-country-close]')!;
  const control = root.querySelector<HTMLElement>('.phone-control')!;
  const phone = root.querySelector<HTMLInputElement>('input[name="whatsapp"]')!;
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  let opened = false, activeIndex = -1;
  let rows: HTMLButtonElement[] = [];
  let listeners: AbortController | undefined;

  const position = () => {
    const visual = win.visualViewport;
    const viewport = { width: visual?.width ?? win.innerWidth, height: visual?.height ?? win.innerHeight,
      left: visual?.offsetLeft || 0, top: visual?.offsetTop || 0 };
    const rect = control.getBoundingClientRect();
    const placement = countryPickerPosition(rect, viewport);
    menu.style.left = `${placement.left}px`;
    menu.style.width = `${placement.width}px`;
    menu.style.maxHeight = `${placement.maxHeight}px`;
    const height = Math.min(menu.getBoundingClientRect().height || placement.maxHeight, placement.maxHeight);
    const topEdge = (viewport.top || 0) + 12;
    const desired = placement.opensAbove ? rect.top - 6 - height : rect.bottom + 6;
    menu.style.top = `${Math.max(topEdge, Math.min(desired, topEdge + viewport.height - 24 - height))}px`;
  };
  const highlight = (index: number, scroll = false) => {
    activeIndex = rows.length ? Math.max(0, Math.min(index, rows.length - 1)) : -1;
    rows.forEach((row, i) => row.classList.toggle('is-highlighted', i === activeIndex));
    const active = rows[activeIndex];
    if (active) {
      search.setAttribute('aria-activedescendant', active.id);
      if (scroll) active.scrollIntoView({ block: 'nearest' });
    } else search.removeAttribute('aria-activedescendant');
  };
  const render = () => {
    const fragment = doc.createDocumentFragment();
    rows = [];
    for (const group of countryGroups(search.value)) {
      if (!group.countries.length) continue;
      const section = doc.createElement('div');
      section.setAttribute('role', 'group'); section.setAttribute('aria-label', group.label);
      const heading = doc.createElement('p'); heading.className = 'country-group-label';
      heading.setAttribute('aria-hidden', 'true'); heading.textContent = group.label; section.append(heading);
      for (const item of group.countries) {
        const row = doc.createElement('button'); row.type = 'button'; row.tabIndex = -1;
        row.className = 'country-option'; row.id = `${list.id}-${item.iso}`; row.dataset.countryOption = item.iso;
        row.setAttribute('role', 'option'); row.setAttribute('aria-selected', String(item.iso === country.value));
        const image = doc.createElement('img'); image.src = countryFlagAsset(item.iso); image.alt = '';
        image.width = 24; image.height = 24; image.loading = 'lazy'; image.decoding = 'async';
        const name = doc.createElement('span'); name.className = 'country-option-name'; name.textContent = item.name;
        const dial = doc.createElement('span'); dial.className = 'country-option-dial'; dial.textContent = phoneDialCode(item.iso);
        const check = doc.createElement('span'); check.className = 'country-option-check'; check.setAttribute('aria-hidden', 'true'); check.textContent = '✓';
        row.append(image, name, dial, check); section.append(row); rows.push(row);
      }
      fragment.append(section);
    }
    list.replaceChildren(fragment); list.scrollTop = 0;
    empty.hidden = rows.length > 0;
    resultStatus.textContent = `${rows.length} ${rows.length === 1 ? 'country' : 'countries'} available.`;
    highlight(Math.max(0, rows.findIndex(row => row.dataset.countryOption === country.value)));
    if (opened) position();
  };
  const sync = () => {
    const selected = countryDialOptions.find(option => option.iso === country.value)!;
    trigger.setAttribute('aria-label', `Change phone country: ${selected.name} (${phoneDialCode(selected.iso)})`);
    trigger.title = `${selected.name} (${phoneDialCode(selected.iso)})`;
    if (opened) render();
  };
  const close = (restoreFocus = false) => {
    if (!opened) return;
    opened = false; listeners?.abort();
    try { menu.hidePopover(); } catch { /* Navigation may already have removed the popover. */ }
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false'); search.setAttribute('aria-expanded', 'false');
    search.removeAttribute('aria-activedescendant');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  };
  const choose = (iso: string) => {
    if (!countryDialOptions.some(item => item.iso === iso)) return;
    country.value = iso;
    country.dispatchEvent(new Event('change', { bubbles: true }));
    close(); phone.focus({ preventScroll: true });
  };
  const open = () => {
    doc.dispatchEvent(new CustomEvent('smc:country-picker-open', { detail: trigger }));
    search.value = ''; render(); menu.hidden = false;
    try { menu.showPopover(); } catch {
      menu.hidden = true; country.hidden = false;
      trigger.setAttribute('aria-hidden', 'true'); trigger.tabIndex = -1;
      delete trigger.dataset.enhanced;
      return;
    }
    opened = true;
    trigger.setAttribute('aria-expanded', 'true'); search.setAttribute('aria-expanded', 'true');
    position(); search.focus({ preventScroll: true }); highlight(activeIndex, true);
    listeners = new AbortController(); const options = { signal: listeners.signal };
    doc.addEventListener('pointerdown', event => {
      const target = event.target as Node;
      if (!menu.contains(target) && !trigger.contains(target)) close();
    }, { ...options, capture: true });
    doc.addEventListener('focusin', event => {
      const target = event.target as Node;
      if (!menu.contains(target) && !trigger.contains(target)) close();
    }, options);
    doc.addEventListener('smc:country-picker-open', event => { if ((event as CustomEvent).detail !== trigger) close(); }, options);
    doc.addEventListener('astro:before-swap', () => close(), { ...options, once: true });
    win.addEventListener('resize', position, options);
    doc.addEventListener('scroll', event => { if (!menu.contains(event.target as Node)) position(); }, { ...options, capture: true });
    win.visualViewport?.addEventListener('resize', position, options);
    win.visualViewport?.addEventListener('scroll', position, options);
  };
  trigger.addEventListener('click', () => opened ? close() : open());
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (!opened) open(); }
  });
  closeButton.addEventListener('click', () => close(true));
  search.addEventListener('input', render);
  list.addEventListener('click', event => {
    const row = (event.target as Element).closest<HTMLElement>('[data-country-option]');
    if (row) choose(row.dataset.countryOption!);
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    else if (event.key === 'Tab') {
      if ((event.shiftKey && event.target === search) || (!event.shiftKey && event.target === closeButton)) return;
      event.preventDefault(); close(); (event.shiftKey ? trigger : phone).focus({ preventScroll: true });
    } else if (event.target === search && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); highlight(activeIndex + (event.key === 'ArrowDown' ? 1 : -1), true);
    } else if (event.target === search && !search.value && ['Home', 'End'].includes(event.key)) {
      event.preventDefault(); highlight(event.key === 'Home' ? 0 : rows.length - 1, true);
    } else if (event.target === search && event.key === 'Enter') {
      event.preventDefault(); if (rows[activeIndex]) choose(rows[activeIndex].dataset.countryOption!);
    }
  });
  country.hidden = true; trigger.removeAttribute('aria-hidden'); trigger.tabIndex = 0;
  trigger.dataset.enhanced = 'true'; sync();
  return { sync };
}
