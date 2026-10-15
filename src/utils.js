import { CONFIG } from './config.js';

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// Normalized lane progress `s` (0 = blue base bottom-left, 1 = red base top-right).
// In world space: (-LANE_HALF_LEN, 0, +LANE_HALF_LEN) -> (+LANE_HALF_LEN, 0, -LANE_HALF_LEN).
export function lanePosFromS(s, lateralOffset = 0) {
  const clampedS = clamp(s, 0.02, 0.98);
  const baseX = -CONFIG.LANE_HALF_LEN + clampedS * (CONFIG.LANE_HALF_LEN * 2);
  const baseZ = CONFIG.LANE_HALF_LEN - clampedS * (CONFIG.LANE_HALF_LEN * 2);
  return {
    x: baseX + lateralOffset * 0.7071,
    z: baseZ + lateralOffset * 0.7071,
  };
}

// Recompute lane progress `s` from a world position (independent of lateral offset).
export function sFromWorld(x, z) {
  const sX = (x + CONFIG.LANE_HALF_LEN) / (CONFIG.LANE_HALF_LEN * 2);
  const sZ = (CONFIG.LANE_HALF_LEN - z) / (CONFIG.LANE_HALF_LEN * 2);
  return clamp((sX + sZ) * 0.5, 0.03, 0.97);
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

// Safe DOM helpers so modules never crash when an element is missing.
export function $(id) {
  return document.getElementById(id);
}

export function on(id, event, handler) {
  const el = $(id);
  if (el) el.addEventListener(event, handler);
  return el;
}
