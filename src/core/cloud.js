// Optional cloud sync. Inert until configured. The client talks to a Supabase-style
// REST endpoint; if no URL/key is set, everything stays local (the default).
//
// To enable: create a table `saves(id text primary key, profile jsonb, updated_at bigint)`,
// then fill CLOUD below (or set window.__MOBA_CLOUD before this module loads).
import { state } from '../state.js';

export const CLOUD = {
  url: '',      // e.g. https://xxxx.supabase.co
  anonKey: '',  // public anon key
  table: 'saves',
};

if (typeof window !== 'undefined' && window.__MOBA_CLOUD) {
  Object.assign(CLOUD, window.__MOBA_CLOUD);
}

export function cloudConfigured() {
  return !!CLOUD.url && !!CLOUD.anonKey;
}

export function cloudStatusKey() {
  return cloudConfigured() ? 'settings.cloudReady' : 'settings.cloudOff';
}

function deviceId() {
  return (state.profile && state.profile.deviceId) || 'local';
}

export async function pushSave() {
  if (!cloudConfigured() || !state.profile) return false;
  try {
    const body = { id: deviceId(), profile: state.profile, updated_at: Date.now() };
    const res = await fetch(`${CLOUD.url}/rest/v1/${CLOUD.table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: CLOUD.anonKey,
        Authorization: `Bearer ${CLOUD.anonKey}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

export async function pullSave() {
  if (!cloudConfigured()) return null;
  try {
    const res = await fetch(`${CLOUD.url}/rest/v1/${CLOUD.table}?id=eq.${encodeURIComponent(deviceId())}&select=profile`, {
      headers: { apikey: CLOUD.anonKey, Authorization: `Bearer ${CLOUD.anonKey}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows && rows[0] ? rows[0].profile : null;
  } catch (_) {
    return null;
  }
}
