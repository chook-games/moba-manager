import { SAVE_KEY } from './config.js';
import { CHAMPION_POOL } from './data/champions.js';
import { applyAccountXp, applyMasteryXp, computeRewards } from './data/progression.js';
import { getMode } from './data/modes.js';

export const SAVE_VERSION = 2;

export function defaultProfile() {
  return {
    version: SAVE_VERSION,
    level: 1,
    xp: 0,
    gold: 300,
    unlocked: CHAMPION_POOL.filter((c) => c.free).map((c) => c.id),
    mastery: {},
    stats: { matches: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, bestTimeSec: null },
    settings: { speedIndex: 0, haptic: true, quality: 'auto', audioVolume: 0.6, muted: false, tutorialDone: false, lang: null, reduceMotion: false },
    lastResult: null,
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (err) {
    console.warn('Save load failed, starting fresh.', err);
    return defaultProfile();
  }
}

function migrate(p) {
  const base = defaultProfile();
  const merged = {
    ...base,
    ...p,
    settings: { ...base.settings, ...(p.settings || {}) },
    stats: { ...base.stats, ...(p.stats || {}) },
    mastery: p.mastery || {},
    unlocked: Array.isArray(p.unlocked) && p.unlocked.length ? p.unlocked : base.unlocked,
  };
  // Ensure every free champion is always unlocked.
  CHAMPION_POOL.forEach((c) => {
    if (c.free && !merged.unlocked.includes(c.id)) merged.unlocked.push(c.id);
  });
  merged.version = SAVE_VERSION;
  return merged;
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Save failed.', err);
  }
}

export function isUnlocked(profile, champId) {
  return profile.unlocked.includes(champId);
}

export function unlockCost(champId) {
  const c = CHAMPION_POOL.find((x) => x.id === champId);
  return c ? c.unlockCost : 9999;
}

export function unlockChampion(profile, champId) {
  if (isUnlocked(profile, champId)) return true;
  const cost = unlockCost(champId);
  if (profile.gold < cost) return false;
  profile.gold -= cost;
  profile.unlocked.push(champId);
  saveProfile(profile);
  return true;
}

// Persist a finished match. `result` fields: victory, kills, deaths, assists, duration, mvpChampionId.
export function recordMatchResult(profile, result, modeId) {
  const mode = getMode(modeId);
  const rewards = computeRewards(result, mode);

  profile.stats.matches++;
  if (result.victory) profile.stats.wins++;
  else profile.stats.losses++;
  profile.stats.kills += result.kills;
  profile.stats.deaths += result.deaths;
  profile.stats.assists += result.assists;
  if (result.victory) {
    const t = Math.floor(result.duration);
    if (profile.stats.bestTimeSec === null || t < profile.stats.bestTimeSec) profile.stats.bestTimeSec = t;
  }

  profile.gold += rewards.gold;
  const accountLevelsGained = applyAccountXp(profile, rewards.xp);

  let masteryLevelsGained = 0;
  if (result.mvpChampionId) {
    masteryLevelsGained = applyMasteryXp(profile, result.mvpChampionId, Math.round(rewards.xp * 1.5));
  }

  // Track per-champion results too.
  (result.championResults || []).forEach((cr) => {
    applyMasteryXp(profile, cr.id, Math.round((cr.kills * 10 + cr.assists * 5) * (mode?.xpMult || 1)));
  });

  profile.lastResult = { ...result, rewards, modeId, accountLevelsGained, masteryLevelsGained };
  saveProfile(profile);
  return { rewards, accountLevelsGained, masteryLevelsGained };
}

export function resetProfile() {
  const fresh = defaultProfile();
  saveProfile(fresh);
  return fresh;
}
