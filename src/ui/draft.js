// Draft / ban phase: the manager bans up to 2 champions from the enemy pool.
import { state } from '../state.js';
import { t } from '../core/i18n.js';
import { CHAMPION_POOL, ROLE_COLORS } from '../data/champions.js';
import { getSelectedSquad } from './squad.js';
import { sfx } from '../core/audio.js';

export const MAX_BANS = 2;
let bound = false;

export function openDraft() {
  state.bans = [];
  renderDraft();
}

export function renderDraft() {
  const squad = getSelectedSquad();
  const banned = state.bans || [];
  const left = MAX_BANS - banned.length;
  const leftEl = document.getElementById('draft-bans-left');
  if (leftEl) leftEl.textContent = left;

  const grid = document.getElementById('draft-grid');
  if (!grid) return;
  grid.innerHTML = CHAMPION_POOL.filter((c) => !squad.includes(c.id)).map((c) => {
    const isBanned = banned.includes(c.id);
    const rc = ROLE_COLORS[c.role];
    const style = isBanned
      ? `border:2px solid #f43f5e; background: rgba(244,63,94,0.18); opacity:0.7;`
      : `border:1px solid #1e293b; background:#141b26;`;
    return `
      <div class="champ-card ${isBanned ? 'is-banned' : ''}" data-ban="${c.id}" style="${style}">
        <div class="champ-avatar" style="background:${rc.bg};color:${rc.hex};border:1px solid ${rc.border}44">${rc.letter}</div>
        <div class="champ-name">${c.name}</div>
        <div class="champ-role" style="color:${rc.hex}">${t(`role.${c.role}`)}</div>
        ${isBanned ? `<div class="champ-locked">🚫</div>` : ''}
      </div>`;
  }).join('');
}

function toggleBan(id) {
  const banned = state.bans;
  const i = banned.indexOf(id);
  if (i > -1) banned.splice(i, 1);
  else if (banned.length < MAX_BANS) banned.push(id);
  else return;
  sfx.ui();
  renderDraft();
}

export function bindDraft() {
  if (bound) return;
  bound = true;
  document.getElementById('draft-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-ban]');
    if (card) toggleBan(card.dataset.ban);
  });
}
