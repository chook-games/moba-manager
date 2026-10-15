// Meta-progression curves and reward maths.

export const ACCOUNT_START_XP = 0;

// XP needed to advance FROM `level` to `level + 1`.
export function accountXpToNext(level) {
  return 600 + (level - 1) * 450;
}

export function masteryXpToNext(level) {
  return 400 + (level - 1) * 300;
}

// Compute meta rewards from a finished match result.
// result: { victory, kills, deaths, assists, duration, modeId, mvpChampionId }
export function computeRewards(result, mode) {
  const base = result.victory ? 450 : 180;
  const durationBonus = Math.floor(result.duration / 60) * 18;
  const kda = result.kills * 22 + result.assists * 9;
  const deathPenalty = result.deaths * 6;

  const gold = Math.max(60, Math.round((base + durationBonus + kda - deathPenalty) * (mode?.rewardMult || 1)));
  const xp = Math.round((220 + result.kills * 26 + result.assists * 12 + (result.victory ? 120 : 40)) * (mode?.xpMult || 1));

  return { gold, xp };
}

export function applyAccountXp(profile, xp) {
  profile.xp += xp;
  let leveled = 0;
  while (profile.xp >= accountXpToNext(profile.level)) {
    profile.xp -= accountXpToNext(profile.level);
    profile.level++;
    leveled++;
  }
  return leveled;
}

export function applyMasteryXp(profile, champId, xp) {
  if (!profile.mastery[champId]) profile.mastery[champId] = { xp: 0, level: 1, games: 0 };
  const m = profile.mastery[champId];
  m.games++;
  m.xp += xp;
  let leveled = 0;
  while (m.xp >= masteryXpToNext(m.level)) {
    m.xp -= masteryXpToNext(m.level);
    m.level++;
    leveled++;
  }
  return leveled;
}
