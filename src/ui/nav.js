import { state } from '../state.js';

export const SCREENS = ['screen-home', 'screen-mode', 'screen-squad', 'screen-draft', 'screen-roster', 'screen-missions', 'screen-stats', 'screen-settings', 'screen-game'];
const GAME_SCREENS = new Set(['screen-game']);

export function showScreen(id) {
  SCREENS.forEach((s) => {
    const el = document.getElementById(s);
    if (!el) return;
    const active = s === id;
    el.classList.toggle('hidden', !active);
    el.classList.toggle('flex', active);
  });

  if (!GAME_SCREENS.has(id)) {
    state.isGameRunning = false;
    const modal = document.getElementById('modal-gameover');
    if (modal) modal.classList.add('hidden');
  }
  window.scrollTo(0, 0);
}
