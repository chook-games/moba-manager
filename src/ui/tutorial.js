// First-match interactive tutorial. Advances as the player performs each action.
import { state } from '../state.js';
import { saveProfile } from '../storage.js';

const STEPS = [
  { ev: 'select',   text: 'Tap a champion — in the 3D view or the squad dock below — to open their commands.' },
  { ev: 'order',    text: 'Give an order. Try “Push” to send them down the lane.' },
  { ev: 'ultimate', text: 'When the ULTIMATE button says READY, tap it to unleash it.' },
  { ev: 'buy',      text: 'Open the ⚔️/🛒 Shop tab and tap an item to buy it with gold.' },
  { ev: 'done',     text: 'That’s it! Destroy the enemy Nexus to win. Good luck, manager!' },
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
  if (text) text.textContent = STEPS[idx].text;
  if (step) step.textContent = `Step ${Math.min(idx + 1, STEPS.length)}/${STEPS.length}`;
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
