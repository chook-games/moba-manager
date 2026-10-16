// "Juice": kill feed, screen flash, camera shake, 3D bursts/sparks + audio/haptics hooks.
import { state } from '../state.js';
import { sfx } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { reduceMotionEnabled } from '../core/preferences.js';

const TEAM_COLOR = { blue: 0x38bdf8, red: 0xf87171 };

export function shake(mag) {
  if (reduceMotionEnabled()) return;
  state.camShake = Math.min(1.2, (state.camShake || 0) + mag);
}

export function flash(color, durationMs) {
  if (reduceMotionEnabled()) return;
  const el = document.getElementById('screen-flash');
  if (!el) return;
  el.style.transition = 'none';
  el.style.background = color;
  el.style.opacity = '1';
  requestAnimationFrame(() => {
    el.style.transition = `opacity ${durationMs}ms ease-out`;
    el.style.opacity = '0';
  });
}

function burst(x, z, colorHex, radius, life) {
  if (!state.effectsGroup) return;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.25, radius, 32),
    new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.2, z);
  state.effectsGroup.add(ring);
  state.visualBeams.push({ mesh: ring, life, maxLife: life, grow: true, startScale: 1, growScale: 0.9, startOpacity: 0.65 });
}

export function spawnImpact(x, z, colorHex) {
  burst(x, z, colorHex, 0.9, 0.22);
}

export function onUnitKilled(victim, killer) {
  if (!victim || !victim.role) return; // champions only
  sfx.kill();
  haptics.kill();
  burst(victim.x, victim.z, TEAM_COLOR[victim.team] || 0xffffff, 3.2, 0.6);
  addKillFeed(killer, victim);
}

export function onStructureDestroyed(st) {
  sfx.structure();
  haptics.structure();
  shake(0.6);
  flash('rgba(255,255,255,0.30)', 420);
  burst(st.x, st.z, TEAM_COLOR[st.team] || 0xffffff, 6.5, 0.8);
}

export function onUltimate(champ) {
  sfx.ultimate();
  haptics.ultimate();
  flash('rgba(251,191,36,0.16)', 260);
}

export function onMatchEnd(victory) {
  if (victory) sfx.victory(); else sfx.defeat();
  haptics.end();
  shake(victory ? 0.5 : 0.8);
}

function addKillFeed(killer, victim) {
  const el = document.getElementById('kill-feed');
  if (!el) return;
  const kName = killer && killer.name ? killer.name : (killer && killer.type ? 'Turret' : 'Minion');
  const kTeam = killer && killer.team ? killer.team : 'blue';
  const row = document.createElement('div');
  row.className = 'kill-row';
  row.innerHTML = `
    <span class="kf-name ${kTeam}">${kName}</span>
    <span class="kf-icon">⚔</span>
    <span class="kf-name ${victim.team}">${victim.name}</span>`;
  el.appendChild(row);
  while (el.children.length > 4) el.removeChild(el.firstChild);
  setTimeout(() => { row.classList.add('fade'); setTimeout(() => row.remove(), 400); }, 3000);
}
