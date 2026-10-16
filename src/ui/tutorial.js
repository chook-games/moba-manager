// First-match interactive tutorial. Advances as the player performs each action.
import { state } from '../state.js';
import { t } from '../core/i18n.js';
import { saveProfile } from '../storage.js';

const STEPS = [
  { ev: 'select',   key: 'tut.s1' },
  { ev: 'order',    key: 'tut.s2' },
  { ev: 'ultimate', key: 'tut.s3' },
  { ev: 'buy',      key: 'tut.s4' },
  { ev: 'done',     key: 'tut.s5' },
];

let active = false;
let idx = 0;
let bound = false;

export function bindTutorial() {
  if (bound) return;
  bound = true;
  document.getElementById('btn-tutorial-skip')?.addEventListener('click', finishTutorial);
}

export function maybeStartTutorial() {
  const done = state.profile && state.profile.settings && state.profile.settings.tutorialDone;
  if (!done && state.currentModeId === 'aram') {
    active = true;
    idx = 0;
    render();
  } else {
    hideBanner();
  }
}

export function notifyTutorial(type) {
  if (!active) return;
  if (STEPS[idx] && STEPS[idx].ev === type) {
    idx++;
    render();
  }
}

function render() {
  const el = document.getElementById('tutorial-banner');
  if (!el) return;
  if (idx >= STEPS.length) { finishTutorial(); return; }
  el.classList.remove('hidden');
  const text = document.getElementById('tutorial-text');
  const step = document.getElementById('tutorial-step');
  if (text) text.textContent = t(STEPS[idx].key);
  if (step) step.textContent = t('tut.step', { n: Math.min(idx + 1, STEPS.length), t: STEPS.length });
  if (STEPS[idx].ev === 'done') setTimeout(() => { if (active) finishTutorial(); }, 6000);
}

export function finishTutorial() {
  active = false;
  hideBanner();
  if (state.profile && state.profile.settings && !state.profile.settings.tutorialDone) {
    state.profile.settings.tutorialDone = true;
    saveProfile(state.profile);
  }
}

export function replayTutorial() {
  if (state.profile && state.profile.settings) {
    state.profile.settings.tutorialDone = false;
    saveProfile(state.profile);
  }
  active = true;
  idx = 0;
  render();
}

function hideBanner() {
  document.getElementById('tutorial-banner')?.classList.add('hidden');
}

export function isTutorialActive() {
  return active;
}
