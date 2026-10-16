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

  // --- Secondary abilities (one per role, lower cooldown) ---
  volley: {
    id: 'volley', name: 'Volley', type: 'WHIRLWIND', cooldown: 8, radius: 6, flat: 30, adRatio: 0.9,
    desc: 'Sprays nearby enemies with arrows.',
  },
  arcane_bolt: {
    id: 'arcane_bolt', name: 'Arcane Bolt', type: 'AOE_NUKE', cooldown: 7, radius: 3.4, flat: 60, apRatio: 0.8,
    desc: 'A focused burst of magic.',
  },
  fortify: {
    id: 'fortify', name: 'Fortify', type: 'SHIELD_SELF', cooldown: 11, duration: 3, shieldPct: 0.15, healPct: 0.08,
    desc: 'Braces for impact, reducing incoming damage.',
  },
  backstab: {
    id: 'backstab', name: 'Backstab', type: 'EXECUTE', cooldown: 9, flat: 60, adRatio: 1.0, threshold: 0.5,
    desc: 'Strikes the weakest nearby foe.',
  },
  mend: {
    id: 'mend', name: 'Mend', type: 'AOE_HEAL', cooldown: 9, radius: 8, healFlat: 60, apRatio: 0.7,
    desc: 'Heals nearby allies.',
  },
  cleave: {
    id: 'cleave', name: 'Cleave', type: 'WHIRLWIND', cooldown: 8, radius: 4.2, flat: 40, adRatio: 1.0,
    desc: 'A sweeping melee strike.',
  },
};

// Each role gets one secondary ability.
export const ROLE_SECOND = {
  Marksman: 'volley',
  Mage: 'arcane_bolt',
  Tank: 'fortify',
  Assassin: 'backstab',
  Support: 'mend',
  Fighter: 'cleave',
};

// Level-up perks: picked by the manager when a blue champion levels up.
export const PERKS = [
  { id: 'ad', label: '+8% AD', apply: (c) => { c.ad = Math.round(c.ad * 1.08); } },
  { id: 'hp', label: '+12% HP', apply: (c) => { c.maxHp = Math.round(c.maxHp * 1.12); c.hp = Math.min(c.maxHp, Math.round(c.hp * 1.12)); } },
  { id: 'ap', label: '+10% AP', apply: (c) => { c.ap = Math.round(c.ap * 1.10); } },
  { id: 'armor', label: '+6 Armor', apply: (c) => { c.armor += 6; } },
  { id: 'as', label: '+8% AS', apply: (c) => { c.as = +(c.as + 0.08).toFixed(2); } },
];

export function getAbility(id) {
  return ABILITIES[id];
}
