const BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js';
const PREFERENCE_KEY = 'smc_cookie_preferences_v1';

declare global {
  interface Window {
    smcCloudflareAnalyticsInitialized?: boolean;
    __cfBeacon?: { token?: string };
  }
}

export function isCloudflareAnalyticsHost(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && !url.port &&
      ['scrapmycaruae.com', 'www.scrapmycaruae.com'].includes(url.hostname);
  } catch { return false; }
}

function hasAnalyticsConsent(win: Window, doc: Document): boolean {
  try {
    const stored = win.localStorage.getItem(PREFERENCE_KEY);
    if (stored) return JSON.parse(stored)?.analytics === true;
  } catch { /* Match the existing footer/GTM cookie fallback. */ }
  return doc.cookie.split(';').some(entry => entry.trim() === `${PREFERENCE_KEY}=analytics-yes`);
}

/** One manual installation, using the same persisted choice as GTM and the footer. */
export function initializeCloudflareAnalytics(win: Window = window, doc: Document = document) {
  try {
    const token = doc.querySelector<HTMLMetaElement>('meta[name="smc-cloudflare-analytics-config"]')?.content.trim() || '';
    if (!/^[a-f0-9]{32}$/i.test(token) || !isCloudflareAnalyticsHost(win.location.href) || win.smcCloudflareAnalyticsInitialized) return;
    win.smcCloudflareAnalyticsInitialized = true;
    let installed = false;
    const existingBeacon = () => Boolean(win.__cfBeacon?.token || doc.querySelector('script[data-cf-beacon], script[src*="static.cloudflareinsights.com/beacon.min.js"]'));
    const install = () => {
      if (doc.readyState === 'loading' || installed || !hasAnalyticsConsent(win, doc)) return;
      // Wait for the parsed document so edge-injected or GTM-installed snippets
      // already present are detected, including versioned/query-string URLs.
      if (existingBeacon()) { installed = true; return; }
      const script = doc.createElement('script');
      script.type = 'module';
      script.async = true;
      script.referrerPolicy = 'strict-origin';
      script.src = BEACON_URL;
      // This site uses full-document navigation. No history patching or custom
      // events/form data are supplied. Cloudflare strips URL queries/fragments.
      script.dataset.cfBeacon = JSON.stringify({ token, spa: false });
      script.id = 'smc-cloudflare-beacon';
      doc.head.appendChild(script);
      installed = true;
    };
    const safelyInstall = () => { try { install(); } catch { /* Analytics must never affect the site. */ } };
    doc.addEventListener('DOMContentLoaded', safelyInstall, { once: true });
    win.addEventListener('smc:analytics-consent', (event: Event) => {
      try {
        if ((event as CustomEvent)?.detail?.granted === true && hasAnalyticsConsent(win, doc)) {
          safelyInstall();
        } else if (installed) {
          // The official beacon has no supported unload API. A new document
          // applies the persisted decline without leaving its observers running.
          doc.getElementById('smc-cloudflare-beacon')?.remove();
          win.location.reload();
        }
      } catch { /* Consent UI and customer flows must continue to work. */ }
    });
    safelyInstall();
  } catch { /* Missing browser facilities or blocked storage must fail safely. */ }
}
