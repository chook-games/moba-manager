// Cosmetics screen: champion skins (colour variants) + profile title.
import { state } from '../state.js';
import { t } from '../core/i18n.js';
import { saveProfile } from '../storage.js';
import { CHAMPION_POOL, ROLE_COLORS } from '../data/champions.js';
import { SKIN_LIST, TITLES, unlockedTitles, getSkin } from '../data/cosmetics.js';
import { sfx } from '../core/audio.js';
import { haptics } from '../core/haptics.js';

let bound = false;

export function renderCosmetics() {
  const p = state.profile;
  if (!p || !p.cosmetics) return;
  const cos = p.cosmetics;

  setText('cosmetics-gold', Math.floor(p.gold));

  const titlesEl = document.getElementById('cosmetics-titles');
  if (titlesEl) {
    const unlocked = unlockedTitles(p.level).map((x) => x.id);
    titlesEl.innerHTML = TITLES.map((tl) => {
      const has = unlocked.includes(tl.id);
      const sel = cos.title === tl.id;
      return `<button class="title-chip ${sel ? 'is-active' : ''} ${has ? '' : 'is-locked'}" data-title="${tl.id}" ${has ? '' : 'disabled'}>
        ${has ? '' : '🔒 '}${t(`title.${tl.id}`)}</button>`;
    }).join('');
  }

  const skinsEl = document.getElementById('cosmetics-skins');
  if (skinsEl) {
    skinsEl.innerHTML = CHAMPION_POOL.map((c) => {
      const rc = ROLE_COLORS[c.role];
      const current = cos.skins[c.id] || 'default';
      const swatches = SKIN_LIST.map((s) => {
        const owned = cos.unlockedSkins.includes(s.id);
        const sel = current === s.id;
        const colorHex = s.tint != null ? `#${s.tint.toString(16).padStart(6, '0')}` : rc.hex;
        const cls = `swatch ${sel ? 'is-active' : ''} ${owned ? '' : 'is-locked'}`;
        return `<button class="${cls}" data-skin="${s.id}" data-champ="${c.id}" style="--sw:${colorHex}"
          title="${s.name}${owned ? '' : ` · 🪙${s.cost}`}">${owned ? '' : '🔒'}</button>`;
      }).join('');
      return `
        <div class="skin-row">
          <div class="skin-name" style="color:${rc.hex}">${c.name}</div>
          <div class="swatches">${swatches}</div>
        </div>`;
    }).join('');
  }
}

function buyOrEquip(champId, skinId) {
  const p = state.profile;
  const cos = p.cosmetics;
  const skin = getSkin(skinId);
  if (!cos.unlockedSkins.includes(skinId)) {
    if (p.gold < skin.cost) { sfx.ui(); return false; }
    p.gold -= skin.cost;
    cos.unlockedSkins.push(skinId);
  }
  cos.skins[champId] = skinId;
  sfx.kill(); haptics.tap();
  saveProfile(p);
  return true;
}

function setTitle(id) {
  const p = state.profile;
  if (p.level < (TITLES.find((x) => x.id === id) || {}).level) return;
  p.cosmetics.title = id;
  sfx.ui(); haptics.tap();
  saveProfile(p);
}

export function bindCosmetics() {
  if (bound) return;
  bound = true;
  const el = document.getElementById('screen-cosmetics');
  el?.addEventListener('click', (e) => {
    const titleBtn = e.target.closest('[data-title]');
    if (titleBtn) { setTitle(titleBtn.dataset.title); renderCosmetics(); return; }
    const sw = e.target.closest('[data-skin]');
    if (sw) { buyOrEquip(sw.dataset.champ, sw.dataset.skin); renderCosmetics(); }
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
