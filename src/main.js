import { state } from './state.js';
import { SPEED_STEPS } from './config.js';
import { loadProfile, saveProfile, exportSaveCode, importSaveCode } from './storage.js';
import { initThreeScene, handleResize } from './three/scene.js';
import {
  setCameraPreset, adjustZoom, setZoomFromSlider, setZoomValue,
  setupViewportTouchControls, updateCameraPosition,
} from './three/camera.js';
import { updateFloatingLabels } from './three/labels.js';
import { setupNewMatch } from './game/match.js';
import { updateSimulation } from './game/simulation.js';
import { applyPreferences } from './core/preferences.js';
import { t } from './core/i18n.js';
import { initAnalytics } from './core/analytics.js';
import { loadRemoteConfig } from './core/remote-config.js';
import { showScreen } from './ui/nav.js';
import { refreshHome, bindMenu, renderModeList, renderRoster } from './ui/menu.js';
import { bindSquad, getSelectedSquad, renderSquadSelectionGrid } from './ui/squad.js';
import { renderMissions, bindMissions } from './ui/missions.js';
import { renderStats } from './ui/stats.js';
import { openDraft, bindDraft } from './ui/draft.js';
import { renderCosmetics, bindCosmetics } from './ui/cosmetics.js';
import { shareResult } from './core/share.js';
import { ensureDaily } from './core/missions.js';
import { updateManagerDashboardUI } from './ui/hud.js';
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

function relocalize() {
  applyPreferences();
  refreshHome();
  if (state.isGameRunning) updateManagerDashboardUI();
  if (!document.getElementById('screen-mode').classList.contains('hidden')) renderModeList();
  if (!document.getElementById('screen-roster').classList.contains('hidden')) renderRoster();
  if (!document.getElementById('screen-squad').classList.contains('hidden')) renderSquadSelectionGrid();
  if (!document.getElementById('screen-missions').classList.contains('hidden')) renderMissions();
  if (!document.getElementById('screen-stats').classList.contains('hidden')) renderStats();
  if (!document.getElementById('screen-cosmetics').classList.contains('hidden')) renderCosmetics();
  const sel = document.getElementById('select-lang');
  if (sel) sel.value = state.profile.settings.lang || 'en';
}

function bindGameControls() {
  document.getElementById('select-lang')?.addEventListener('change', (e) => {
    state.profile.settings.lang = e.target.value;
    saveProfile(state.profile);
    relocalize();
  });
  document.getElementById('toggle-reduce-motion')?.addEventListener('change', (e) => {
    state.profile.settings.reduceMotion = e.target.checked;
    saveProfile(state.profile);
    applyPreferences();
  });

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

  document.getElementById('btn-home-missions')?.addEventListener('click', () => { renderMissions(); showScreen('screen-missions'); });
  document.getElementById('btn-missions-back')?.addEventListener('click', () => { showScreen('screen-home'); refreshHome(); });
  document.getElementById('btn-home-stats')?.addEventListener('click', () => { renderStats(); showScreen('screen-stats'); });
  document.getElementById('btn-stats-back')?.addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-home-cosmetics')?.addEventListener('click', () => { renderCosmetics(); showScreen('screen-cosmetics'); });
  document.getElementById('btn-cosmetics-back')?.addEventListener('click', () => { showScreen('screen-home'); refreshHome(); });
  document.getElementById('btn-go-share')?.addEventListener('click', () => shareResult(state.lastResult));

  document.getElementById('select-difficulty')?.addEventListener('change', (e) => {
    state.profile.settings.difficulty = e.target.value;
    saveProfile(state.profile);
  });

  document.getElementById('btn-start-match')?.addEventListener('click', () => { openDraft(); showScreen('screen-draft'); });
  document.getElementById('btn-draft-back')?.addEventListener('click', () => showScreen('screen-squad'));
  document.getElementById('btn-draft-fight')?.addEventListener('click', startMatch);
  document.getElementById('btn-go-home')?.addEventListener('click', goHome);
  document.getElementById('btn-go-replay')?.addEventListener('click', restartMatch);
  document.getElementById('btn-go-squad')?.addEventListener('click', () => {
    document.getElementById('modal-gameover')?.classList.add('hidden');
    showScreen('screen-squad');
  });

  bindTransfer();
}

function bindTransfer() {
  const modal = document.getElementById('modal-transfer');
  const text = document.getElementById('transfer-text');
  const status = document.getElementById('transfer-status');
  const setStatus = (msg, cls) => { if (status) { status.textContent = msg; status.className = `transfer-status ${cls || ''}`; } };

  document.getElementById('btn-transfer-open')?.addEventListener('click', () => {
    if (text) text.value = '';
    setStatus('');
    modal?.classList.remove('hidden');
  });
  document.getElementById('btn-transfer-close')?.addEventListener('click', () => modal?.classList.add('hidden'));

  document.getElementById('btn-transfer-export')?.addEventListener('click', () => {
    if (!text) return;
    text.value = exportSaveCode(state.profile);
    text.focus();
    text.select();
    if (navigator.clipboard) navigator.clipboard.writeText(text.value).catch(() => {});
    setStatus(t('settings.transferExported'), 'ok');
  });

  document.getElementById('toggle-analytics')?.addEventListener('change', (e) => {
    state.profile.settings.analytics = e.target.checked;
    saveProfile(state.profile);
    initAnalytics();
  });

  document.getElementById('btn-transfer-import')?.addEventListener('click', () => {
    const parsed = importSaveCode(text ? text.value : '');
    if (!parsed) { setStatus(t('settings.transferInvalid'), 'err'); return; }
    state.profile = parsed;
    applyPreferences();
    saveProfile(state.profile);
    refreshHome();
    setStatus(t('settings.transferDone'), 'ok');
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
  applyPreferences();
  const daily = ensureDaily(state.profile);
  state.dailyGranted = daily.granted;
  saveProfile(state.profile);
  loadRemoteConfig();
  initAnalytics();

  bindMenu();
  bindSquad();
  bindCommandSheet();
  bindGameControls();
  bindMissions();
  bindDraft();
  bindCosmetics();
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
