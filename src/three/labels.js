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

    const hpFill = u.labelEl.querySelector('.hp-fill');
    if (hpFill) hpFill.style.width = `${clamp((u.hp / u.maxHp) * 100, 0, 100)}%`;

    if (u.role) {
      const detailTag = u.labelEl.querySelector('.detail-tag');
      if (detailTag) {
        if (u === selected) {
          detailTag.classList.remove('hidden');
          detailTag.querySelector('.lvl-badge').textContent = `Lv.${u.level}`;
          detailTag.querySelector('.stance-badge').textContent = u.order;
        } else {
          detailTag.classList.add('hidden');
        }
      }

      const escortTag = u.labelEl.querySelector('.escort-tag');
      if (escortTag) {
        const isEscorted = u.team === 'blue' && state.blueChampions[state.supportTargetIndex] === u;
        const show = isEscorted && selected && state.activeSheetTab === 'support';
        escortTag.classList.toggle('hidden', !show);
      }
    }
  });
}

export function clearLabels() {
  const layer = document.getElementById('labels-layer');
  if (layer) layer.innerHTML = '';
}
