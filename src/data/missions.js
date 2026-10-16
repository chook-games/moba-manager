// Daily quest pool + lifetime achievements. Rewards are meta Gold.

export const DAILY_COUNT = 4;

export const DAILY_QUEST_POOL = [
  { id: 'play',    kind: 'matches',      target: 1,  reward: 120 },
  { id: 'win',     kind: 'wins',         target: 1,  reward: 200 },
  { id: 'kills',   kind: 'kills',        target: 20, reward: 180 },
  { id: 'nexus',   kind: 'nexus',        target: 1,  reward: 250 },
  { id: 'assists', kind: 'assists',      target: 15, reward: 150 },
  { id: 'support', kind: 'supportGames', target: 1,  reward: 170 },
];

// check(profile) -> boolean. Names/descriptions come from i18n keys `ach.<id>.name|desc`.
export const ACHIEVEMENTS = [
  { id: 'first_win', reward: 200, check: (p) => p.stats.wins >= 1 },
  { id: 'wins10',    reward: 800, check: (p) => p.stats.wins >= 10 },
  { id: 'kills50',   reward: 400, check: (p) => p.stats.kills >= 50 },
  { id: 'nexus5',    reward: 600, check: (p) => (p.counters?.nexus || 0) >= 5 },
  { id: 'level5',    reward: 500, check: (p) => p.level >= 5 },
  { id: 'roster8',   reward: 400, check: (p) => p.unlocked.length >= 8 },
  { id: 'support5',  reward: 350, check: (p) => (p.counters?.supportGames || 0) >= 5 },
  { id: 'blitz3',    reward: 450, check: (p) => (p.counters?.blitzWins || 0) >= 3 },
];
