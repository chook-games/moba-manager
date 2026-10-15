import { state } from '../state.js';
import { CHAMPION_POOL, ROLE_COLORS, DEFAULT_SQUAD_IDS } from '../data/champions.js';
import { isUnlocked, unlockCost } from '../storage.js';
import { showScreen } from './nav.js';

let selectedSquadIds = [...DEFAULT_SQUAD_IDS];

export function getSelectedSquad() {
  return selectedSquadIds.slice(0, 5);
}

export function renderSquadSelectionGrid() {
  const profile = state.profile;
  const remaining = 5 - selectedSquadIds.length;
  const sub = document.getElementById('squad-subtitle');
  if (sub) {
    sub.textContent = remaining === 0
      ? 'Squad ready — tap to swap'
      : `Pick ${remaining} more champion${remaining !== 1 ? 's' : ''}`;
  }

  const tray = document.getElementById('selected-pills-tray');
  if (tray) {
    tray.innerHTML = selectedSquadIds.length === 0
      ? `<span class="muted-note">Tap champions below to build your team…</span>`
      : selectedSquadIds.map((id) => {
          const c = CHAMPION_POOL.find((x) => x.id === id);
          const rc = ROLE_COLORS[c.role];
          return `<button class="pill" data-unpick="${c.id}" style="background:${rc.bg};border-color:${rc.border};color:${rc.hex}">${c.name}</button>`;
        }).join('');
  }

  const grid = document.getElementById('champions-grid');
  if (grid) {
    grid.innerHTML = CHAMPION_POOL.map((c) => {
      const unlocked = isUnlocked(profile, c.id);
      const isSel = selectedSquadIds.includes(c.id);
      const rc = ROLE_COLORS[c.role];
      const style = isSel
        ? `border:2px solid ${rc.border}; background:${rc.bg};`
        : (unlocked ? `border:1px solid #1e293b; background:#141b26;` : `border:1px dashed #334155; background:#0f1620; opacity:0.75;`);
      const badge = !unlocked
        ? `<div class="champ-locked">🔒 ${unlockCost(c.id)}G</div>`
        : '';
      return `
        <div class="champ-card ${isSel ? 'is-picked' : ''}" data-champ="${c.id}" style="${style}">
          <div class="champ-avatar" style="background:${rc.bg};color:${rc.hex};border:1px solid ${rc.border}44">${rc.letter}</div>
          <div class="champ-name">${c.name}</div>
          <div class="champ-role" style="color:${rc.hex}">${c.role}</div>
          <div class="champ-stats">HP ${c.hp} · AD ${c.ad}</div>
          ${badge}
        </div>`;
    }).join('');
  }

  updateStartButton(remaining);
}

function updateStartButton(remaining) {
  const startBtn = document.getElementById('btn-start-match');
  if (!startBtn) return;
  if (selectedSquadIds.length === 5) {
    startBtn.disabled = false;
    startBtn.textContent = '▶ START GAME';
  } else {
    startBtn.disabled = true;
    startBtn.textContent = `SELECT ${remaining} MORE`;
  }
}

export function toggleChampionPick(champId) {
  if (!isUnlocked(state.profile, champId)) {
    showScreen('screen-roster');
    return;
  }
  const idx = selectedSquadIds.indexOf(champId);
  if (idx > -1) selectedSquadIds.splice(idx, 1);
  else if (selectedSquadIds.length < 5) selectedSquadIds.push(champId);
  renderSquadSelectionGrid();
}

export function selectDefaultFive() {
  const unlockedDefaults = DEFAULT_SQUAD_IDS.filter((id) => isUnlocked(state.profile, id));
  selectedSquadIds = unlockedDefaults.slice(0, 5);
  if (selectedSquadIds.length < 5) {
    const pool = CHAMPION_POOL.filter((c) => isUnlocked(state.profile, c.id) && !selectedSquadIds.includes(c.id));
    while (selectedSquadIds.length < 5 && pool.length) selectedSquadIds.push(pool.shift().id);
  }
  renderSquadSelectionGrid();
}

export function autoFillSquad() {
  const unlocked = CHAMPION_POOL.filter((c) => isUnlocked(state.profile, c.id));
  const byRole = {};
  unlocked.forEach((c) => { (byRole[c.role] = byRole[c.role] || []).push(c.id); });
  const wanted = ['Tank', 'Marksman', 'Mage', 'Assassin', 'Support'];
  const picks = [];
  wanted.forEach((r) => { if (byRole[r] && byRole[r].length) picks.push(byRole[r][0]); });
  unlocked.forEach((c) => { if (picks.length < 5 && !picks.includes(c.id)) picks.push(c.id); });
  selectedSquadIds = picks.slice(0, 5);
  renderSquadSelectionGrid();
}

export function bindSquad() {
  const grid = document.getElementById('champions-grid');
  grid?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-champ]');
    if (card) toggleChampionPick(card.dataset.champ);
  });
  const tray = document.getElementById('selected-pills-tray');
  tray?.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-unpick]');
    if (pill) toggleChampionPick(pill.dataset.unpick);
  });
  document.getElementById('btn-squad-back')?.addEventListener('click', () => showScreen('screen-mode'));
  document.getElementById('btn-squad-balanced')?.addEventListener('click', selectDefaultFive);
  document.getElementById('btn-squad-auto')?.addEventListener('click', autoFillSquad);
}
