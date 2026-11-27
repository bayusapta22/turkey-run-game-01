// Turkey Run — all sound is synthesized with WebAudio. No audio files.
let ctx = null;
let muted = false;
let master = null;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, slideTo, delay = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, lowpass, delay = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass || 1200;
  const g = ctx.createGain();
  g.gain.value = vol || 0.25;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
}

// Pip's gobble: a fast low wobble, three blurts.
export function sfxGobble() {
  tone(320, 0.09, 'sawtooth', 0.16, 180);
  tone(300, 0.09, 'sawtooth', 0.16, 170, 0.09);
  tone(340, 0.12, 'sawtooth', 0.16, 150, 0.18);
}

export function sfxFlap() {
  noiseBurst(0.12, 0.2, 900);
}

export function sfxJump() {
  tone(280, 0.16, 'triangle', 0.18, 620);
}

export function sfxCorn() {
  tone(880, 0.07, 'sine', 0.22, 1320);
  tone(1320, 0.1, 'sine', 0.18, 1760, 0.06);
}

export function sfxFeather() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'sine', 0.16, null, i * 0.07));
}

export function sfxChili() {
  noiseBurst(0.25, 0.22, 2400);
  tone(180, 0.25, 'sawtooth', 0.14, 720);
}

export function sfxHurt() {
  tone(220, 0.22, 'sawtooth', 0.25, 70);
  noiseBurst(0.18, 0.25, 700);
}

export function sfxKnife() {
  tone(1400, 0.1, 'square', 0.07, 500);
  noiseBurst(0.08, 0.12, 4000, 0.05);
}

export function sfxAlarm() {
  tone(660, 0.12, 'square', 0.1, 660);
  tone(520, 0.12, 'square', 0.1, 520, 0.14);
}

export function sfxClick() {
  tone(700, 0.05, 'sine', 0.15, 900);
}

export function sfxWin() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, 'triangle', 0.2, null, i * 0.13));
}

export function sfxLose() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.34, 'triangle', 0.2, null, i * 0.18));
}

// A tiny music-box loop: two bars of a jaunty escape tune, scheduled per beat.
const MELODY = [392, 523, 659, 523, 587, 659, 784, 659, 587, 523, 440, 523, 392, 0, 330, 0];
let musicTimer = null;
let beat = 0;

export function startMusic() {
  if (!ctx || musicTimer) return;
  beat = 0;
  musicTimer = setInterval(() => {
    if (muted || !ctx) return;
    const f = MELODY[beat % MELODY.length];
    if (f) tone(f, 0.22, 'triangle', 0.07);
    if (beat % 4 === 0) tone(131, 0.3, 'sine', 0.09);
    beat++;
  }, 210);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
