// Privacy-friendly, OPT-IN analytics. Disabled by default and inert until an
// endpoint is configured. No personal data is ever sent.
import { state } from '../state.js';

// Set this to your own privacy-friendly collector to enable (e.g. a Plausible/Umami
// self-hosted endpoint). Leave empty to keep analytics completely off.
const ENDPOINT = '';

let enabled = false;

export function analyticsConfigured() {
  return !!ENDPOINT;
}

export function initAnalytics() {
  const s = (state.profile && state.profile.settings) || {};
  enabled = !!s.analytics && analyticsConfigured();
}

export function setAnalyticsEnabled(v) {
  enabled = !!v && analyticsConfigured();
}

export function track(event, props) {
  if (!enabled || !ENDPOINT) return;
  try {
    const body = JSON.stringify({ event, props: props || {}, ts: Date.now() });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, body);
    else fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch (_) { /* ignore */ }
}
