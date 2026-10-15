import { state, getSpeedMult } from '../state.js';
import { CONFIG } from '../config.js';
import { SHOP_ITEMS } from '../data/items.js';
import { getMode } from '../data/modes.js';
import { distXZ, lanePosFromS, pickRandom } from '../utils.js';
import { spawnMinionWave } from './match.js';
import { updateChampionAI, getAttackableTargets, moveTowardsPoint, engageTarget } from './ai.js';
import { spawnProjectile, dealDamage, applyItem } from './combat.js';
import { updateManagerDashboardUI } from '../ui/hud.js';
import { endMatch } from '../ui/gameover.js';

export function updateSimulation(dt) {
  if (!state.isGameRunning || state.matchEnded) return;
  const mult = getSpeedMult();
  if (mult === 0) return;

  const simDt = dt * mult;
  state.matchTimeSeconds += simDt;
  const mode = getMode(state.currentModeId);

  const allChamps = [...state.blueChampions, ...state.redChampions];
  allChamps.forEach((c) => {
    c.gold += simDt * CONFIG.PASSIVE_GOLD_PER_SEC;
    addPassiveXp(c, simDt * CONFIG.PASSIVE_XP_PER_SEC);
  });

  state.redChampions.forEach((rc) => {
    if (rc.gold >= 500 && rc.items.length < CONFIG.ITEM_SLOTS) {
      applyItem(rc, pickRandom(SHOP_ITEMS));
    }
  });

  if (mode.hasMinions) {
    state.minionWaveTimer += simDt;
    if (state.minionWaveTimer >= CONFIG.WAVE_INTERVAL) {
      state.minionWaveTimer = 0;
      spawnMinionWave();
    }
  }

  updateStructures(simDt);
  updateMinions(simDt);
  allChamps.forEach((c) => updateChampionAI(c, simDt));
  updateProjectiles(simDt);
  updateEffects(simDt);
  cleanupDeadMinions();

  // Win condition: kill target modes.
  if (mode.killTarget) {
    if (state.blueKills >= mode.killTarget) endMatch(true);
    else if (state.redKills >= mode.killTarget) endMatch(false);
  }

  state.uiRefreshAccumulator += dt;
  if (state.uiRefreshAccumulator >= CONFIG.UI_REFRESH_INTERVAL) {
    state.uiRefreshAccumulator = 0;
    updateManagerDashboardUI();
  }
}

function updateStructures(simDt) {
  state.structures.forEach((st) => {
    if (st.dead) return;
    if (st.mesh.userData.crystal) st.mesh.userData.crystal.rotation.y += simDt * 1.5;
    if (st.type !== 'turret') return;

    st.attackCooldown = Math.max(0, st.attackCooldown - simDt);
    if (st.attackCooldown <= 0) {
      const enemies = getAttackableTargets(st.team, st, st.range, true);
      if (enemies.length > 0) {
        spawnProjectile(st, enemies[0], st.ad, st.team === 'blue' ? 0x38bdf8 : 0xf87171, 20);
        st.attackCooldown = CONFIG.TURRET_ATTACK_INTERVAL;
      }
    }
  });
}

function updateMinions(simDt) {
  state.minions.forEach((m) => {
    if (m.dead) return;
    m.attackCooldown = Math.max(0, m.attackCooldown - simDt);
    const enemies = getAttackableTargets(m.team, m, 6.5, true);
    if (enemies.length > 0) {
      const target = enemies[0];
      if (distXZ(m, target) <= m.range) {
        if (m.attackCooldown <= 0) {
          dealDamage(m, target, m.ad);
          m.attackCooldown = CONFIG.MINION_ATTACK_INTERVAL;
        }
      } else {
        moveTowardsPoint(m, target.x, target.z, m.speed * simDt);
      }
    } else {
      const dir = m.team === 'blue' ? 1 : -1;
      m.s = Math.max(0.06, Math.min(0.94, m.s + dir * 0.032 * simDt));
      const p = lanePosFromS(m.s, m.lateral);
      m.x = p.x; m.z = p.z;
      m.mesh.position.set(m.x, 0, m.z);
    }
  });
}

function updateProjectiles(simDt) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    if (!p.target || p.target.dead) {
      state.projectilesGroup.remove(p.mesh);
      state.projectiles.splice(i, 1);
      continue;
    }
    const dx = p.target.x - p.mesh.position.x;
    const dy = 1.2 - p.mesh.position.y;
    const dz = p.target.z - p.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const step = p.speed * simDt;
    if (dist <= step + 0.35) {
      dealDamage(p.source, p.target, p.damage);
      state.projectilesGroup.remove(p.mesh);
      state.projectiles.splice(i, 1);
    } else {
      p.mesh.position.x += (dx / dist) * step;
      p.mesh.position.y += (dy / dist) * step;
      p.mesh.position.z += (dz / dist) * step;
    }
  }
}

function updateEffects(simDt) {
  for (let i = state.visualBeams.length - 1; i >= 0; i--) {
    const b = state.visualBeams[i];
    b.life -= simDt;
    if (b.grow && b.mesh) {
      b.mesh.scale.setScalar(1 + (1 - Math.max(0, b.life) / 0.55) * 0.4);
      b.mesh.material.opacity = 0.55 * (Math.max(0, b.life) / 0.55);
    }
    if (b.life <= 0) {
      state.effectsGroup.remove(b.mesh);
      state.visualBeams.splice(i, 1);
    }
  }
}

function cleanupDeadMinions() {
  for (let i = state.minions.length - 1; i >= 0; i--) {
    if (state.minions[i].dead) {
      state.unitsGroup.remove(state.minions[i].mesh);
      state.minions.splice(i, 1);
    }
  }
}

function addPassiveXp(c, amount) {
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
