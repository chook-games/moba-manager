import { state } from '../state.js';
import { formatTime, clamp } from '../utils.js';
import { ROLE_COLORS } from '../data/champions.js';
import { abilityCooldownInfo } from '../game/abilities.js';

export function updateManagerDashboardUI() {
  if (state.blueChampions.length === 0) return;

  const { blueKills, redKills, matchTimeSeconds, structures } = state;
  setText('hud-blue-kills', blueKills);
  setText('hud-red-kills', redKills);
  setText('hud-timer', formatTime(matchTimeSeconds));

  const bNex = structures.find((s) => s.id === 'blue_nexus');
  const rNex = structures.find((s) => s.id === 'red_nexus');
  if (bNex) setText('hud-blue-nexus', `${Math.ceil((bNex.hp / bNex.maxHp) * 100)}%`);
  if (rNex) setText('hud-red-nexus', `${Math.ceil((rNex.hp / rNex.maxHp) * 100)}%`);

  renderSquadDock();
  renderSelectedSheet();
}

function renderSquadDock() {
  const row = document.getElementById('squad-cards-row');
  if (!row) return;
  row.innerHTML = state.blueChampions.map((c, idx) => {
    const isSel = idx === state.selectedChampIndex;
    const isEscorted = idx === state.supportTargetIndex;
    const rc = ROLE_COLORS[c.role];
    const hpPct = clamp((c.hp / c.maxHp) * 100, 0, 100);
    const hpColor = c.dead ? 'hp-dead' : (hpPct > 50 ? 'hp-high' : (hpPct > 25 ? 'hp-mid' : 'hp-low'));
    return `
      <div class="squad-card ${isSel ? 'is-selected' : ''}" data-index="${idx}">
        <div class="squad-card-top">
          <span class="role-letter" style="color:${rc.hex}">${rc.letter}</span>
          <span class="squad-gold">${Math.floor(c.gold)}G</span>
        </div>
        <div class="squad-name">${isEscorted ? '🛡️' : ''}${c.name}</div>
        <div class="bar"><div class="bar-fill ${hpColor}" style="width:${hpPct}%"></div></div>
        <div class="squad-card-bottom">
          <span class="squad-order">${c.dead ? 'DEAD' : c.order}</span>
          <span class="squad-kda">${c.kills}/${c.deaths}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderSelectedSheet() {
  const idx = state.selectedChampIndex;
  if (idx < 0 || !state.blueChampions[idx]) return;
  const sel = state.blueChampions[idx];
  const rc = ROLE_COLORS[sel.role];

  setText('sel-name', sel.name);
  const roleEl = document.getElementById('sel-role');
  if (roleEl) {
    roleEl.textContent = sel.role;
    roleEl.style.color = rc.hex;
    roleEl.style.backgroundColor = rc.bg;
  }
  setText('sel-level', `Lv.${sel.level}`);
  setText('sel-hp', Math.ceil(sel.hp));
  setText('sel-ad', sel.ad);
  setText('sel-ap', sel.ap);
  setText('sel-armor', sel.armor);
  setText('sel-as', sel.as.toFixed(2));
  setText('sel-ls', `${sel.ls}%`);
  setText('sel-gold', `${Math.floor(sel.gold)}G`);

  const itemsContainer = document.getElementById('sel-items-row');
  if (itemsContainer) {
    let html = '';
    for (let i = 0; i < 4; i++) {
      const it = sel.items[i];
      html += it
        ? `<div class="item-slot" style="background:${it.color}">${it.letter}</div>`
        : `<div class="item-slot empty"></div>`;
    }
    itemsContainer.innerHTML = html;
  }

  ['FARM', 'PUSH', 'DEFEND', 'RETREAT'].forEach((ord) => {
    const btn = document.getElementById(`order-${ord}`);
    if (btn) btn.classList.toggle('is-active', sel.order === ord);
  });

  // Escort chooser is only relevant for a Support hero.
  const supportSection = document.getElementById('support-section');
  if (supportSection) supportSection.classList.toggle('hidden', sel.role !== 'Support');

  renderUltimateButton(sel);
}

function renderUltimateButton(sel) {
  const btn = document.getElementById('btn-ultimate');
  const info = abilityCooldownInfo(sel);
  if (!btn || !info) return;
  const labelEl = document.getElementById('ultimate-label');
  const cdEl = document.getElementById('ultimate-cd');
  if (labelEl) labelEl.textContent = info.name;
  if (cdEl) cdEl.textContent = info.ready ? 'READY' : `${Math.ceil(info.remaining)}s`;
  btn.classList.toggle('is-ready', info.ready);
  btn.classList.toggle('is-cooling', !info.ready);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
