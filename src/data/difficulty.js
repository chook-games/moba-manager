// Difficulty scales the enemy (red) squad relative to the player's team.
export const DIFFICULTIES = {
  easy:   { id: 'easy',   redMult: 0.85, rewardMult: 0.9 },
  normal: { id: 'normal', redMult: 1.0,  rewardMult: 1.0 },
  hard:   { id: 'hard',   redMult: 1.18, rewardMult: 1.2 },
};

export const DIFFICULTY_LIST = [DIFFICULTIES.easy, DIFFICULTIES.normal, DIFFICULTIES.hard];

export function getDifficulty(id) {
  return DIFFICULTIES[id] || DIFFICULTIES.normal;
}
