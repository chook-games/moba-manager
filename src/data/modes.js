// Game modes. Flags drive which systems the simulation enables.
// `unlockLevel` is the account level required (see progression.js).

export const MODES = {
  aram: {
    id: 'aram',
    name: 'ARAM',
    tagline: 'All Random, All Mid',
    desc: '5v5 on a single mid bridge. First to destroy the enemy Nexus wins.',
    icon: '⚔️',
    color: '#ea580c',
    unlockLevel: 1,
    hasNexus: true,
    hasTurret: true,
    hasMinions: true,
    killTarget: null,
    rewardMult: 1.0,
    xpMult: 1.0,
    redStatMult: 1.0,
  },
  blitz: {
    id: 'blitz',
    name: 'Blitz',
    tagline: 'Team Deathmatch',
    desc: 'No towers, no minions. First team to 25 kills wins. Pure chaos.',
    icon: '💥',
    color: '#e11d48',
    unlockLevel: 2,
    hasNexus: false,
    hasTurret: false,
    hasMinions: false,
    killTarget: 25,
    rewardMult: 1.2,
    xpMult: 1.15,
    redStatMult: 1.0,
  },
  siege: {
    id: 'siege',
    name: 'Titan Siege',
    tagline: 'Hard Mode',
    desc: 'The enemy squad is 15% stronger. Destroy their Nexus for big rewards.',
    icon: '🗡️',
    color: '#7c3aed',
    unlockLevel: 4,
    hasNexus: true,
    hasTurret: true,
    hasMinions: true,
    killTarget: null,
    rewardMult: 1.6,
    xpMult: 1.4,
    redStatMult: 1.15,
  },
};

export const MODE_LIST = [MODES.aram, MODES.blitz, MODES.siege];

export function getMode(id) {
  return MODES[id] || MODES.aram;
}
