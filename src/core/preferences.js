// Applies profile preferences (language, reduced motion) to the document.
import { state } from '../state.js';
import { initLang, applyI18n, getLang } from './i18n.js';

export function applyPreferences() {
  const s = (state.profile && state.profile.settings) || {};
  initLang(s.lang || null);
  if (state.profile && state.profile.settings && !state.profile.settings.lang) {
    state.profile.settings.lang = getLang();
  }
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('reduce-motion', !!s.reduceMotion);
    document.documentElement.lang = getLang() === 'el' ? 'el' : 'en';
  }
  if (typeof document !== 'undefined') applyI18n(document);
}

export function reduceMotionEnabled() {
  return !!(state.profile && state.profile.settings && state.profile.settings.reduceMotion);
}
