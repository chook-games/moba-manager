import { state } from '../state.js';
import { SHOP_ITEMS } from '../data/items.js';
import { castAbility, abilityReady } from '../game/abilities.js';
import { applyItem } from '../game/combat.js';
import { updateManagerDashboardUI } from './hud.js';

let bound = false;

export function selectChampion(index) {
  if (state.selectedChampIndex === index) { closeCommandSheet(); return; }
  state.selectedChampIndex = index;
  state.blueChampions.forEach((c, i) => {
    if (c.mesh && c.mesh.userData.selRing) c.mesh.userData.selRing.visible = (i === index);
  });
  const sheet = document.getElementById('command-sheet');
  if (sheet) { sheet.classList.remove('sheet-hidden'); sheet.classList.add('sheet-visible'); }
  updateManagerDashboardUI();
}

export function closeCommandSheet() {
  state.selectedChampIndex = -1;
  state.blueChampions.forEach((c) => {
    if (c.mesh && c.mesh.userData.selRing) c.mesh.userData.selRing.visible = false;
  });
  const sheet = document.getElementById('command-sheet');
  if (sheet) { sheet.classList.remove('sheet-visible'); sheet.classList.add('sheet-hidden'); }
  updateManagerDashboardUI();
}

export function switchSheetTab(tabName) {
  state.activeSheetTab = tabName;
  ['tactics', 'support', 'shop'].forEach((t) => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const panel = document.getElementById(`tab-panel-${t}`);
    if (!btn || !panel) return;
    const active = t === tabName;
    btn.classList.toggle('is-active', active);
    panel.classList.toggle('hidden', !active);
    panel.classList.toggle('flex', active);
  });
}

export function setChampionOrder(orderName) {
  const c = state.blueChampions[state.selectedChampIndex];
  if (!c) return;
  c.order = orderName;
  updateManagerDashboardUI();
}

export function setTeamOrder(orderName) {
  state.blueChampions.forEach((c) => { c.order = orderName; });
  updateManagerDashboardUI();
}

export function setSupportEscortTarget(allyIndex) {
  state.supportTargetIndex = allyIndex;
  renderSupportTargetsBar();
  updateManagerDashboardUI();
}

export function setTargetPriority(prioIdx) {
  state.priorityIndex = prioIdx;
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`prio-${i}`);
    if (btn) btn.classList.toggle('is-active', i === prioIdx);
  }
}

export function renderSupportTargetsBar() {
  const container = document.getElementById('support-targets-row');
  if (!container) return;
  container.innerHTML = state.blueChampions.map((ally, idx) => {
    const active = idx === state.supportTargetIndex;
    return `
      <button class="support-btn ${active ? 'is-active' : ''}" data-support-index="${idx}">
        ${active ? '🛡️ ' : ''}${ally.name}
      </button>`;
  }).join('');
}

export function renderItemShop() {
  const row = document.getElementById('item-shop-row');
  if (!row) return;
  row.innerHTML = SHOP_ITEMS.map((item) => `
    <div class="shop-item" data-item="${item.id}">
      <div class="shop-item-top">
        <div class="shop-item-badge" style="background:${item.color}">${item.letter}</div>
        <span class="shop-item-cost">${item.cost}G</span>
      </div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-desc">${item.desc}</div>
    </div>`).join('');
}

export function buyItem(itemId) {
  const c = state.blueChampions[state.selectedChampIndex];
  const item = SHOP_ITEMS.find((x) => x.id === itemId);
  if (!c || !item) return;
  const fb = document.getElementById('shop-feedback');
  const show = (text, cls) => {
    if (!fb) return;
    fb.textContent = text;
    fb.className = `shop-feedback ${cls}`;
    setTimeout(() => { fb.className = 'shop-feedback'; }, 1400);
  };
  if (c.items.length >= 6) return show('Full (6/6)', 'err');
  if (c.gold < item.cost) return show(`Need ${item.cost}G!`, 'err');
  applyItem(c, item);
  show(`+ ${item.name}!`, 'ok');
  updateManagerDashboardUI();
}

export function castSelectedUltimate() {
  const c = state.blueChampions[state.selectedChampIndex];
  if (!c) return;
  if (!abilityReady(c)) return;
  castAbility(c);
  updateManagerDashboardUI();
}

export function bindCommandSheet() {
  if (bound) return;
  bound = true;

  const squadRow = document.getElementById('squad-cards-row');
  squadRow?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-index]');
    if (card) selectChampion(Number(card.dataset.index));
  });

  const supportRow = document.getElementById('support-targets-row');
  supportRow?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-support-index]');
    if (btn) setSupportEscortTarget(Number(btn.dataset.supportIndex));
  });

  const shopRow = document.getElementById('item-shop-row');
  shopRow?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-item]');
    if (card) buyItem(card.dataset.item);
  });

  document.getElementById('btn-close-sheet')?.addEventListener('click', closeCommandSheet);
  document.getElementById('btn-ultimate')?.addEventListener('click', castSelectedUltimate);

  document.getElementById('tab-btn-tactics')?.addEventListener('click', () => switchSheetTab('tactics'));
  document.getElementById('tab-btn-support')?.addEventListener('click', () => switchSheetTab('support'));
  document.getElementById('tab-btn-shop')?.addEventListener('click', () => switchSheetTab('shop'));

  ['FARM', 'PUSH', 'DEFEND', 'GANK', 'FIGHT', 'RETREAT'].forEach((ord) => {
    document.getElementById(`order-${ord}`)?.addEventListener('click', () => setChampionOrder(ord));
  });

  for (let i = 0; i < 4; i++) {
    document.getElementById(`prio-${i}`)?.addEventListener('click', () => setTargetPriority(i));
  }

  document.getElementById('btn-team-farm')?.addEventListener('click', () => { setTeamOrder('FARM'); toggleMacro(false); });
  document.getElementById('btn-team-push')?.addEventListener('click', () => { setTeamOrder('PUSH'); toggleMacro(false); });
  document.getElementById('btn-team-fight')?.addEventListener('click', () => { setTeamOrder('FIGHT'); toggleMacro(false); });
  document.getElementById('btn-team-retreat')?.addEventListener('click', () => { setTeamOrder('RETREAT'); toggleMacro(false); });

  document.getElementById('btn-macro-toggle')?.addEventListener('click', () => toggleMacro());
}

export function toggleMacro(force) {
  const pop = document.getElementById('macro-popover');
  if (!pop) return;
  if (typeof force === 'boolean') pop.classList.toggle('hidden', !force);
  else pop.classList.toggle('hidden');
}
