// Tiny WebAudio synth — all SFX are generated, no asset files.
import { state } from '../state.js';

let ctx = null;
let master = null;

function settings() {
  return (state.profile && state.profile.settings) || {};
}

function ensure() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      applyVolume();
    } catch (_) {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Called on the first user gesture so mobile browsers allow audio.
export function unlockAudio() {
  ensure();
}

export function refreshVolume() {
  applyVolume();
}

function applyVolume() {
  if (!master || !ctx) return;
  const s = settings();
  const target = s.muted ? 0 : (typeof s.audioVolume === 'number' ? s.audioVolume : 0.6);
  try { master.gain.setTargetAtTime(target, ctx.currentTime, 0.02); } catch (_) { master.gain.value = target; }
}

function tone({ freq = 440, dur = 0.12, type = 'sine', gain = 0.3, slideTo = null, delay = 0 }) {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.12, gain = 0.25, delay = 0, cutoff = 1200 }) {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = cutoff;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(filt); filt.connect(g); g.connect(master);
  src.start(t0);
}

export const sfx = {
  ui()        { tone({ freq: 540, dur: 0.05, type: 'triangle', gain: 0.10 }); },
  hit()       { tone({ freq: 190, dur: 0.05, type: 'square', gain: 0.07, slideTo: 90 }); noise({ dur: 0.05, gain: 0.05, cutoff: 900 }); },
  kill()      { tone({ freq: 330, dur: 0.08, type: 'sine', gain: 0.20 }); tone({ freq: 660, dur: 0.12, type: 'sine', gain: 0.18, delay: 0.07 }); },
  ultimate()  { tone({ freq: 220, dur: 0.40, type: 'sawtooth', gain: 0.18, slideTo: 880 }); noise({ dur: 0.30, gain: 0.09 }); },
  structure() { tone({ freq: 90, dur: 0.50, type: 'sine', gain: 0.30, slideTo: 40 }); noise({ dur: 0.50, gain: 0.20, cutoff: 700 }); },
  victory()   { [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.25, type: 'triangle', gain: 0.20, delay: i * 0.12 })); },
  defeat()    { [392, 330, 262, 196].forEach((f, i) => tone({ freq: f, dur: 0.34, type: 'sine', gain: 0.20, delay: i * 0.16 })); },
};
