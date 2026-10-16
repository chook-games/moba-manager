import { state } from './state.js';
import { SPEED_STEPS } from './config.js';
import { loadProfile } from './storage.js';
import { initThreeScene, handleResize } from './three/scene.js';
import {
  setCameraPreset, adjustZoom, setZoomFromSlider, setZoomValue,
  setupViewportTouchControls, updateCameraPosition,
} from './three/camera.js';
import { updateFloatingLabels } from './three/labels.js';
import { setupNewMatch } from './game/match.js';
import { updateSimulation } from './game/simulation.js';
import { showScreen } from './ui/nav.js';
import { refreshHome, bindMenu } from './ui/menu.js';
import { bindSquad, getSelectedSquad } from './ui/squad.js';
import { bindCommandSheet, closeCommandSheet, toggleMacro, selectChampion } from './ui/command-sheet.js';
import { registerPWA } from './pwa.js';
import { unlockAudio } from './core/audio.js';
import { bindTutorial, maybeStartTutorial } from './ui/tutorial.js';

function startMatch() {
  showScreen('screen-game');
  initThreeScene();
  handleResize();
  setCameraPreset(0);
  setupNewMatch(state.pendingModeId, getSelectedSquad());
  updateSpeedButton();
  maybeStartTutorial();
}

function restartMatch() {
  document.getElementById('modal-gameover')?.classList.add('hidden');
  showScreen('screen-game');
  handleResize();
  setCameraPreset(0);
  setupNewMatch(state.currentModeId, getSelectedSquad());
  updateSpeedButton();
  maybeStartTutorial();
}

function goHome() {
  state.isGameRunning = false;
  showScreen('screen-home');
  refreshHome();
}

function cycleSpeed() {
  state.speedIndex = (state.speedIndex + 1) % SPEED_STEPS.length;
  updateSpeedButton();
}

function updateSpeedButton() {
  const btn = document.getElementById('btn-speed');
  if (!btn) return;
  const s = SPEED_STEPS[state.speedIndex];
  btn.textContent = s.mult === 0 ? '⏸' : s.label;
  btn.classList.toggle('is-paused', s.mult === 0);
}

function bindGameControls() {
  document.getElementById('btn-speed')?.addEventListener('click', cycleSpeed);
  document.getElementById('btn-quit-game')?.addEventListener('click', goHome);
  document.getElementById('cam-preset-0')?.addEventListener('click', () => setCameraPreset(0));
  document.getElementById('cam-preset-1')?.addEventListener('click', () => setCameraPreset(1));
  document.getElementById('cam-preset-2')?.addEventListener('click', () => setCameraPreset(2));
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => adjustZoom(0.28));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => adjustZoom(-0.28));
  const slider = document.getElementById('zoom-range-input');
  slider?.addEventListener('input', () => setZoomFromSlider(slider.value));

  document.getElementById('btn-help')?.addEventListener('click', () => document.getElementById('modal-help')?.classList.remove('hidden'));
  document.getElementById('btn-help-close')?.addEventListener('click', () => document.getElementById('modal-help')?.classList.add('hidden'));

  document.getElementById('btn-start-match')?.addEventListener('click', startMatch);
  document.getElementById('btn-go-home')?.addEventListener('click', goHome);
  document.getElementById('btn-go-replay')?.addEventListener('click', restartMatch);
  document.getElementById('btn-go-squad')?.addEventListener('click', () => {
    document.getElementById('modal-gameover')?.classList.add('hidden');
    showScreen('screen-squad');
  });
}

function setupCanvasInput() {
  const canvas = document.getElementById('three-canvas');
  setupViewportTouchControls(canvas, {
    onSelectHero: (idx) => selectChampion(idx),
    onEmptyTap: () => {
      closeCommandSheet();
      toggleMacro(false);
    },
  });
}

let lastFrame = performance.now();
function animateLoop(now) {
  requestAnimationFrame(animateLoop);
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;

  if (state.isThreeInitialized && state.renderer) {
    if (state.isGameRunning) updateSimulation(dt);
    updateCameraPosition();
    state.renderer.render(state.scene, state.camera);
    if (state.isGameRunning) updateFloatingLabels();
  }
}

function boot() {
  state.profile = loadProfile();
  state.speedIndex = 0;

  bindMenu();
  bindSquad();
  bindCommandSheet();
  bindGameControls();
  bindTutorial();
  setupCanvasInput();

  // Unlock WebAudio on the first user gesture (required by mobile browsers).
  window.addEventListener('pointerdown', unlockAudio, { once: true });

  refreshHome();
  showScreen('screen-home');

  registerPWA();
  lastFrame = performance.now();
  requestAnimationFrame(animateLoop);
}

window.addEventListener('DOMContentLoaded', boot);
