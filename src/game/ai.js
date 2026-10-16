import { state } from '../state.js';
import { CONFIG, TARGET_PRIORITIES } from '../config.js';
import { distXZ, lanePosFromS, sFromWorld, clamp } from '../utils.js';
import { dealDamage, spawnProjectile, effectiveAttackInterval, spawnSupportBeam } from './combat.js';
import { tickAbilities, abilityReady, castAbility } from './abilities.js';

export function updateChampionAI(c, dt) {
  if (c.dead) {
    c.respawnTimer -= dt;
    c.stateText = `DEAD (${Math.ceil(c.respawnTimer)}s)`;
    c.mesh.visible = false;
    if (c.respawnTimer <= 0) {
      c.dead = false;
      c.hp = c.maxHp;
      c.s = c.team === 'blue' ? 0.08 : 0.92;
      const pos = lanePosFromS(c.s, c.lateral);
      c.x = pos.x; c.z = pos.z;
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.visible = true;
      c.stateText = 'MOVING_TO_LANE';
    }
    return;
  }

  tickAbilities(c, dt);
  c.attackCooldown = Math.max(0, c.attackCooldown - dt);
  c.supportCooldown = Math.max(0, c.supportCooldown - dt);

  if (c.shieldTimer > 0) {
    c.shieldTimer -= dt;
    c.mesh.userData.shieldMesh.material.opacity = 0.38;
    c.mesh.userData.shieldMesh.rotation.y += dt * 2.5;
  } else {
    c.mesh.userData.shieldMesh.material.opacity = 0.0;
  }

  const isBlue = c.team === 'blue';
  const homeS = isBlue ? 0.07 : 0.93;
  const turretS = isBlue ? 0.24 : 0.76;

  if (Math.abs(c.s - homeS) < 0.08 && c.hp < c.maxHp) {
    c.hp = Math.min(c.maxHp, c.hp + c.maxHp * 0.16 * dt);
  }

  // Red AI auto-casts its ultimate in combat.
  if (c.team === 'red' && abilityReady(c)) {
    const foeNear = getAttackableTargets(c.team, c, 9, false).length > 0;
    if (foeNear) castAbility(c);
  }

  // Both teams fall back to base when badly hurt (player squad included) so they
  // heal instead of feeding.
  const retreatAt = c.retreatAt != null ? c.retreatAt : 0.25;
  const shouldAutoRetreat = (c.order !== 'RETREAT') && (c.hp / c.maxHp < retreatAt);
  if (c.order === 'RETREAT' || shouldAutoRetreat) {
    c.stateText = 'RETREATING';
    const retreatPos = lanePosFromS(homeS, c.lateral);
    if (distXZ(c, retreatPos) > 1.2) {
      moveTowardsPoint(c, retreatPos.x, retreatPos.z, c.speed * 1.15 * dt);
    } else if (c.hp >= c.maxHp * 0.95 && c.team === 'red') {
      c.order = 'PUSH';
    }
    return;
  }

  if (c.role === 'Support') {
    updateSupportAI(c, dt, isBlue);
  }

  if (c.order === 'DEFEND') {
    const allyTurret = state.structures.find((s) => s.team === c.team && s.type === 'turret' && !s.dead);
    const holdS = allyTurret ? turretS : (isBlue ? 0.12 : 0.88);
    const holdPos = lanePosFromS(holdS, c.lateral);
    const enemiesNear = getAttackableTargets(c.team, c, c.range + 3.0, false);

    if (enemiesNear.length > 0) {
      c.stateText = 'DEFENDING';
      engageTarget(c, enemiesNear[0], dt);
    } else if (distXZ(c, holdPos) > 1.8) {
      c.stateText = 'HOLDING_TOWER';
      moveTowardsPoint(c, holdPos.x, holdPos.z, c.speed * dt);
    } else {
      c.stateText = 'DEFENDING';
    }
    return;
  }

  const searchRadius = c.order === 'FARM' ? c.range + 3.5 : (c.aiSearch || 14.5);
  const candidates = getAttackableTargets(c.team, c, searchRadius, false);

  if (candidates.length > 0) {
    const chosen = selectTargetByStance(c, candidates);
    if (chosen) {
      c.stateText = c.order === 'FARM' ? 'FARMING' : 'FIGHTING';
      engageTarget(c, chosen, dt);
      return;
    }
  }

  c.stateText = 'MOVING_TO_LANE';
  const frontLineS = getSafeFrontlineS(c);
  const destPos = lanePosFromS(frontLineS, c.lateral);
  if (distXZ(c, destPos) > 1.1) {
    moveTowardsPoint(c, destPos.x, destPos.z, c.speed * dt);
  }
}

function updateSupportAI(c, dt, isBlue) {
  const allies = isBlue ? state.blueChampions : state.redChampions;
  let escort = isBlue ? allies[state.supportTargetIndex] : allies[0];
  if (!escort || escort.dead || escort === c) {
    const living = allies.filter((a) => !a.dead && a !== c);
    if (living.length > 0) {
      living.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
      escort = living[0];
    }
  }
  if (!escort || escort.dead) return;

  if (c.supportCooldown <= 0 && (escort.hp < escort.maxHp * 0.92 || distXZ(c, escort) < 9)) {
    escort.hp = Math.min(escort.maxHp, escort.hp + (95 + c.ap * 1.4));
    escort.shieldTimer = 2.8;
    spawnSupportBeam(c, escort);
    c.supportCooldown = 3.8;
  }

  const followS = clamp(escort.s + (isBlue ? -0.035 : 0.035), 0.08, 0.92);
  const followPos = lanePosFromS(followS, escort.lateral + 1.1);
  if (distXZ(c, followPos) > 2.4) {
    c.stateText = `SUPPORTING_${escort.name.toUpperCase()}`;
    moveTowardsPoint(c, followPos.x, followPos.z, c.speed * dt);
  }
}

export function getSafeFrontlineS(c) {
  const isBlue = c.team === 'blue';
  const enemyTurret = state.structures.find((s) => s.team !== c.team && s.type === 'turret' && !s.dead);

  if (c.order === 'FARM') {
    if (enemyTurret) return isBlue ? Math.min(0.60, enemyTurret.s - 0.14) : Math.max(0.40, enemyTurret.s + 0.14);
    return isBlue ? 0.78 : 0.22;
  }
  if (enemyTurret) return isBlue ? enemyTurret.s - 0.06 : enemyTurret.s + 0.06;
  return isBlue ? 0.89 : 0.11;
}

export function getAttackableTargets(myTeam, unit, radius, prioritizeMinionsFirst = false) {
  const enemyChamps = (myTeam === 'blue' ? state.redChampions : state.blueChampions)
    .filter((e) => !e.dead && distXZ(unit, e) <= radius);
  const enemyMinions = state.minions.filter((m) => !m.dead && m.team !== myTeam && distXZ(unit, m) <= radius);
  const enemyStructs = state.structures.filter((s) => !s.dead && s.team !== myTeam && distXZ(unit, s) <= radius);

  const enemyTurretAlive = state.structures.some((s) => !s.dead && s.team !== myTeam && s.type === 'turret');
  const validStructs = enemyStructs.filter((s) => !(s.type === 'nexus' && enemyTurretAlive));

  if (prioritizeMinionsFirst) return [...enemyMinions, ...enemyChamps, ...validStructs];
  return [...enemyChamps, ...enemyMinions, ...validStructs];
}

export function selectTargetByStance(c, candidates) {
  const enemyChamps = candidates.filter((x) => x.role);
  const enemyMinions = candidates.filter((x) => !x.role && !x.type);
  const enemyStructs = candidates.filter((x) => x.type);

  if (c.order === 'FARM' && enemyMinions.length > 0) {
    enemyMinions.sort((a, b) => a.hp - b.hp);
    return enemyMinions[0];
  }
  if (c.order === 'PUSH' && enemyStructs.length > 0 && enemyMinions.length === 0) {
    return enemyStructs[0];
  }
  const prio = TARGET_PRIORITIES[state.priorityIndex];
  if (prio === 'TURRET' && enemyStructs.length > 0) return enemyStructs[0];

  if (enemyChamps.length > 0 && (c.order === 'PUSH' || enemyMinions.length === 0)) {
    if (prio === 'LOWEST_HP') enemyChamps.sort((a, b) => a.hp - b.hp);
    else if (prio === 'CARRY') enemyChamps.sort((a, b) => ((a.role === 'Marksman' || a.role === 'Mage') ? -1 : 1));
    else enemyChamps.sort((a, b) => distXZ(c, a) - distXZ(c, b));
    return enemyChamps[0];
  }

  candidates.sort((a, b) => distXZ(c, a) - distXZ(c, b));
  return candidates[0];
}

export function engageTarget(c, target, dt) {
  const d = distXZ(c, target);
  if (c.mesh.userData.bodyGroup) {
    c.mesh.userData.bodyGroup.lookAt(target.x - c.x, 0, target.z - c.z);
  }
  if (d <= c.range) {
    if (c.attackCooldown <= 0) {
      const totalDmg = c.ad + c.ap * 0.85;
      if (c.range > 4.5) {
        spawnProjectile(c, target, totalDmg, (ROLE_COLOR_CACHE[c.role] || 0xffffff), 22);
      } else {
        dealDamage(c, target, totalDmg);
      }
      c.attackCooldown = effectiveAttackInterval(c);
    }
  } else {
    moveTowardsPoint(c, target.x, target.z, c.speed * dt);
  }
}

export function moveTowardsPoint(unit, tx, tz, maxStep) {
  const dx = tx - unit.x;
  const dz = tz - unit.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist <= 0.05) return;

  const step = Math.min(dist, maxStep);
  unit.x += (dx / dist) * step;
  unit.z += (dz / dist) * step;
  unit.s = sFromWorld(unit.x, unit.z);
  unit.mesh.position.set(unit.x, 0, unit.z);
  if (unit.mesh.userData.bodyGroup) {
    unit.mesh.userData.bodyGroup.rotation.y = Math.atan2(dx, dz);
  }
}

// Small color cache to avoid importing ROLE_COLORS in the hot path.
const ROLE_COLOR_CACHE = {
  Marksman: 0xfacc15, Mage: 0xc084fc, Tank: 0x4ade80,
  Assassin: 0xf87171, Support: 0x34d399, Fighter: 0xfb923c,
};
