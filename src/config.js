// Central tunable constants. Keep balance values here so simulation code stays clean.

export const APP_VERSION = '0.5.0';

export const CONFIG = {
  // --- Lane / world geometry (diagonal ARAM bridge) ---
  LANE_HALF_LEN: 28,
  BRIDGE_LENGTH: 82,
  BRIDGE_WIDTH: 11.5,
  LATERAL_SLOTS: [-2.6, -1.3, 0, 1.3, 2.6],
  MINION_OFFSETS: [-1.4, 0, 1.4],

  // --- Match pacing (values are per real second at 1x speed) ---
  WAVE_INTERVAL: 14,
  FIRST_WAVE_DELAY: 12,
  STRUCT_NEXUS_HP: 3200,
  STRUCT_TURRET_HP: 2200,
  TURRET_AD: 135,
  TURRET_RANGE: 11,
  TURRET_ATTACK_INTERVAL: 1.15,
  MINION_HP: 340,
  MINION_AD: 24,
  MINION_RANGE: 2.5,
  MINION_SPEED: 3.4,
  MINION_ATTACK_INTERVAL: 1.1,

  // --- Economy / progression during a match ---
  START_GOLD: 500,
  PASSIVE_GOLD_PER_SEC: 4.5,
  PASSIVE_XP_PER_SEC: 3.5,
  KILL_GOLD: 300,
  ASSIST_GOLD: 110,
  KILL_XP: 140,
  ASSIST_XP: 70,
  MINION_GOLD: 48,
  MINION_XP: 35,
  STRUCTURE_TEAM_GOLD: 250,
  MAX_LEVEL: 18,
  ITEM_SLOTS: 6,

  // --- Camera / input ---
  CAM_ZOOM_MIN: 0.55,
  CAM_ZOOM_MAX: 2.6,
  CAM_PAN_LIMIT: 28,
  TAP_MAX_DRAG: 12,

  // --- UI refresh cadence (seconds) ---
  UI_REFRESH_INTERVAL: 0.2,
  LABEL_Z_STRUCTURE: 4.2,
  LABEL_Z_UNIT: 2.65,
};

// Game speed cycle. Index 0 is the default (half speed, calmer match).
export const SPEED_STEPS = [
  { mult: 0.5, label: '0.5x' },
  { mult: 1.0, label: '1x' },
  { mult: 1.5, label: '1.5x' },
  { mult: 0.0, label: 'Pause' },
];
export const DEFAULT_SPEED_INDEX = 0;

export const TARGET_PRIORITIES = ['LOWEST_HP', 'CARRY', 'NEAREST', 'TURRET'];
export const TARGET_PRIORITY_LABELS = ['Lowest HP', 'Carry', 'Nearest', 'Turret'];

export const SAVE_KEY = 'moba-manager-save-v2';
