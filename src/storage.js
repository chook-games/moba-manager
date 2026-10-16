import { SAVE_KEY } from './config.js';
import { CHAMPION_POOL } from './data/champions.js';
import { applyAccountXp, applyMasteryXp, computeRewards } from './data/progression.js';
import { getMode } from './data/modes.js';
import { recordMatch } from './core/missions.js';

export const SAVE_VERSION = 2;

function makeDeviceId() {
  return 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function defaultProfile() {
  return {
    version: SAVE_VERSION,
    deviceId: makeDeviceId(),
    updatedAt: 0,
    level: 1,
    xp: 0,
    gold: 300,
    unlocked: CHAMPION_POOL.filter((c) => c.free).map((c) => c.id),
    mastery: {},
    stats: { matches: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, bestTimeSec: null },
    counters: { nexus: 0, supportGames: 0, blitzWins: 0, siegeWins: 0 },
    achievements: [],
    history: [],
    cosmetics: { unlockedSkins: ['default'], skins: {}, title: 'rookie' },
    daily: { date: null, counters: {}, claimed: [], quests: [], streak: 0, lastLogin: null },
    settings: { speedIndex: 0, haptic: true, quality: 'auto', audioVolume: 0.6, muted: false, tutorialDone: false, lang: null, reduceMotion: false, analytics: false, difficulty: 'normal' },
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
    counters: { ...base.counters, ...(p.counters || {}) },
    daily: { ...base.daily, ...(p.daily || {}) },
    history: Array.isArray(p.history) ? p.history : [],
    cosmetics: { ...base.cosmetics, ...(p.cosmetics || {}), skins: { ...(p.cosmetics && p.cosmetics.skins) } },
    mastery: p.mastery || {},
    achievements: Array.isArray(p.achievements) ? p.achievements : [],
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
    if (profile) profile.updatedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Save failed.', err);
  }
}

// Cross-device transfer without a backend: a portable save string.
export function exportSaveCode(profile) {
  try {
    const json = JSON.stringify(profile);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return 'MOBA1.' + b64;
  } catch (_) {
    return '';
  }
}

export function importSaveCode(code) {
  try {
    const raw = String(code || '').trim();
    if (!raw) return null;
    const b64 = raw.startsWith('MOBA1.') ? raw.slice(6) : raw;
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    return migrate(parsed);
  } catch (_) {
    return null;
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
  recordMatch(profile, result, mode);
  const accountLevelsGained = applyAccountXp(profile, rewards.xp);

  let masteryLevelsGained = 0;
  if (result.mvpChampionId) {
    masteryLevelsGained = applyMasteryXp(profile, result.mvpChampionId, Math.round(rewards.xp * 1.5));
  }

  // Track per-champion results too.
  (result.championResults || []).forEach((cr) => {
    applyMasteryXp(profile, cr.id, Math.round((cr.kills * 10 + cr.assists * 5) * (mode?.xpMult || 1)));
  });

  if (!Array.isArray(profile.history)) profile.history = [];
  profile.history.unshift({
    ts: Date.now(),
    modeId,
    victory: !!result.victory,
    kills: result.kills || 0,
    deaths: result.deaths || 0,
    assists: result.assists || 0,
    duration: Math.round(result.duration || 0),
    mvp: result.mvpName || '',
    champs: (result.championResults || []).map((c) => ({ id: c.id, name: c.name, role: c.role, kills: c.kills, deaths: c.deaths, assists: c.assists })),
  });
  if (profile.history.length > 20) profile.history.length = 20;

  profile.lastResult = { ...result, rewards, modeId, accountLevelsGained, masteryLevelsGained };
  saveProfile(profile);
  return { rewards, accountLevelsGained, masteryLevelsGained };
}

export function resetProfile() {
  const fresh = defaultProfile();
  saveProfile(fresh);
  return fresh;
}
