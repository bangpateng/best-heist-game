// audio.js — tiny synthesised sound effects (WebAudio, no audio files).
// Everything is generated: blips for loot, a coin clink, a smoke whoosh,
// a two-tone alarm, a caught sting and a getaway fanfare.

let ctx = null;
let alarmNodes = null;
let muted = false;

/** Mute or unmute every sound effect and the alarm loop. */
export function setMuted(m) {
  muted = !!m;
  if (muted) stopAlarmLoop();
}

/** Create (or reuse) the audio context. Call from a user gesture. */
export function ensureAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** A short sine/triangle blip that slides from `from` Hz to `to` Hz. */
function blip(from, to, dur, type = 'sine', vol = 0.16) {
  if (muted) return;
  const c = ensureAudio();
  if (!c) return;
  try {
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    /* audio is decoration; never break the game */
  }
}

/** Filtered noise burst (smoke pop, footsteps). */
function noiseBurst(dur, vol = 0.12, freq = 900) {
  if (muted) return;
  const c = ensureAudio();
  if (!c) return;
  try {
    const t = c.currentTime;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  } catch {
    /* audio is decoration; never break the game */
  }
}

export const sfx = {
  pickup() {
    blip(660, 990, 0.12, 'sine', 0.18);
    setTimeout(() => blip(990, 1320, 0.14, 'sine', 0.14), 70);
  },
  star() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, f * 1.01, 0.16, 'triangle', 0.16), i * 80));
  },
  coin() {
    blip(1900, 1500, 0.09, 'square', 0.07);
    setTimeout(() => blip(2400, 1900, 0.08, 'square', 0.05), 60);
  },
  smoke() {
    noiseBurst(0.45, 0.14, 700);
  },
  step() {
    noiseBurst(0.05, 0.03, 400);
  },
  spotted() {
    blip(220, 440, 0.25, 'sawtooth', 0.12);
  },
  busted() {
    [392, 311, 233].forEach((f, i) => setTimeout(() => blip(f, f * 0.94, 0.22, 'sawtooth', 0.14), i * 130));
  },
  clear() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => blip(f, f, 0.2, 'triangle', 0.15), i * 90));
  },
  click() {
    blip(1200, 900, 0.05, 'square', 0.05);
  },
};

/** Start the two-tone alarm loop while the alarm is high. */
export function startAlarmLoop() {
  if (muted) return;
  const c = ensureAudio();
  if (!c || alarmNodes) return;
  try {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = 620;
    const lfo = c.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 1.6;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(o.frequency);
    const g = c.createGain();
    g.gain.value = 0.045;
    o.connect(g).connect(c.destination);
    o.start();
    lfo.start();
    alarmNodes = { o, lfo, g };
  } catch {
    alarmNodes = null;
  }
}

/** Stop the alarm loop. */
export function stopAlarmLoop() {
  if (!alarmNodes) return;
  try {
    alarmNodes.o.stop();
    alarmNodes.lfo.stop();
  } catch {
    /* already stopped */
  }
  alarmNodes = null;
}
