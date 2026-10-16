// Champion ultimates. The manager triggers them from the Command Sheet.
// `type` maps to an executor in src/game/abilities.js.

export const ABILITIES = {
  barrage: {
    id: 'barrage',
    name: 'Barrage',
    type: 'BUFF_AS',
    cooldown: 22,
    duration: 5,
    asBonus: 0.9, // +90% attack speed
    desc: 'Massive attack-speed surge for 5s.',
  },
  nova: {
    id: 'nova',
    name: 'Arcane Nova',
    type: 'AOE_NUKE',
    cooldown: 20,
    radius: 7,
    apRatio: 1.6,
    flat: 160,
    desc: 'Detonates arcane energy, damaging nearby enemies.',
  },
  bulwark: {
    id: 'bulwark',
    name: 'Bulwark',
    type: 'SHIELD_SELF',
    cooldown: 24,
    duration: 5,
    shieldPct: 0.35, // 35% of max HP as damage reduction window
    healPct: 0.18,
    desc: 'Hardens up: heals and reduces incoming damage for 5s.',
  },
  execute: {
    id: 'execute',
    name: 'Execute',
    type: 'EXECUTE',
    cooldown: 18,
    flat: 220,
    adRatio: 2.0,
    threshold: 0.35, // bonus vs targets below 35% HP
    desc: 'Dives the weakest enemy for a burst of true damage.',
  },
  sanctuary: {
    id: 'sanctuary',
    name: 'Sanctuary',
    type: 'AOE_HEAL',
    cooldown: 22,
    radius: 9,
    healFlat: 140,
    apRatio: 1.2,
    desc: 'Heals and shields all nearby allies.',
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'Whirlwind',
    type: 'WHIRLWIND',
    cooldown: 20,
    radius: 5.5,
    adRatio: 1.5,
    flat: 80,
    desc: 'Spins through nearby enemies dealing area damage.',
  },
  overshield: {
    id: 'overshield',
    name: 'Aegis Wall',
    type: 'OVERSHIELD',
    cooldown: 26,
    radius: 10,
    duration: 4,
    desc: 'Shields every nearby ally against incoming damage.',
  },
};

export function getAbility(id) {
  return ABILITIES[id];
}
