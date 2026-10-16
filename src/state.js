import { DEFAULT_SPEED_INDEX, SPEED_STEPS } from './config.js';

// Single mutable runtime state bag. Modules import `state` and read/write fields.
// Three.js handles and match collections live here so the simulation and UI agree.
export const state = {
  // Three.js
  scene: null,
  camera: null,
  renderer: null,
  worldGroup: null,
  unitsGroup: null,
  projectilesGroup: null,
  effectsGroup: null,
  isThreeInitialized: false,

  // Loop
  isGameRunning: false,
  lastFrameTime: 0,
  uiRefreshAccumulator: 0,

  // Speed
  speedIndex: DEFAULT_SPEED_INDEX,

  // Match timing
  matchTimeSeconds: 0,
  minionWaveTimer: 0,
  matchEnded: false,

  // Score
  blueKills: 0,
  redKills: 0,

  // Collections
  blueChampions: [],
  redChampions: [],
  structures: [],
  minions: [],
  projectiles: [],
  visualBeams: [],
  floatingTexts: [],

  // Manager selection
  selectedChampIndex: -1,
  supportTargetIndex: 0,
  priorityIndex: 0,
  activeSheetTab: 'tactics',

  // Camera
  cameraMode: 0,
  camPanOffset: { x: 0, z: 0 },
  camZoom: 0.80,
  camShake: 0,

  // Meta
  profile: null,
  currentModeId: 'aram',
  pendingModeId: 'aram',
  lastResult: null,
};

export function getSpeedMult() {
  return SPEED_STEPS[state.speedIndex].mult;
}

export function getSpeedLabel() {
  return SPEED_STEPS[state.speedIndex].label;
}

export function allChampions() {
  return [...state.blueChampions, ...state.redChampions];
}
