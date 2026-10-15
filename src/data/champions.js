// 12 champions. `ability` links to src/data/abilities.js. `unlockCost` = meta gold.
// `free: true` champions are available from the start.

export const ROLE_COLORS = {
  Marksman: { hex: '#eab308', bg: 'rgba(234,179,8,0.18)', border: '#eab308', letter: 'M', threeColor: 0xfacc15 },
  Mage:     { hex: '#a855f7', bg: 'rgba(168,85,247,0.18)', border: '#a855f7', letter: 'M', threeColor: 0xc084fc },
  Tank:     { hex: '#22c55e', bg: 'rgba(34,197,94,0.18)',  border: '#22c55e', letter: 'T', threeColor: 0x4ade80 },
  Assassin: { hex: '#ef4444', bg: 'rgba(239,68,68,0.18)',  border: '#ef4444', letter: 'A', threeColor: 0xf87171 },
  Support:  { hex: '#10b981', bg: 'rgba(16,185,129,0.18)', border: '#10b981', letter: 'S', threeColor: 0x34d399 },
  Fighter:  { hex: '#f97316', bg: 'rgba(249,115,22,0.18)', border: '#f97316', letter: 'F', threeColor: 0xfb923c },
};

export const ROLE_TIP = {
  Marksman: 'Ranged carry. Deals sustained damage from the backline.',
  Mage:     'High burst from range. Fragile — keep it protected.',
  Tank:     'Frontline wall. Absorbs damage and blocks the lane.',
  Assassin: 'Dives enemy carries. Best with GANK order.',
  Support:  'Heals and shields an assigned ally. Escort them.',
  Fighter:  'Bruiser. Soaks damage while dealing consistent melee damage.',
};

export const CHAMPION_POOL = [
  { id: 'aetherblade',  name: 'Aetherblade',  role: 'Marksman', hp: 1400, ad: 62, ap: 0,  armor: 22, as: 0.90, range: 9.5, speed: 4.3, ability: 'barrage',      unlockCost: 900,  free: false },
  { id: 'wildfire',     name: 'Wildfire',     role: 'Marksman', hp: 1350, ad: 58, ap: 10, armor: 20, as: 0.95, range: 9.2, speed: 4.4, ability: 'barrage',      unlockCost: 0,    free: true },
  { id: 'voidcaller',   name: 'Voidcaller',   role: 'Mage',     hp: 1200, ad: 25, ap: 68, armor: 18, as: 0.75, range: 8.8, speed: 4.1, ability: 'nova',         unlockCost: 900,  free: false },
  { id: 'frostweaver',  name: 'Frostweaver',  role: 'Mage',     hp: 1150, ad: 20, ap: 74, armor: 18, as: 0.75, range: 9.0, speed: 4.1, ability: 'nova',         unlockCost: 0,    free: true },
  { id: 'ironheart',    name: 'Ironheart',    role: 'Tank',     hp: 1900, ad: 50, ap: 0,  armor: 42, as: 0.65, range: 2.8, speed: 4.0, ability: 'bulwark',      unlockCost: 0,    free: true },
  { id: 'stonewall',    name: 'Stonewall',    role: 'Tank',     hp: 2000, ad: 48, ap: 0,  armor: 46, as: 0.62, range: 2.8, speed: 3.9, ability: 'bulwark',      unlockCost: 800,  free: false },
  { id: 'shadowstep',   name: 'Shadowstep',   role: 'Assassin', hp: 1250, ad: 68, ap: 0,  armor: 24, as: 0.95, range: 3.0, speed: 4.9, ability: 'execute',      unlockCost: 0,    free: true },
  { id: 'nightshade',   name: 'Nightshade',   role: 'Assassin', hp: 1200, ad: 72, ap: 0,  armor: 22, as: 0.98, range: 3.0, speed: 5.0, ability: 'execute',      unlockCost: 1000, free: false },
  { id: 'tidecaller',   name: 'Tidecaller',   role: 'Support',  hp: 1300, ad: 30, ap: 45, armor: 26, as: 0.75, range: 7.8, speed: 4.3, ability: 'sanctuary',    unlockCost: 0,    free: true },
  { id: 'stormbringer', name: 'Stormbringer', role: 'Support',  hp: 1350, ad: 35, ap: 40, armor: 28, as: 0.78, range: 7.5, speed: 4.3, ability: 'sanctuary',    unlockCost: 800,  free: false },
  { id: 'stormreaver',  name: 'Stormreaver',  role: 'Fighter',  hp: 1600, ad: 58, ap: 0,  armor: 34, as: 0.82, range: 3.2, speed: 4.5, ability: 'whirlwind',    unlockCost: 850,  free: false },
  { id: 'duskblade',    name: 'Duskblade',    role: 'Fighter',  hp: 1550, ad: 60, ap: 0,  armor: 32, as: 0.85, range: 3.2, speed: 4.6, ability: 'whirlwind',    unlockCost: 850,  free: false },
];

export function getChampion(id) {
  return CHAMPION_POOL.find((c) => c.id === id);
}

export const DEFAULT_SQUAD_IDS = ['wildfire', 'ironheart', 'frostweaver', 'shadowstep', 'tidecaller'];
