export type AnalyticsEvent =
  | 'generate_lead'
  | 'whatsapp_handoff'
  | 'whatsapp_click'
  | 'phone_click'
  | 'quote_cta_click';

type EventParams = {
  form_name?: string;
  cta_location?: string;
  destination_type?: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    smcAnalytics?: { track: (event: AnalyticsEvent, params?: EventParams) => void };
  }
}

const allowedParams = ['form_name', 'cta_location', 'destination_type'] as const;

function safeParams(params: EventParams = {}) {
  const payload: Record<string, string> = { page_path: window.location.pathname };

  for (const key of allowedParams) {
    const value = params[key];
    if (typeof value === 'string' && value) payload[key] = value.slice(0, 80);
  }

  return payload;
}

export function trackAnalyticsEvent(event: AnalyticsEvent, params: EventParams = {}) {
  try {
    if (!Array.isArray(window.dataLayer)) return;
    window.dataLayer.push({ event, ...safeParams(params) });
  } catch {
    // Analytics is deliberately best-effort and must never affect the customer flow.
  }
}

function whatsappHref(href: string) {
  return /(?:api\.)?whatsapp\.com|wa\.me/i.test(href);
}

export function initializeAnalytics() {
  window.smcAnalytics = { track: trackAnalyticsEvent };

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;

    const href = link.getAttribute('href') || '';
    const ctaLocation = link.dataset.analyticsQuoteCta || 'site_link';

    if (href.startsWith('tel:')) {
      trackAnalyticsEvent('phone_click', { cta_location: ctaLocation, destination_type: 'phone' });
    } else if (whatsappHref(href)) {
      trackAnalyticsEvent('whatsapp_click', { cta_location: ctaLocation, destination_type: 'whatsapp' });
    } else if (link.dataset.analyticsQuoteCta) {
      trackAnalyticsEvent('quote_cta_click', { cta_location: ctaLocation, destination_type: 'quote_form' });
    }
  });
}
