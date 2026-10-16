import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { formatTime, clamp } from '../utils.js';
import { t } from '../core/i18n.js';
import { ROLE_COLORS } from '../data/champions.js';
import { getMode } from '../data/modes.js';
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

  const waveEl = document.getElementById('hud-wave');
  if (waveEl) {
    if (getMode(state.currentModeId).hasMinions) {
      const rem = Math.max(0, Math.ceil(CONFIG.WAVE_INTERVAL - state.minionWaveTimer));
      waveEl.textContent = t('game.wave', { s: rem });
      waveEl.classList.remove('hidden');
    } else {
      waveEl.classList.add('hidden');
    }
  }

  renderSquadDock();
  renderSelectedSheet();
}

function renderSquadDock() {
  const row = document.getElementById('squad-cards-row');
  if (!row) return;

  // Build once per match; afterwards only patch the dynamic values. Rebuilding the
  // innerHTML every refresh made taps get lost (the node was replaced mid-tap).
  if (row.querySelectorAll('.squad-card').length !== state.blueChampions.length) {
    row.innerHTML = state.blueChampions.map((c, idx) => {
      const rc = ROLE_COLORS[c.role];
      return `
        <div class="squad-card" data-index="${idx}">
          <div class="squad-card-top">
            <span class="role-letter" style="color:${rc.hex}">${rc.letter}</span>
            <span class="squad-gold"></span>
          </div>
          <div class="squad-name"></div>
          <div class="bar"><div class="bar-fill"></div></div>
          <div class="squad-card-bottom">
            <span class="squad-order"></span>
            <span class="squad-kda"></span>
          </div>
        </div>`;
    }).join('');
  }

  state.blueChampions.forEach((c, idx) => {
    const card = row.children[idx];
    if (!card) return;
    card.classList.toggle('is-selected', idx === state.selectedChampIndex);

    const gold = card.querySelector('.squad-gold');
    if (gold) gold.textContent = `${Math.floor(c.gold)}G`;

    const name = card.querySelector('.squad-name');
    if (name) name.textContent = `${idx === state.supportTargetIndex ? '🛡️' : ''}${c.name}`;

    const hpPct = clamp((c.hp / c.maxHp) * 100, 0, 100);
    const fill = card.querySelector('.bar-fill');
    if (fill) {
      fill.style.width = `${hpPct}%`;
      fill.className = `bar-fill ${c.dead ? 'hp-dead' : (hpPct > 50 ? 'hp-high' : (hpPct > 25 ? 'hp-mid' : 'hp-low'))}`;
    }

    const order = card.querySelector('.squad-order');
    if (order) order.textContent = c.dead ? 'DEAD' : c.order;

    const kda = card.querySelector('.squad-kda');
    if (kda) kda.textContent = `${c.kills}/${c.deaths}`;
  });
}

function renderSelectedSheet() {
  const idx = state.selectedChampIndex;
  if (idx < 0 || !state.blueChampions[idx]) return;
  const sel = state.blueChampions[idx];
  const rc = ROLE_COLORS[sel.role];

  setText('sel-name', sel.name);
  const roleEl = document.getElementById('sel-role');
  if (roleEl) {
    roleEl.textContent = t(`role.${sel.role}`);
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
  renderAbility2Button(sel);
  renderPerkButton(sel);
}

function renderAbility2Button(sel) {
  const btn = document.getElementById('btn-ability2');
  const info = abilityCooldownInfo(sel, 2);
  if (!btn || !info) return;
  const labelEl = document.getElementById('ability2-label');
  const cdEl = document.getElementById('ability2-cd');
  if (labelEl) labelEl.textContent = info.name;
  if (cdEl) cdEl.textContent = info.ready ? t('ultimate.ready') : `${Math.ceil(info.remaining)}s`;
  btn.classList.toggle('is-ready', info.ready);
  btn.classList.toggle('is-cooling', !info.ready);
}

function renderPerkButton(sel) {
  const btn = document.getElementById('btn-perk');
  if (!btn) return;
  const pts = sel.perkPoints || 0;
  btn.classList.toggle('hidden', pts <= 0);
  const cnt = document.getElementById('perk-count');
  if (cnt) cnt.textContent = pts;
}

function renderUltimateButton(sel) {
  const btn = document.getElementById('btn-ultimate');
  const info = abilityCooldownInfo(sel);
  if (!btn || !info) return;
  const labelEl = document.getElementById('ultimate-label');
  const cdEl = document.getElementById('ultimate-cd');
  if (labelEl) labelEl.textContent = info.name;
  if (cdEl) cdEl.textContent = info.ready ? t('ultimate.ready') : `${Math.ceil(info.remaining)}s`;
  btn.classList.toggle('is-ready', info.ready);
  btn.classList.toggle('is-cooling', !info.ready);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
