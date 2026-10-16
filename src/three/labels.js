import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { clamp } from '../utils.js';

const tempV = new THREE.Vector3();

export function createUnitLabelElement(name, team, isStructure) {
  const layer = document.getElementById('labels-layer');
  const div = document.createElement('div');
  div.className = 'unit-label';

  const barClass = team === 'blue' ? 'bar-blue' : 'bar-red';
  if (isStructure) {
    div.innerHTML = `
      <div class="structure-bar"><div class="hp-fill ${barClass}" style="width:100%"></div></div>
    `;
    div._refs = { hpFill: div.querySelector('.hp-fill') };
  } else {
    div.innerHTML = `
      <div class="detail-tag hidden">
        <span class="lvl-badge">Lv.1</span>
        <span class="unit-name">${name}</span>
        <span class="stance-badge">PUSH</span>
      </div>
      <div class="escort-tag hidden">🛡️ Protected</div>
      <div class="micro-bar"><div class="hp-fill ${barClass}" style="width:100%"></div></div>
    `;
    div._refs = {
      detailTag: div.querySelector('.detail-tag'),
      lvlBadge: div.querySelector('.lvl-badge'),
      stanceBadge: div.querySelector('.stance-badge'),
      escortTag: div.querySelector('.escort-tag'),
      hpFill: div.querySelector('.hp-fill'),
    };
  }
  layer.appendChild(div);
  return div;
}

export function updateFloatingLabels() {
  const container = document.getElementById('viewport-container');
  if (!container || !state.camera) return;
  const width = container.clientWidth;
  const height = container.clientHeight;

  const allLabeled = [...state.structures, ...state.blueChampions, ...state.redChampions];
  const selected = state.selectedChampIndex >= 0 ? state.blueChampions[state.selectedChampIndex] : null;

  allLabeled.forEach((u) => {
    if (!u.labelEl) return;
    if (u.dead) { u.labelEl.style.opacity = '0'; return; }

    tempV.set(u.x, u.type ? CONFIG.LABEL_Z_STRUCTURE : CONFIG.LABEL_Z_UNIT, u.z);
    tempV.project(state.camera);

    if (tempV.z > 1) { u.labelEl.style.opacity = '0'; return; }

    u.labelEl.style.opacity = '1';
    u.labelEl.style.left = `${(tempV.x * 0.5 + 0.5) * width}px`;
    u.labelEl.style.top = `${(-(tempV.y * 0.5) + 0.5) * height}px`;

    const refs = u.labelEl._refs;
    if (refs) {
      if (refs.hpFill) refs.hpFill.style.width = `${clamp((u.hp / u.maxHp) * 100, 0, 100)}%`;
    } else {
      const hpFill = u.labelEl.querySelector('.hp-fill');
      if (hpFill) hpFill.style.width = `${clamp((u.hp / u.maxHp) * 100, 0, 100)}%`;
    }

    if (u.role && refs) {
      if (refs.detailTag) {
        if (u === selected) {
          refs.detailTag.classList.remove('hidden');
          if (refs.lvlBadge) refs.lvlBadge.textContent = `Lv.${u.level}`;
          if (refs.stanceBadge) refs.stanceBadge.textContent = u.order;
        } else {
          refs.detailTag.classList.add('hidden');
        }
      }
      if (refs.escortTag) {
        const isEscorted = u.team === 'blue' && state.blueChampions[state.supportTargetIndex] === u;
        const show = isEscorted && !!selected && selected.role === 'Support';
        refs.escortTag.classList.toggle('hidden', !show);
      }
    }
  });
}

export function clearLabels() {
  const layer = document.getElementById('labels-layer');
  if (layer) layer.innerHTML = '';
}
