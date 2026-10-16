// Daily quests, achievements and daily-login rewards. Operates on the profile object.
import { DAILY_QUEST_POOL, DAILY_COUNT, ACHIEVEMENTS } from '../data/missions.js';

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

// Deterministic daily pick from the pool (stable across reloads within a day).
export function pickDaily(dateStr) {
  let seed = 0;
  for (const ch of dateStr) seed = (seed * 31 + ch.charCodeAt(0)) % 233280;
  const pool = [...DAILY_QUEST_POOL];
  const out = [];
  for (let i = 0; i < DAILY_COUNT && pool.length; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    out.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return out;
}

// Ensures daily state is fresh; grants a daily-login reward once per day.
// Returns { granted, streak }.
export function ensureDaily(profile) {
  const today = todayStr();
  if (!profile.daily) profile.daily = { date: today, counters: {}, claimed: [], quests: [], streak: 0, lastLogin: null };

  if (profile.daily.date !== today) {
    profile.daily.date = today;
    profile.daily.counters = {};
    profile.daily.claimed = [];
    profile.daily.quests = pickDaily(today);
  }
  if (!profile.daily.quests || profile.daily.quests.length === 0) {
    profile.daily.quests = pickDaily(today);
  }

  let granted = 0;
  if (profile.daily.lastLogin !== today) {
    profile.daily.streak = profile.daily.lastLogin === yesterdayStr() ? (profile.daily.streak || 0) + 1 : 1;
    profile.daily.lastLogin = today;
    granted = 100 + Math.min(profile.daily.streak, 7) * 50;
    profile.gold += granted;
  }
  return { granted, streak: profile.daily.streak || 1 };
}

export function questProgress(profile, quest) {
  const cur = (profile.daily && profile.daily.counters && profile.daily.counters[quest.kind]) || 0;
  return Math.min(cur, quest.target);
}

export function isQuestClaimed(profile, questId) {
  return !!(profile.daily && profile.daily.claimed && profile.daily.claimed.includes(questId));
}

export function claimQuest(profile, questId) {
  if (!profile.daily) return 0;
  const quest = profile.daily.quests.find((q) => q.id === questId);
  if (!quest || isQuestClaimed(profile, questId)) return 0;
  if (questProgress(profile, quest) < quest.target) return 0;
  profile.daily.claimed.push(questId);
  profile.gold += quest.reward;
  return quest.reward;
}

// Bumps daily + lifetime counters from a finished match.
export function recordMatch(profile, result, mode) {
  if (!profile.daily) ensureDaily(profile);
  const c = profile.daily.counters;
  const bump = (k, n) => { c[k] = (c[k] || 0) + n; };

  bump('matches', 1);
  if (result.victory) bump('wins', 1);
  bump('kills', result.kills || 0);
  bump('assists', result.assists || 0);

  const nexus = result.victory && mode && mode.hasNexus;
  if (nexus) bump('nexus', 1);

  const supportGames = (result.championResults || []).filter((ch) => ch.role === 'Support').length;
  if (supportGames) bump('supportGames', supportGames);

  if (!profile.counters) profile.counters = { nexus: 0, supportGames: 0, blitzWins: 0, siegeWins: 0 };
  if (nexus) profile.counters.nexus = (profile.counters.nexus || 0) + 1;
  if (supportGames) profile.counters.supportGames = (profile.counters.supportGames || 0) + supportGames;
  if (result.victory && mode && mode.id === 'blitz') profile.counters.blitzWins = (profile.counters.blitzWins || 0) + 1;
  if (result.victory && mode && mode.id === 'siege') profile.counters.siegeWins = (profile.counters.siegeWins || 0) + 1;
}

export function evaluateAchievements(profile) {
  const claimed = (profile.achievements || []);
  return ACHIEVEMENTS.map((a) => ({
    id: a.id,
    reward: a.reward,
    unlocked: !!a.check(profile),
    claimed: claimed.includes(a.id),
  }));
}

export function claimAchievement(profile, id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return 0;
  if (!profile.achievements) profile.achievements = [];
  if (profile.achievements.includes(id)) return 0;
  if (!a.check(profile)) return 0;
  profile.achievements.push(id);
  profile.gold += a.reward;
  return a.reward;
}
