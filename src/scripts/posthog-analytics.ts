/**
 * Production-only PostHog EU integration. No third-party request occurs before
 * the site's existing analytics consent. Never send raw form fields or identity.
 *
 * The published PostHog JavaScript snippet is initialized lazily, without an npm
 * dependency, so the existing lockfile/CI and Wix form code remain unchanged.
 */
const POSTHOG_API_HOST = 'https://eu.i.posthog.com';
const POSTHOG_ASSET_URL = 'https://eu-assets.i.posthog.com/static/array.js';
const PREFERENCE_KEY = 'smc_cookie_preferences_v1';

export type PostHogFunnelEvent =
  | 'quote_form_start' | 'generate_lead' | 'whatsapp_handoff'
  | 'whatsapp_click' | 'phone_click' | 'quote_cta_click';

type EventRecord = { event: string; properties?: Record<string, unknown> };
type PostHogClient = {
  capture?: (name: string, properties?: Record<string, unknown>) => void;
  opt_in_capturing?: (params?: object) => void;
  opt_out_capturing?: () => void;
  stopSessionRecording?: () => void;
  __SV?: number;
};

declare global {
  interface Window {
    posthog?: PostHogClient;
    smcPostHogInitialized?: boolean;
  }
}

export function isPostHogProductionHost(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && !url.port &&
      ['scrapmycaruae.com', 'www.scrapmycaruae.com'].includes(url.hostname);
  } catch { return false; }
}

function consented(win: Window, doc: Document): boolean {
  try {
    const stored = win.localStorage.getItem(PREFERENCE_KEY);
    if (stored !== null) return JSON.parse(stored)?.analytics === true;
  } catch { /* Fallback to the same preference cookie used by GTM. */ }
  return doc.cookie.split(';').some(part => part.trim() === `${PREFERENCE_KEY}=analytics-yes`);
}

/** Strip query strings/fragments and restrict event fields to public context. */
export function filterPostHogEvent(input: EventRecord, href: string): EventRecord | null {
  if (!input || typeof input.event !== 'string') return null;
  const url = new URL(href);
  const pathname = url.pathname;
  const original = input.properties || {};
  const properties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(original)) {
    if (/email|phone|name|address|contact|value|text|element|href|referrer|search|query|token/i.test(key)) continue;
    if (typeof value === 'string' && /@|\+?\d{8,}/.test(value) && !key.startsWith('$')) continue;
    properties[key] = value;
  }
  properties.$current_url = url.origin + pathname;
  properties.$pathname = pathname;
  properties.page_path = pathname;
  delete properties.$referrer;
  delete properties.$initial_referrer;
  delete properties.$initial_current_url;
  return { ...input, properties };
}

function consentSafeCapture(win: Window, event: PostHogFunnelEvent, properties: Record<string, string>) {
  if (!win.posthog || !consented(win, win.document) || !isPostHogProductionHost(win.location.href)) return;
  const allowed: Record<string, string> = {};
  for (const key of ['form_name', 'cta_location', 'destination_type', 'page_path']) {
    const value = properties[key];
    if (typeof value === 'string' && /^[\w/ -]{1,80}$/.test(value)) allowed[key] = value;
  }
  win.posthog.capture?.(event, allowed);
}

/** Official SDK queue shape; actual SDK script is appended only after consent. */
function installStub(win: Window, doc: Document, token: string, options: Record<string, unknown>) {
  const client = [] as unknown as Record<string, any> & PostHogClient;
  const commands = 'capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' ');
  for (const name of commands) {
    client[name] = (...args: unknown[]) => { (client as unknown as unknown[]).push([name, ...args]); };
  }
  client.__SV = 1;
  client.people = [];
  client._i = [[token, options, 'posthog']];
  win.posthog = client;
  const script = doc.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.referrerPolicy = 'strict-origin';
  script.src = POSTHOG_ASSET_URL;
  script.dataset.smcPosthog = 'true';
  doc.head.appendChild(script);
  return client;
}

export function initializePostHogAnalytics(win: Window = window, doc: Document = document): void {
  try {
    const token = doc.querySelector<HTMLMetaElement>('meta[name="smc-posthog-config"]')?.content.trim() || '';
    if (!/^phc_[A-Za-z0-9]+$/.test(token) || !isPostHogProductionHost(win.location.href) || win.smcPostHogInitialized) return;
    win.smcPostHogInitialized = true;
    let installed = false;
    let existing = false;
    const install = () => {
      if (doc.readyState === 'loading' || installed || !consented(win, doc)) return;
      existing = !!win.posthog?.__SV || !!doc.querySelector('script[data-smc-posthog], script[src*="posthog.com/static/array.js"]');
      if (existing) { installed = true; return; }
      const safeUrl = new URL(win.location.href);
      const config = {
        api_host: POSTHOG_API_HOST,
        defaults: '2026-08-30',
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
        persistence: 'localStorage',
        person_profiles: 'identified_only',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        mask_all_text: true,
        mask_all_element_attributes: true,
        disable_session_recording: !!safeUrl.search,
        session_recording: { maskAllInputs: true, maskTextSelector: '*' },
        before_send: (event: EventRecord) => filterPostHogEvent(event, win.location.href)
      };
      const client = installStub(win, doc, token, config);
      installed = true;
      win.smcPostHog = { track: (event: PostHogFunnelEvent, params: Record<string, string> = {}) => {
        try { consentSafeCapture(win, event, params); } catch { /* Customer flow must continue. */ }
      } };
      client.opt_in_capturing?.({ captureEventName: false });
      client.capture?.('$pageview', { $current_url: safeUrl.origin + safeUrl.pathname, $pathname: safeUrl.pathname });
    };
    const safelyInstall = () => { try { install(); } catch { /* No analytics failure can affect the website. */ } };
    doc.addEventListener('DOMContentLoaded', safelyInstall, { once: true });
    win.addEventListener('smc:analytics-consent', (event: Event) => {
      try {
        if ((event as CustomEvent)?.detail?.granted === true && consented(win, doc)) {
          safelyInstall();
        } else if (installed && !existing) {
          win.posthog?.opt_out_capturing?.();
          win.posthog?.stopSessionRecording?.();
          win.smcPostHog = undefined;
          // Reload to remove active session-replay observers and restore a no-SDK page.
          win.location.reload();
        }
      } catch { /* Never interrupt privacy controls or forms. */ }
    });
    safelyInstall();
  } catch { /* Safe in browsers with strict storage/network rules. */ }
}
