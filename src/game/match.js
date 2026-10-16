import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { CHAMPION_POOL } from '../data/champions.js';
import { getMode } from '../data/modes.js';
import { getDifficulty } from '../data/difficulty.js';
import { ROLE_SECOND } from '../data/abilities.js';
import { getSkin } from '../data/cosmetics.js';
import { lanePosFromS, clamp } from '../utils.js';
import { createStructureMesh, createChampionMesh, createMinionMesh, clearThreeGroup } from '../three/meshes.js';
import { setCameraPreset } from '../three/camera.js';
import { createUnitLabelElement, clearLabels } from '../three/labels.js';
import { closeCommandSheet, renderSupportTargetsBar, renderItemShop } from '../ui/command-sheet.js';
import { updateManagerDashboardUI } from '../ui/hud.js';

export function setupNewMatch(modeId, squadIds) {
  const mode = getMode(modeId);
  state.currentModeId = mode.id;

  clearThreeGroup(state.unitsGroup);
  clearThreeGroup(state.projectilesGroup);
  clearThreeGroup(state.effectsGroup);
  clearLabels();

  state.matchTimeSeconds = 0;
  state.minionWaveTimer = CONFIG.FIRST_WAVE_DELAY;
  state.blueKills = 0;
  state.redKills = 0;
  state.matchEnded = false;
  state.selectedChampIndex = -1;
  state.supportTargetIndex = 0;
  state.priorityIndex = 0;
  state.camPanOffset = { x: 0, z: 0 };

  state.blueChampions = [];
  state.redChampions = [];
  state.structures = [];
  state.minions = [];
  state.projectiles = [];
  state.visualBeams = [];
  state.floatingTexts = [];

  buildStructures(mode);
  buildTeams(mode, squadIds);
  applyEnvironment(mode);

  renderSupportTargetsBar();
  renderItemShop();
  setCameraPreset(0);
  closeCommandSheet();
  updateManagerDashboardUI();
  state.isGameRunning = true;
}

function buildStructures(mode) {
  if (!mode.hasNexus && !mode.hasTurret) return;

  const structDefs = [];
  if (mode.hasNexus) {
    structDefs.push({ id: 'blue_nexus', name: 'Blue Nexus', team: 'blue', type: 'nexus', s: 0.06, hp: CONFIG.STRUCT_NEXUS_HP, maxHp: CONFIG.STRUCT_NEXUS_HP, ad: 0, range: 0 });
    structDefs.push({ id: 'red_nexus', name: 'Red Nexus', team: 'red', type: 'nexus', s: 0.94, hp: CONFIG.STRUCT_NEXUS_HP, maxHp: CONFIG.STRUCT_NEXUS_HP, ad: 0, range: 0 });
  }
  if (mode.hasTurret) {
    structDefs.push({ id: 'blue_turret', name: 'Blue Turret', team: 'blue', type: 'turret', s: 0.25, hp: CONFIG.STRUCT_TURRET_HP, maxHp: CONFIG.STRUCT_TURRET_HP, ad: CONFIG.TURRET_AD, range: CONFIG.TURRET_RANGE });
    structDefs.push({ id: 'red_turret', name: 'Red Turret', team: 'red', type: 'turret', s: 0.75, hp: CONFIG.STRUCT_TURRET_HP, maxHp: CONFIG.STRUCT_TURRET_HP, ad: CONFIG.TURRET_AD, range: CONFIG.TURRET_RANGE });
  }

  const hpMult = mode.structHpMult || 1;
  structDefs.forEach((sd) => {
    sd.hp = Math.round(sd.hp * hpMult);
    sd.maxHp = Math.round(sd.maxHp * hpMult);
    const pos = lanePosFromS(sd.s, 0);
    const mesh = createStructureMesh(sd.team, sd.type);
    mesh.position.set(pos.x, 0, pos.z);
    state.unitsGroup.add(mesh);
    const labelEl = createUnitLabelElement(sd.name, sd.team, true);
    state.structures.push({ ...sd, x: pos.x, z: pos.z, mesh, labelEl, attackCooldown: 0, dead: false });
  });
}

function buildTeams(mode, squadIds) {
  const slots = CONFIG.LATERAL_SLOTS;

  squadIds.forEach((id, idx) => {
    const base = CHAMPION_POOL.find((c) => c.id === id) || CHAMPION_POOL[0];
    state.blueChampions.push(createChampionInstance(base, 'blue', idx, 0.12 + idx * 0.012, slots[idx], 1));
  });

  const difficulty = getDifficulty(state.profile && state.profile.settings && state.profile.settings.difficulty);
  const redMult = (mode.redStatMult || 1) * difficulty.redMult;
  const banned = state.bans || [];
  const unpicked = CHAMPION_POOL.filter((c) => !squadIds.includes(c.id) && !banned.includes(c.id));
  const pool = unpicked.length >= 5 ? unpicked : CHAMPION_POOL.filter((c) => !squadIds.includes(c.id));
  for (let i = 0; i < 5; i++) {
    const base = pool[(i * 3 + 1) % pool.length];
    const champ = createChampionInstance(base, 'red', i, 0.88 - i * 0.012, slots[i], redMult);
    champ.order = base.role === 'Tank' ? 'DEFEND' : (base.role === 'Support' ? 'FARM' : 'PUSH');
    state.redChampions.push(champ);
  }
}

function skinTint(id) {
  const cos = state.profile && state.profile.cosmetics;
  if (!cos || !cos.skins) return null;
  return getSkin(cos.skins[id]).tint;
}

function applyEnvironment(mode) {
  if (!state.scene || mode.fogColor == null) return;
  const color = new THREE.Color(mode.fogColor);
  state.scene.background = color;
  if (state.scene.fog) state.scene.fog.color = color;
}

export function createChampionInstance(base, team, slotIndex, startS, lateralOffset, statMult = 1) {
  const pos = lanePosFromS(startS, lateralOffset);
  const tint = team === 'blue' ? skinTint(base.id) : null;
  const mesh = createChampionMesh(base, team, tint);
  mesh.position.set(pos.x, 0, pos.z);
  state.unitsGroup.add(mesh);
  const labelEl = createUnitLabelElement(base.name, team, false);

  return {
    uid: `${team}_${base.id}_${slotIndex}`,
    id: base.id,
    name: base.name,
    role: base.role,
    team,
    slotIndex,
    level: 1,
    xp: 0,
    gold: CONFIG.START_GOLD,
    kills: 0,
    deaths: 0,
    assists: 0,
    maxHp: Math.round(base.hp * statMult),
    hp: Math.round(base.hp * statMult),
    ad: base.ad,
    ap: base.ap,
    armor: base.armor,
    as: base.as,
    ls: 0,
    range: base.range,
    speed: base.speed,
    s: startS,
    lateral: lateralOffset,
    x: pos.x,
    z: pos.z,
    order: 'PUSH',
    stateText: 'MOVING_TO_LANE',
    targetPriority: 'LOWEST_HP',
    items: [],
    attackCooldown: 0,
    supportCooldown: 0,
    shieldTimer: 0,
    ability: base.ability,
    abilityTimer: 0,
    ability2: ROLE_SECOND[base.role],
    ability2Timer: 0,
    perkPoints: 0,
    asBonus: 0,
    asBonusTimer: 0,
    dead: false,
    respawnTimer: 0,
    mesh,
    labelEl,
  };
}

// Minion mesh pool (per team) so waves don't allocate/GC constantly.
const minionPool = { blue: [], red: [] };

function acquireMinionMesh(team) {
  const pool = minionPool[team];
  const mesh = pool.pop() || createMinionMesh(team);
  mesh.visible = true;
  state.unitsGroup.add(mesh);
  return mesh;
}

export function releaseMinionMesh(mesh, team) {
  state.unitsGroup.remove(mesh);
  mesh.visible = false;
  if (minionPool[team].length < 60) minionPool[team].push(mesh);
}

export function spawnMinionWave() {
  CONFIG.MINION_OFFSETS.forEach((lat, idx) => {
    const bPos = lanePosFromS(0.11, lat);
    const bMesh = acquireMinionMesh('blue');
    bMesh.position.set(bPos.x, 0, bPos.z);
    state.minions.push(makeMinion('blue', bPos, lat, 0.11 - idx * 0.01, bMesh));

    const rPos = lanePosFromS(0.89, lat);
    const rMesh = acquireMinionMesh('red');
    rMesh.position.set(rPos.x, 0, rPos.z);
    state.minions.push(makeMinion('red', rPos, lat, 0.89 + idx * 0.01, rMesh));
  });
}

function makeMinion(team, pos, lat, s, mesh) {
  return {
    team, hp: CONFIG.MINION_HP, maxHp: CONFIG.MINION_HP, ad: CONFIG.MINION_AD,
    range: CONFIG.MINION_RANGE, speed: CONFIG.MINION_SPEED,
    s: clamp(s, 0.06, 0.94), lateral: lat, x: pos.x, z: pos.z,
    attackCooldown: 0, dead: false, mesh,
  };
}
