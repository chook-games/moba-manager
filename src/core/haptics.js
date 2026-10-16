// Vibration feedback (Android). Respects the Haptics setting.
import { state } from '../state.js';

export function vibrate(pattern) {
  const s = state.profile && state.profile.settings;
  if (!s || !s.haptic) return;
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(pattern); } catch (_) { /* ignore */ }
  }
}

export const haptics = {
  tap()       { vibrate(8); },
  kill()      { vibrate(20); },
  ultimate()  { vibrate(35); },
  structure() { vibrate([40, 30, 60]); },
  end()       { vibrate([80, 40, 120]); },
};
