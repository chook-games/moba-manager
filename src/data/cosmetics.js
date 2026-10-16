// Cosmetic skins (colour variants usable on any champion) + profile titles.
export const SKIN_PALETTES = {
  default: { id: 'default', name: 'Standard', cost: 0,   tint: null },
  emerald: { id: 'emerald', name: 'Emerald',  cost: 400, tint: 0x34d399 },
  crimson: { id: 'crimson', name: 'Crimson',  cost: 400, tint: 0xef4444 },
  azure:   { id: 'azure',   name: 'Azure',    cost: 400, tint: 0x38bdf8 },
  gold:    { id: 'gold',    name: 'Gold',     cost: 700, tint: 0xfbbf24 },
  violet:  { id: 'violet',  name: 'Violet',   cost: 700, tint: 0xa855f7 },
};
export const SKIN_LIST = Object.values(SKIN_PALETTES);

export function getSkin(id) {
  return SKIN_PALETTES[id] || SKIN_PALETTES.default;
}

// Titles are gated by account level. Names come from i18n keys `title.<id>`.
export const TITLES = [
  { id: 'rookie',     level: 1 },
  { id: 'tactician',  level: 3 },
  { id: 'commander',  level: 5 },
  { id: 'strategist', level: 8 },
  { id: 'legend',     level: 12 },
];

export function unlockedTitles(level) {
  return TITLES.filter((t) => level >= t.level);
}
