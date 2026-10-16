// Optional remote balance config. If `./balance.json` exists on the server, its
// top-level keys are merged over CONFIG at boot — so numbers can be tuned in
// production without redeploying the code. Missing file = silently ignored.
import { CONFIG } from '../config.js';

export async function loadRemoteConfig() {
  // Opt-in: set `window.__MOBA_REMOTE_CONFIG = true` in index.html to enable.
  if (typeof window === 'undefined' || !window.__MOBA_REMOTE_CONFIG) return false;
  try {
    const res = await fetch('./balance.json', { cache: 'no-cache' });
    if (!res.ok) return false;
    const data = await res.json();
    if (data && typeof data === 'object') {
      Object.assign(CONFIG, data);
      return true;
    }
  } catch (_) { /* offline or not present */ }
  return false;
}
