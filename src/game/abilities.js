import { state } from '../state.js';
import { getAbility, PERKS } from '../data/abilities.js';
import { distXZ } from '../utils.js';
import { dealDamage, spawnNovaEffect, spawnFloatingText, spawnSupportBeam } from './combat.js';
import { onUltimate } from './feedback.js';

export function commandersTeam(c) {
  return c.team === 'blue' ? state.blueChampions : state.redChampions;
}
export function enemyTeam(c) {
  return c.team === 'blue' ? state.redChampions : state.blueChampions;
}

export function castAbility(c, slot = 1) {
  if (!c || c.dead) return { ok: false, reason: 'none' };
  const aKey = slot === 2 ? 'ability2' : 'ability';
  const tKey = slot === 2 ? 'ability2Timer' : 'abilityTimer';
  const id = c[aKey];
  if (!id) return { ok: false, reason: 'none' };
  if (c[tKey] > 0) return { ok: false, reason: 'cooldown' };

  const ab = getAbility(id);
  if (!ab) return { ok: false, reason: 'none' };

  const enemies = enemyTeam(c);
  const allies = commandersTeam(c);

  switch (ab.type) {
    case 'BUFF_AS':
      c.asBonus = ab.asBonus;
      c.asBonusTimer = ab.duration;
      spawnFloatingText(c.x, c.z, ab.name.toUpperCase(), '#facc15');
      break;

    case 'AOE_NUKE': {
      const radius = ab.radius;
      let hit = false;
      [...enemies.filter((e) => !e.dead), ...state.minions.filter((m) => !m.dead && m.team !== c.team)]
        .forEach((e) => {
          if (distXZ(c, e) <= radius) { dealDamage(c, e, ab.flat + c.ap * ab.apRatio); hit = true; }
        });
      spawnNovaEffect(c.x, c.z, radius, 0xc084fc);
      spawnFloatingText(c.x, c.z, ab.name.toUpperCase(), '#c084fc');
      break;
    }

    case 'SHIELD_SELF':
      c.hp = Math.min(c.maxHp, c.hp + c.maxHp * ab.healPct);
      c.shieldTimer = ab.duration;
      spawnFloatingText(c.x, c.z, ab.name.toUpperCase(), '#4ade80');
      break;

    case 'EXECUTE': {
      const living = enemies.filter((e) => !e.dead && distXZ(c, e) <= 22);
      if (living.length === 0) {
        spawnFloatingText(c.x, c.z, 'NO TARGET', '#94a3b8');
        break;
      }
      living.sort((a, b) => a.hp - b.hp);
      const target = living[0];
      const low = target.hp / target.maxHp < ab.threshold;
      const dmg = ab.flat + c.ad * ab.adRatio * (low ? 1.5 : 1);
      dealDamage(c, target, dmg, { trueDamage: true });
      spawnFloatingText(target.x, target.z, low ? 'EXECUTED!' : ab.name.toUpperCase(), '#f87171');
      break;
    }

    case 'AOE_HEAL': {
      const radius = ab.radius;
      allies.filter((a) => !a.dead).forEach((a) => {
        if (distXZ(c, a) <= radius) {
          a.hp = Math.min(a.maxHp, a.hp + ab.healFlat + c.ap * ab.apRatio);
          a.shieldTimer = Math.max(a.shieldTimer || 0, 3);
          spawnSupportBeam(c, a);
        }
      });
      spawnFloatingText(c.x, c.z, ab.name.toUpperCase(), '#34d399');
      break;
    }

    case 'OVERSHIELD': {
      const radius = ab.radius;
      allies.filter((a) => !a.dead).forEach((a) => {
        if (distXZ(c, a) <= radius) {
          a.shieldTimer = Math.max(a.shieldTimer || 0, ab.duration);
          spawnSupportBeam(c, a);
        }
      });
      spawnFloatingText(c.x, c.z, ab.name.toUpperCase(), '#5eead4');
      break;
    }

    case 'WHIRLWIND': {
      const radius = ab.radius;
      [...enemies.filter((e) => !e.dead), ...state.minions.filter((m) => !m.dead && m.team !== c.team)]
        .forEach((e) => {
          if (distXZ(c, e) <= radius) dealDamage(c, e, ab.flat + c.ad * ab.adRatio);
        });
      spawnNovaEffect(c.x, c.z, radius, 0xfb923c);
      spawnFloatingText(c.x, c.z, ab.name.toUpperCase(), '#fb923c');
      break;
    }
    default:
      break;
  }

  if (slot === 1) onUltimate(c);
  c[tKey] = ab.cooldown;
  return { ok: true };
}

// Manager-selected level-up perk (blue champions earn a point per level).
export function castPerk(c) {
  if (!c || c.dead) return { ok: false, reason: 'none' };
  if (!c.perkPoints || c.perkPoints <= 0) return { ok: false, reason: 'none' };
  const perk = PERKS[Math.floor(Math.random() * PERKS.length)];
  perk.apply(c);
  c.perkPoints--;
  spawnFloatingText(c.x, c.z, perk.label, '#34d399');
  return { ok: true, perk };
}

export function tickAbilities(c, dt) {
  if (c.abilityTimer > 0) c.abilityTimer = Math.max(0, c.abilityTimer - dt);
  if (c.ability2Timer > 0) c.ability2Timer = Math.max(0, c.ability2Timer - dt);
  if (c.asBonusTimer > 0) {
    c.asBonusTimer -= dt;
    if (c.asBonusTimer <= 0) c.asBonus = 0;
  }
}

export function abilityReady(c, slot = 1) {
  const id = slot === 2 ? c && c.ability2 : c && c.ability;
  const timer = slot === 2 ? c && c.ability2Timer : c && c.abilityTimer;
  return !!(c && id && timer <= 0 && !c.dead);
}

export function abilityCooldownInfo(c, slot = 1) {
  const id = slot === 2 ? c && c.ability2 : c && c.ability;
  const timer = slot === 2 ? (c && c.ability2Timer) : (c && c.abilityTimer);
  const ab = id ? getAbility(id) : null;
  if (!ab) return null;
  return { ...ab, remaining: Math.max(0, timer || 0), ready: (timer || 0) <= 0 };
}
