import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { distXZ, clamp } from '../utils.js';
import { endMatch } from '../ui/gameover.js';
import { onUnitKilled, onStructureDestroyed } from './feedback.js';

export function addChampionXp(c, amount) {
  if (c.level >= CONFIG.MAX_LEVEL) return;
  c.xp += amount;
  let needed = c.level * 110;
  while (c.xp >= needed && c.level < CONFIG.MAX_LEVEL) {
    c.xp -= needed;
    c.level++;
    c.maxHp += 85;
    c.hp = Math.min(c.maxHp, c.hp + 85);
    c.ad += 4;
    c.armor += 2;
    needed = c.level * 110;
  }
}

// Projectile mesh pool — avoids per-shot allocation / GC churn.
const projectilePool = [];

function acquireProjectile(colorHex) {
  let mesh = projectilePool.pop();
  if (!mesh) {
    mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
  }
  mesh.material.color.setHex(colorHex);
  mesh.visible = true;
  state.projectilesGroup.add(mesh);
  return mesh;
}

export function releaseProjectile(mesh) {
  state.projectilesGroup.remove(mesh);
  mesh.visible = false;
  if (projectilePool.length < 120) projectilePool.push(mesh);
}

export function spawnProjectile(source, target, damage, colorHex, speed) {
  const mesh = acquireProjectile(colorHex);
  mesh.position.set(source.x, 1.35, source.z);
  state.projectiles.push({ source, target, damage, speed, mesh, color: colorHex });
}

export function spawnSupportBeam(sup, ally) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(sup.x, 1.5, sup.z),
    new THREE.Vector3(ally.x, 1.4, ally.z),
  ]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 3 }));
  state.effectsGroup.add(line);
  state.visualBeams.push({ mesh: line, life: 0.45 });
}

export function spawnNovaEffect(x, z, radius, colorHex = 0xc084fc) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.25, radius, 40),
    new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.15, z);
  state.effectsGroup.add(ring);
  state.visualBeams.push({ mesh: ring, life: 0.55, grow: true, radius });
}

// Screen-space floating combat text (kills / ultimates).
export function spawnFloatingText(worldX, worldZ, text, color) {
  const container = document.getElementById('viewport-container');
  const layer = document.getElementById('labels-layer');
  if (!container || !layer || !state.camera) return;
  const v = new THREE.Vector3(worldX, 3.4, worldZ).project(state.camera);
  if (v.z > 1) return;
  const x = (v.x * 0.5 + 0.5) * container.clientWidth;
  const y = (-(v.y * 0.5) + 0.5) * container.clientHeight;

  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.color = color || '#fbbf24';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

export function dealDamage(attacker, target, rawDamage, opts = {}) {
  if (!target || target.dead) return;

  const armor = opts.trueDamage ? 0 : (target.armor || 15);
  const mult = 100 / (100 + armor);
  const shieldReduction = target.shieldTimer > 0 ? 0.62 : 1.0;
  const finalDmg = Math.max(8, rawDamage * mult * shieldReduction);

  target.hp -= finalDmg;

  if (attacker && attacker.ls && attacker.hp > 0 && !attacker.dead) {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + finalDmg * (attacker.ls / 100));
  }

  if (target.hp <= 0) killUnit(target, attacker);
}

function killUnit(target, attacker) {
  target.hp = 0;
  target.dead = true;

  if (target.role) {
    onUnitKilled(target, attacker);
    target.deaths++;
    target.respawnTimer = 6 + Math.floor(target.level * 0.8);
    if (attacker && attacker.role) {
      attacker.kills++;
      attacker.gold += CONFIG.KILL_GOLD;
      addChampionXp(attacker, CONFIG.KILL_XP);
      spawnFloatingText(target.x, target.z, `+${CONFIG.KILL_GOLD}G`, '#fbbf24');
    }
    const killerTeam = target.team === 'blue' ? state.redChampions : state.blueChampions;
    killerTeam.forEach((ally) => {
      if (ally !== attacker && !ally.dead && distXZ(ally, target) < 14) {
        ally.assists++;
        ally.gold += CONFIG.ASSIST_GOLD;
        addChampionXp(ally, CONFIG.ASSIST_XP);
      }
    });
    if (target.team === 'red') state.blueKills++;
    else state.redKills++;
  } else if (target.type) {
    onStructureDestroyed(target);
    target.mesh.visible = false;
    if (target.labelEl) target.labelEl.style.display = 'none';
    const team = target.team === 'blue' ? state.redChampions : state.blueChampions;
    team.forEach((ally) => { ally.gold += CONFIG.STRUCTURE_TEAM_GOLD; });
    if (target.type === 'nexus') {
      endMatch(target.team === 'red');
    }
  } else {
    if (attacker && attacker.role) {
      attacker.gold += CONFIG.MINION_GOLD;
      addChampionXp(attacker, CONFIG.MINION_XP);
    }
  }
}

export function effectiveAttackInterval(c) {
  const as = c.as + (c.asBonus || 0);
  return 1.0 / clamp(as, 0.4, 3.5);
}

// Apply a purchased item's stats to a champion (used in-match by shop + AI).
export function applyItem(c, item) {
  c.gold -= item.cost;
  c.items.push(item);
  const s = item.stats;
  if (s.hp) { c.maxHp += s.hp; c.hp += s.hp; }
  if (s.ad) c.ad += s.ad;
  if (s.ap) c.ap += s.ap;
  if (s.armor) c.armor += s.armor;
  if (s.as) c.as = +(c.as + s.as).toFixed(2);
  if (s.ls) c.ls += s.ls;
}
