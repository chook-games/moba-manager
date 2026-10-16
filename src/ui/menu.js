import { state } from '../state.js';
import { APP_VERSION } from '../config.js';
import { t } from '../core/i18n.js';
import { CHAMPION_POOL, ROLE_COLORS } from '../data/champions.js';
import { MODE_LIST } from '../data/modes.js';
import { accountXpToNext, masteryXpToNext } from '../data/progression.js';
import { isUnlocked, unlockChampion, unlockCost, resetProfile, saveProfile } from '../storage.js';
import { showScreen } from './nav.js';
import { renderSquadSelectionGrid } from './squad.js';
import { refreshVolume } from '../core/audio.js';
import { cloudStatusKey } from '../core/cloud.js';
import { replayTutorial } from './tutorial.js';

export function refreshHome() {
  const p = state.profile;
  if (!p) return;
  setText('home-level', p.level);
  setText('home-gold', Math.floor(p.gold));
  setText('home-wins', p.stats.wins);
  setText('home-matches', p.stats.matches);
  const wr = p.stats.matches ? Math.round((p.stats.wins / p.stats.matches) * 100) : 0;
  setText('home-winrate', `${wr}%`);

  const need = accountXpToNext(p.level);
  const pct = Math.min(100, Math.round((p.xp / need) * 100));
  const fill = document.getElementById('home-xp-fill');
  if (fill) fill.style.width = `${pct}%`;
  setText('home-xp-text', `${Math.floor(p.xp)} / ${need} XP`);

  const banner = document.getElementById('daily-banner');
  if (banner && p.daily) {
    const streak = p.daily.streak || 0;
    if (streak > 0) {
      banner.classList.remove('hidden');
      banner.classList.toggle('granted', state.dailyGranted > 0);
      banner.textContent = state.dailyGranted > 0
        ? t('missions.dailyReward', { gold: state.dailyGranted, n: streak })
        : t('missions.streak', { n: streak });
    } else {
      banner.classList.add('hidden');
    }
  }
}

export function renderModeList() {
  const wrap = document.getElementById('mode-list');
  if (!wrap) return;
  const p = state.profile;
  wrap.innerHTML = MODE_LIST.map((m) => {
    const locked = p.level < m.unlockLevel;
    return `
      <div class="mode-card ${locked ? 'is-locked' : ''}" data-mode="${m.id}" style="border-color:${locked ? '#334155' : m.color}">
        <div class="mode-head" style="color:${m.color}">
          <span class="mode-icon">${m.icon}</span>
          <span class="mode-name">${t(`mode.${m.id}.name`)}</span>
          ${locked ? `<span class="mode-lock">${t('mode.lock', { lv: m.unlockLevel })}</span>` : ''}
        </div>
        <div class="mode-tagline">${t(`mode.${m.id}.tagline`)}</div>
        <div class="mode-desc">${t(`mode.${m.id}.desc`)}</div>
        ${locked ? '' : `<div class="mode-cta">${t('mode.choose')}</div>`}
      </div>`;
  }).join('');
}

export function renderRoster() {
  setText('roster-gold', Math.floor(state.profile.gold));
  const list = document.getElementById('roster-list');
  if (!list) return;
  list.innerHTML = CHAMPION_POOL.map((c) => {
    const unlocked = isUnlocked(state.profile, c.id);
    const rc = ROLE_COLORS[c.role];
    const m = state.profile.mastery[c.id];
    const mLevel = m ? m.level : 1;
    const mInfo = m ? t('roster.mastery', { lv: mLevel }) : t('roster.notPlayed');
    const action = unlocked
      ? `<div class="roster-owned">${t('roster.owned')}</div>`
      : `<button class="roster-buy" data-unlock="${c.id}" ${state.profile.gold < c.unlockCost ? 'disabled' : ''}>${t('roster.unlock', { cost: c.unlockCost })}</button>`;
    return `
      <div class="roster-row" style="border-left:3px solid ${rc.hex}">
        <div class="roster-avatar" style="background:${rc.bg};color:${rc.hex}">${rc.letter}</div>
        <div class="roster-info">
          <div class="roster-name">${c.name} <span class="muted">${t(`role.${c.role}`)}</span></div>
          <div class="roster-tip">${t(`roleTip.${c.role}`)}</div>
          <div class="roster-meta">${mInfo} · HP ${c.hp} · AD ${c.ad} · AP ${c.ap}</div>
        </div>
        ${action}
      </div>`;
  }).join('');
}

export function bindMenu() {
  document.getElementById('btn-home-play')?.addEventListener('click', () => {
    renderModeList();
    showScreen('screen-mode');
  });
  document.getElementById('btn-home-roster')?.addEventListener('click', () => {
    renderRoster();
    showScreen('screen-roster');
  });
  document.getElementById('btn-home-settings')?.addEventListener('click', () => {
    renderSettings();
    showScreen('screen-settings');
  });
  document.getElementById('btn-mode-back')?.addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-roster-back')?.addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-settings-back')?.addEventListener('click', () => showScreen('screen-home'));

  const modeList = document.getElementById('mode-list');
  modeList?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-mode]');
    if (!card) return;
    const id = card.dataset.mode;
    const mode = MODE_LIST.find((m) => m.id === id);
    if (state.profile.level < mode.unlockLevel) return;
    state.pendingModeId = id;
    showScreen('screen-squad');
    renderSquadSelectionGrid();
  });

  const roster = document.getElementById('roster-list');
  roster?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-unlock]');
    if (!btn) return;
    if (unlockChampion(state.profile, btn.dataset.unlock)) renderRoster();
  });

  const hapticToggle = document.getElementById('toggle-haptic');
  hapticToggle?.addEventListener('change', () => {
    state.profile.settings.haptic = hapticToggle.checked;
    saveProfile(state.profile);
  });

  const soundToggle = document.getElementById('toggle-sound');
  soundToggle?.addEventListener('change', () => {
    state.profile.settings.muted = !soundToggle.checked;
    saveProfile(state.profile);
    refreshVolume();
  });

  const volumeSlider = document.getElementById('volume-slider');
  volumeSlider?.addEventListener('input', () => {
    state.profile.settings.audioVolume = Number(volumeSlider.value) / 100;
    saveProfile(state.profile);
    refreshVolume();
  });

  document.getElementById('btn-replay-tutorial')?.addEventListener('click', replayTutorial);

  document.getElementById('btn-reset-save')?.addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      state.profile = resetProfile();
      refreshHome();
      renderRoster();
    }
  });
}

function renderSettings() {
  const s = state.profile.settings;
  const haptic = document.getElementById('toggle-haptic');
  if (haptic) haptic.checked = !!s.haptic;
  const sound = document.getElementById('toggle-sound');
  if (sound) sound.checked = !s.muted;
  const vol = document.getElementById('volume-slider');
  if (vol) vol.value = Math.round((typeof s.audioVolume === 'number' ? s.audioVolume : 0.6) * 100);
  const langSel = document.getElementById('select-lang');
  if (langSel) langSel.value = s.lang || 'en';
  const rm = document.getElementById('toggle-reduce-motion');
  if (rm) rm.checked = !!s.reduceMotion;
  const an = document.getElementById('toggle-analytics');
  if (an) an.checked = !!s.analytics;
  const diff = document.getElementById('select-difficulty');
  if (diff) diff.value = s.difficulty || 'normal';
  setText('cloud-status', t(cloudStatusKey()));
  setText('app-version', `v${APP_VERSION}`);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
