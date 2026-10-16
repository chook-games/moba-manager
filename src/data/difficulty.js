// Difficulty scales the enemy (red) squad. Lower = easier for the player.
export const DIFFICULTIES = {
  easy:   { id: 'easy',   redMult: 0.80, redSearch: 10.5, redRetreat: 0.40, rewardMult: 0.9 },
  normal: { id: 'normal', redMult: 0.95, redSearch: 13.0, redRetreat: 0.30, rewardMult: 1.0 },
  hard:   { id: 'hard',   redMult: 1.15, redSearch: 16.0, redRetreat: 0.20, rewardMult: 1.2 },
};

export const DIFFICULTY_LIST = [DIFFICULTIES.easy, DIFFICULTIES.normal, DIFFICULTIES.hard];

// The player's own squad also auto-retreats when low — this keeps them from feeding.
export const BLUE_RETREAT_AT = 0.30;

export function getDifficulty(id) {
  return DIFFICULTIES[id] || DIFFICULTIES.easy;
}
