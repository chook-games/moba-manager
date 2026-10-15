// In-match shop items. Costs are in-match gold (reset each match).
// Stats are applied additively on purchase.

export const SHOP_ITEMS = [
  { id: 'eternity',  name: 'Eternity Blade',     letter: 'E', color: '#ea580c', cost: 500, tags: ['ad'], stats: { ad: 35, as: 0.15 },              desc: '+35 AD, +15% AS' },
  { id: 'souldrink', name: 'Soul Drinker',       letter: 'S', color: '#ea580c', cost: 450, tags: ['ad'], stats: { ad: 28, ls: 15 },                desc: '+28 AD, +15% LS' },
  { id: 'botrk',     name: 'Blade of Lost King', letter: 'B', color: '#f59e0b', cost: 500, tags: ['ad'], stats: { ad: 24, as: 0.30, ls: 10 },     desc: '+24 AD, +30% AS' },
  { id: 'rabadon',   name: "Rabadon's Crown",    letter: 'R', color: '#9333ea', cost: 500, tags: ['ap'], stats: { ap: 65 },                       desc: '+65 Ability Power' },
  { id: 'bulwark',   name: 'Titan Bulwark',      letter: 'T', color: '#16a34a', cost: 450, tags: ['tank'], stats: { hp: 450, armor: 25 },           desc: '+450 HP, +25 Armor' },
  { id: 'aegis',     name: 'Aegis of Light',     letter: 'A', color: '#06b6d4', cost: 400, tags: ['support'], stats: { hp: 250, ap: 35, armor: 15 }, desc: '+250 HP, +35 AP' },
  { id: 'voidstaff', name: 'Void Staff',         letter: 'V', color: '#7c3aed', cost: 520, tags: ['ap'], stats: { ap: 55, ls: 8 },                  desc: '+55 AP, +8% LS' },
  { id: 'warmog',    name: 'Warmog Heart',       letter: 'W', color: '#15803d', cost: 600, tags: ['tank'], stats: { hp: 650 },                      desc: '+650 HP' },
];

export function getItem(id) {
  return SHOP_ITEMS.find((i) => i.id === id);
}
