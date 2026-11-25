/* =========================================================
   烬旅 · Emberpath
   A single-player roguelike deckbuilder.
   All game code is vanilla JS; no build step or assets required.
   ========================================================= */
(() => {
'use strict';

/* ---------------------------------------------------------
   Tiny utilities
   --------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let uidCounter = 0;
const uid = (prefix = 'u') => prefix + '-' + (++uidCounter) + '-' + Math.random().toString(36).slice(2, 6);
const escapeHTML = (str) => String(str).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));
const escapeAttr = escapeHTML;
const pct = (n, max) => max > 0 ? clamp(Math.round((n / max) * 100), 0, 100) : 0;
const roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);

const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* private mode */ }
  }
};

/* ---------------------------------------------------------
   Icons — inline, monochrome, no external files
   --------------------------------------------------------- */
const ICON_PATHS = {
  flame: '<path d="M12 2.5c.8 3.7-2.8 5-2.8 8.4a2.8 2.8 0 0 0 5.6 0c0-1-.4-1.8-1-2.7 3 1.1 4.7 3.8 4.7 6.7A6.5 6.5 0 1 1 5.5 15c0-4.7 4-7 6.5-12.5Z"/>',
  sword: '<path d="M14.7 3.2 20.8 9.3 9.3 20.8H3.2v-6.1L14.7 3.2Z"/><path d="m13.2 4.7 6.1 6.1M5.5 15.2l3.3 3.3"/>',
  shield: '<path d="M12 2.8 4.5 5.9v5.4c0 4.6 3.2 7.8 7.5 9.8 4.3-2 7.5-5.2 7.5-9.8V5.9L12 2.8Z"/><path d="M9.2 11.9 11.3 14l3.7-4.1"/>',
  heart: '<path d="M12 20.5s-7.3-4.7-7.3-10A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 7.3 3.3c0 5.3-7.3 10-7.3 10Z"/>',
  skull: '<path d="M12 2.8c-4.8 0-7.4 3.1-7.4 7.1 0 2.7 1.4 4.5 3.2 5.6v2.7c0 1.6 1.1 2.6 2.6 2.6h3.2c1.5 0 2.6-1 2.6-2.6v-2.7c1.8-1.1 3.2-2.9 3.2-5.6 0-4-2.6-7.1-7.4-7.1Z"/><circle cx="9.2" cy="10.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="14.8" cy="10.5" r="1.3" fill="currentColor" stroke="none"/><path d="M10.3 14.4h3.4"/>',
  chest: '<path d="M3.2 9.2h17.6v10.3H3.2z"/><path d="M2.4 9.2 4.7 4.5h14.6l2.3 4.7M3.2 13.7h17.6"/><path d="M10.2 9.2h3.6v4.5h-3.6z"/>',
  campfire: '<path d="M12 21c-3.4 0-5.7-2.2-5.7-5.2 0-2.5 1.6-4.1 2.8-5.6.9-1.1 1.6-2.1 1.7-3.4 2.1 1.3 3.3 3.2 3.3 5 1.1-.3 1.8-1 2.2-2 1.1 1.6 1.4 3.2 1.4 4.6C17.7 18.8 15.4 21 12 21Z"/><path d="M6.2 21h11.6"/>',
  shop: '<path d="M3.5 9.5h17v10.2h-17z"/><path d="M2.5 9.5 4.8 4.2h14.4l2.3 5.3M8.2 4.2v5.3M15.8 4.2v5.3"/><path d="M8.5 13.8h7v5.9h-7z"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.7 2.7 0 1 1 3.8 2.5c-.9.4-1.3 1-1.3 2"/><circle cx="12" cy="17.2" r=".8" fill="currentColor" stroke="none"/>',
  crown: '<path d="m3.5 7.6 4.6 3.1L12 4.2l3.9 6.5 4.6-3.1-1.5 10.2H5L3.5 7.6Z"/><path d="M5.5 20.2h13"/>',
  deck: '<rect x="4" y="3.4" width="12" height="16" rx="1.6"/><path d="M7.3 6.8h5.4M7.3 10.4h5.4M7.3 14h3.3"/><path d="M8 21h10.2a1.8 1.8 0 0 0 1.8-1.8V7"/>',
  energy: '<path d="m13.2 2.5-7 10.2h5.2L10.8 21.5l7-10.6h-5.2l.6-8.4Z"/>',
  coin: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.3v9.4M9.8 9.4h3.5a2.1 2.1 0 0 1 0 4.2h-2.7a2.1 2.1 0 0 0 0 4.2h3.7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.7 2.7 0 1 1 3.8 2.5c-.9.4-1.3 1-1.3 2"/><circle cx="12" cy="17.2" r=".8" fill="currentColor" stroke="none"/>',
  sound: '<path d="M4 9.3h3.2L12 5.5v13l-4.8-3.8H4z"/><path d="M15.4 8.8a4.6 4.6 0 0 1 0 6.4M18 6.4a8.1 8.1 0 0 1 0 11.2"/>',
  mute: '<path d="M4 9.3h3.2L12 5.5v13l-4.8-3.8H4z"/><path d="m15.5 9.5 5 5m0-5-5 5"/>',
  music: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  musicOff: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/><path d="m3 3 18 18"/>',
  map: '<path d="m3.2 6.3 5.5-2.1 6.6 2.1 5.5-2.1v13.5l-5.5 2.1-6.6-2.1-5.5 2.1V6.3Z"/><path d="M8.7 4.2v13.5M15.3 6.3v13.5"/>',
  arrowUp: '<path d="M12 20V4M6.5 9.5 12 4l5.5 5.5"/>',
  arrowDown: '<path d="M12 4v16M6.5 14.5 12 20l5.5-5.5"/>',
  target: '<circle cx="12" cy="12" r="7.2"/><circle cx="12" cy="12" r="2.6"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  drop: '<path d="M12 2.8c3 4.2 6.2 7.1 6.2 10.6a6.2 6.2 0 0 1-12.4 0C5.8 9.9 9 7 12 2.8Z"/>',
  thorn: '<path d="m12 2.8 2.2 5.2 5.4-1.5-3.4 4.4 4.5 3.3-5.6.4.4 5.6-3.5-4.3-3.5 4.3.4-5.6-5.6-.4 4.5-3.3L4.4 6.5l5.4 1.5L12 2.8Z"/>',
  feather: '<path d="M20.2 3.8c-6.5 0-11 3-13 7.1-1.1 2.3-1 4.6-.2 6.3L18.4 5.8M5.5 20.5 9 15.2M8.4 12.8c3.9.2 7.2-1 9.7-4.2"/>',
  leaf: '<path d="M20.5 3.5C10 3 4.3 8.1 4.3 14.7c0 2.6 1.2 4.6 2.8 5.7 2.6-6.3 6.9-10 12-12.4-4.4 3.2-7.8 7.4-9.4 13"/>',
  paw: '<circle cx="6.2" cy="10" r="1.7"/><circle cx="10" cy="6.7" r="1.7"/><circle cx="14.4" cy="6.7" r="1.7"/><circle cx="18" cy="10" r="1.7"/><path d="M7.7 16.2c0-2.3 1.9-4.2 4.3-4.2s4.3 1.9 4.3 4.2c0 2.1-1.7 3.6-4.3 3.6s-4.3-1.5-4.3-3.6Z"/>',
  book: '<path d="M4.2 5.2c2.8-1.3 5.2-.8 7.8 1.2 2.6-2 5-2.5 7.8-1.2v13.2c-2.8-1.1-5.2-.6-7.8 1.4-2.6-2-5-2.5-7.8-1.4V5.2Z"/><path d="M12 6.4v13.2"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r=".9" fill="currentColor" stroke="none"/>',
  anvil: '<path d="M4 10.5h10.5c2.9 0 4.5-1 5.5-2.6.5 2.8-.8 4.8-3.2 5.7v2.2H8.3v-2.4C5.8 13 4.8 11.8 4 10.5Z"/><path d="M9.8 16.2h6.5v3.2H9.8zM7 20.6h11.4"/>',
  herb: '<path d="M12 21V9.5M12 13.5C8.4 13.5 6 11.4 6 7.5c3.6 0 6 2.1 6 6ZM12 10c0-4.4 2.8-6.8 6.5-6.8 0 4.1-2.6 6.8-6.5 6.8Z"/>',
  belt: '<path d="M3 8.5h18v7H3z"/><rect x="9" y="7" width="6" height="10" rx="1.2"/><path d="M12 9.2v5.6"/>',
  eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  hourglass: '<path d="M6 3.5h12M6 20.5h12M7.5 3.5v3.2c0 2 2 3.4 4.5 5.3 2.5-1.9 4.5-3.3 4.5-5.3V3.5M7.5 20.5v-3.2c0-2 2-3.4 4.5-5.3 2.5 1.9 4.5 3.3 4.5 5.3v3.2"/>',
  rose: '<path d="M12 8.2c2.8 0 4.6 1.5 4.6 3.8 0 2.7-2 4.5-4.6 4.5s-4.6-1.8-4.6-4.5c0-2.3 1.8-3.8 4.6-3.8Z"/><path d="M12 3.5v4.7M12 16.5V21M7 6.5l2.2 3M17 6.5l-2.2 3M7.5 18.5l2.2-3M16.5 18.5l-2.2-3"/>',
  lizard: '<path d="M20 5.2c-4.7-1.8-9.4.2-11.8 3.7-2 2.9-2.2 6.3-.8 9.1"/><path d="M7.4 18 3.5 20.5M8.2 10.4c2.8 0 4.8 1.6 5.7 4.2M18.5 5.6l1.8-1.9M14.5 5.1l.4-2.3"/>',
  spark: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8"/><circle cx="12" cy="12" r="3.2"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 13h9.4l.8-13M10 10.5v6M14 10.5v6"/>',
  x: '<path d="m5.5 5.5 13 13m0-13-13 13"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  bowl: '<path d="M3.5 10.5h17c0 5.5-3.8 9.3-8.5 9.3s-8.5-3.8-8.5-9.3Z"/><path d="M8 6.5c0-1.4 1.8-1.6 1.8-3M12 6.5c0-1.4 1.8-1.6 1.8-3M16 6.5c0-1.4 1.8-1.6 1.8-3"/>',
  mirror: '<circle cx="12" cy="12" r="8.5"/><path d="M8.2 9.2c.8-1.6 2.3-2.6 4.1-2.6M12 3.5v17M3.5 12h17"/>',
  scroll: '<path d="M6 3.5h11.5a2 2 0 0 1 2 2V18a2.5 2.5 0 0 0 2.5 2.5H8A3 3 0 0 1 5 17.5V5a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M8 7h8M8 10.5h8M8 14h5M5 17.5A3 3 0 0 1 8 14.5h9"/>'
};
function icon(name, cls = '') {
  const path = ICON_PATHS[name] || ICON_PATHS.spark;
  return '<svg class="icon ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
}

/* ---------------------------------------------------------
   Sound — tiny synthesized stings
   --------------------------------------------------------- */
const Sound = {
  ctx: null,
  enabled: store.get('emberpath.sound', true) !== false,
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    } catch (_) { this.ctx = null; }
  },
  tone(freq, dur, type = 'sine', volume = 0.035, slide = 0, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + dur);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.03);
    } catch (_) { /* audio is optional */ }
  },
  noise(dur = 0.12, volume = 0.02) {
    if (!this.enabled || !this.ctx) return;
    try {
      const size = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      src.buffer = buffer;
      src.connect(gain).connect(this.ctx.destination);
      src.start();
    } catch (_) { /* audio is optional */ }
  },
  play(name) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    switch (name) {
      case 'click': this.tone(520, .045, 'triangle', .012); break;
      case 'card': this.tone(330, .07, 'triangle', .025, 80); break;
      case 'attack': this.noise(.09, .028); this.tone(170, .12, 'sawtooth', .022, -90); break;
      case 'hit': this.noise(.11, .03); this.tone(110, .14, 'square', .02, -45); break;
      case 'block': this.tone(240, .12, 'triangle', .025, 60); break;
      case 'heal': this.tone(440, .18, 'sine', .026, 180); this.tone(660, .22, 'sine', .015, 120, .06); break;
      case 'gold': this.tone(880, .07, 'triangle', .02); this.tone(1180, .09, 'triangle', .014, 0, .06); break;
      case 'hurt': this.tone(95, .2, 'sawtooth', .03, -30); this.noise(.16, .02); break;
      case 'turn': this.tone(330, .16, 'sine', .02, 40); break;
      case 'victory': [392, 523, 659, 784].forEach((f, i) => this.tone(f, .34, 'triangle', .025, 0, i * .13)); break;
      case 'defeat': [220, 185, 147, 110].forEach((f, i) => this.tone(f, .45, 'sine', .028, -10, i * .15)); break;
      case 'open': this.tone(600, .06, 'triangle', .012, 90); break;
      default: this.tone(440, .05, 'sine', .012);
    }
  },
  toggle() {
    this.enabled = !this.enabled;
    store.set('emberpath.sound', this.enabled);
    if (this.enabled) this.play('click');
  }
};


/* ---------------------------------------------------------
   Music — procedural, scene-aware ambient score
   --------------------------------------------------------- */
const MUSIC_CHORDS = {
  dm7: { notes: [50, 53, 57, 60], bass: 38 },
  dm9: { notes: [50, 53, 57, 64], bass: 38 },
  bb: { notes: [46, 50, 53, 57], bass: 34 },
  gm: { notes: [43, 50, 55, 58], bass: 31 },
  am: { notes: [45, 48, 52, 57], bass: 33 },
  f: { notes: [41, 48, 53, 57], bass: 29 },
  c: { notes: [48, 52, 55, 60], bass: 36 }
};

const MUSIC_SCENES = {
  title: {
    step: 0.82, chordSteps: 16,
    chords: [MUSIC_CHORDS.dm7, MUSIC_CHORDS.bb, MUSIC_CHORDS.gm, MUSIC_CHORDS.am],
    pad: 0.9, bass: 0.03, melodyEvery: 4, melodyChance: 0.34,
    kick: [], snare: [], hat: [], pulse: []
  },
  map: {
    step: 0.76, chordSteps: 16,
    chords: [MUSIC_CHORDS.dm7, MUSIC_CHORDS.bb, MUSIC_CHORDS.f, MUSIC_CHORDS.c],
    pad: 0.82, bass: 0.032, melodyEvery: 4, melodyChance: 0.42,
    kick: [], snare: [], hat: [], pulse: [0, 8]
  },
  combat: {
    step: 0.56, chordSteps: 8,
    chords: [MUSIC_CHORDS.dm7, MUSIC_CHORDS.bb, MUSIC_CHORDS.gm, MUSIC_CHORDS.am],
    pad: 0.68, bass: 0.044, melodyEvery: 2, melodyChance: 0.5,
    kick: [0, 3, 6, 10, 12], snare: [4, 12], hat: [1, 3, 5, 7, 9, 11, 13, 15], pulse: []
  },
  boss: {
    step: 0.47, chordSteps: 8,
    chords: [MUSIC_CHORDS.dm7, MUSIC_CHORDS.bb, MUSIC_CHORDS.gm, MUSIC_CHORDS.am],
    pad: 0.7, bass: 0.052, melodyEvery: 2, melodyChance: 0.6, boss: true,
    kick: [0, 2, 4, 6, 8, 10, 12, 14], snare: [3, 7, 11, 15],
    hat: [1, 3, 5, 7, 9, 11, 13, 15], pulse: []
  },
  end: {
    step: 0.9, chordSteps: 16,
    chords: [MUSIC_CHORDS.dm9, MUSIC_CHORDS.bb],
    pad: 0.88, bass: 0.028, melodyEvery: 5, melodyChance: 0.28,
    kick: [], snare: [], hat: [], pulse: []
  }
};

const MUSIC_SCALE = [62, 64, 65, 67, 69, 70, 72, 74, 77];

const Music = {
  enabled: store.get('emberpath.music', true) !== false,
  ctx: null,
  master: null,
  reverb: null,
  wet: null,
  noiseBuffer: null,
  bus: null,
  scene: null,
  sceneName: 'title',
  playingScene: null,
  timer: null,
  nextTime: 0,
  step: 0,
  notesScheduled: 0,

  init() {
    Sound.init();
    const ctx = Sound.ctx;
    if (!ctx) return false;
    if (this.ctx === ctx && this.master) return true;
    this.ctx = ctx;
    try {
      this.master = ctx.createGain();
      this.master.gain.value = 0.45;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 18;
      comp.ratio.value = 3.2;
      comp.attack.value = 0.008;
      comp.release.value = 0.32;
      this.master.connect(comp);
      comp.connect(ctx.destination);
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.makeReverb(3.4);
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.5;
      this.reverb.connect(this.wet);
      this.wet.connect(this.master);
      const noiseLen = Math.floor(ctx.sampleRate * 1.2);
      this.noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const noise = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) noise[i] = Math.random() * 2 - 1;
      return true;
    } catch (_) {
      this.master = null;
      this.reverb = null;
      this.wet = null;
      this.noiseBuffer = null;
      return false;
    }
  },

  makeReverb(seconds) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.7);
      }
    }
    return buffer;
  },

  midi(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  },

  playNote(bus, midiNote, when, duration, gain, type, attack, cutoff, detune) {
    if (!this.ctx || !bus) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(this.midi(midiNote), when);
      if (detune) osc.detune.setValueAtTime(detune, when);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff || 1200, when);
      filter.Q.value = 0.6;
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + (attack || 0.02));
      env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      osc.connect(filter);
      filter.connect(env);
      env.connect(bus);
      osc.start(when);
      osc.stop(when + duration + 0.06);
      this.notesScheduled++;
    } catch (_) { /* audio is optional */ }
  },

  playPad(chord, when, duration, scene) {
    const gain = 0.0068 * scene.pad;
    chord.notes.forEach((note) => {
      this.playNote(this.bus, note, when, duration, gain, 'triangle', 1.7, 820, -4);
      this.playNote(this.bus, note, when, duration, gain, 'triangle', 1.9, 760, 4);
    });
    this.playNote(this.bus, chord.bass, when, duration * 0.95, scene.bass, 'sine', 0.6, 190, 0);
    this.playNote(this.bus, chord.bass + 12, when, duration * 0.9, scene.bass * 0.55, 'triangle', 0.7, 240, 0);
  },

  playMelody(when, scene) {
    const note = MUSIC_SCALE[Math.floor(Math.random() * MUSIC_SCALE.length)];
    const octave = Math.random() < 0.22 ? 12 : 0;
    this.playNote(this.bus, note + octave, when, 2.3, scene.boss ? 0.036 : 0.03, 'triangle', 0.02, 2600, 0);
  },

  kick(when, heavy) {
    if (!this.ctx || !this.bus) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(heavy ? 105 : 125, when);
      osc.frequency.exponentialRampToValueAtTime(heavy ? 34 : 42, when + 0.22);
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(heavy ? 0.105 : 0.075, when + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, when + (heavy ? 0.4 : 0.3));
      osc.connect(env);
      env.connect(this.bus);
      osc.start(when);
      osc.stop(when + 0.45);
      this.notesScheduled++;
    } catch (_) { /* audio is optional */ }
  },

  percussion(when, kind) {
    if (!this.ctx || !this.bus || !this.noiseBuffer) return;
    try {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();
      src.buffer = this.noiseBuffer;
      if (kind === 'snare') {
        filter.type = 'bandpass';
        filter.frequency.value = 1700;
        filter.Q.value = 0.8;
        env.gain.setValueAtTime(0.0001, when);
        env.gain.exponentialRampToValueAtTime(0.024, when + 0.004);
        env.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
        src.start(when);
        src.stop(when + 0.2);
      } else {
        filter.type = 'highpass';
        filter.frequency.value = 6800;
        env.gain.setValueAtTime(0.0001, when);
        env.gain.exponentialRampToValueAtTime(0.0065, when + 0.002);
        env.gain.exponentialRampToValueAtTime(0.0001, when + 0.055);
        src.start(when);
        src.stop(when + 0.07);
      }
      src.connect(filter);
      filter.connect(env);
      env.connect(this.bus);
      this.notesScheduled++;
    } catch (_) { /* audio is optional */ }
  },

  playPulse(when) {
    if (!this.ctx || !this.bus) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(84, when);
      osc.frequency.exponentialRampToValueAtTime(44, when + 0.34);
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(0.022, when + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
      osc.connect(env);
      env.connect(this.bus);
      osc.start(when);
      osc.stop(when + 0.55);
      this.notesScheduled++;
    } catch (_) { /* audio is optional */ }
  },

  scheduleStep(step, when) {
    const scene = this.scene;
    if (!scene) return;
    const chordSteps = scene.chordSteps || 16;
    if (step % chordSteps === 0) {
      const chord = scene.chords[Math.floor(step / chordSteps) % scene.chords.length];
      this.playPad(chord, when, scene.step * chordSteps * 1.08, scene);
    }
    if (scene.melodyEvery && step % scene.melodyEvery === 0 && Math.random() < scene.melodyChance) {
      this.playMelody(when, scene);
    }
    const pos = step % 16;
    if (scene.pulse && scene.pulse.indexOf(pos) !== -1) this.playPulse(when);
    if (scene.kick && scene.kick.indexOf(pos) !== -1) this.kick(when, !!scene.boss);
    if (scene.snare && scene.snare.indexOf(pos) !== -1) this.percussion(when, 'snare');
    if (scene.hat && scene.hat.indexOf(pos) !== -1) this.percussion(when, 'hat');
  },

  schedule() {
    if (!this.ctx || !this.bus || !this.scene) return;
    const now = this.ctx.currentTime;
    if (this.nextTime < now - 0.5) this.nextTime = now + 0.1;
    const ahead = now + 0.7;
    let guard = 0;
    while (this.nextTime < ahead && guard++ < 40) {
      const when = Math.max(this.nextTime, now + 0.03);
      this.scheduleStep(this.step, when);
      this.step++;
      this.nextTime += this.scene.step;
    }
  },

  startScene(name) {
    if (!this.ctx || !this.master || !this.enabled) return;
    this.stopBus(0.35);
    try {
      const scene = MUSIC_SCENES[name] || MUSIC_SCENES.map;
      this.scene = scene;
      this.playingScene = name;
      this.step = 0;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0.0001, now);
      bus.gain.exponentialRampToValueAtTime(0.92, now + 1.1);
      const dry = ctx.createGain();
      dry.gain.value = 0.82;
      const send = ctx.createGain();
      send.gain.value = 0.3;
      bus.connect(dry);
      dry.connect(this.master);
      bus.connect(send);
      send.connect(this.reverb);
      this.bus = bus;
      this.nextTime = now + 0.12;
      this.timer = setInterval(() => this.schedule(), 120);
      this.schedule();
    } catch (_) {
      this.stopBus(0.1);
    }
  },

  stopBus(fade) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const old = this.bus;
    this.bus = null;
    this.playingScene = null;
    if (!old || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      old.gain.cancelScheduledValues(now);
      old.gain.setTargetAtTime(0.0001, now, fade || 0.3);
    } catch (_) { /* audio is optional */ }
    setTimeout(() => {
      try { old.disconnect(); } catch (_) { /* already gone */ }
    }, 1800);
  },

  setScene(name) {
    this.sceneName = name || 'map';
    if (!this.enabled || !this.ctx || !this.master) return;
    if (this.playingScene === this.sceneName) return;
    this.startScene(this.sceneName);
  },

  onGesture() {
    if (!this.enabled) return;
    if (!this.ctx || !this.master) {
      Sound.init();
      if (!this.init()) return;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (!this.playingScene) this.startScene(this.sceneName || 'title');
  },

  toggle() {
    this.enabled = !this.enabled;
    store.set('emberpath.music', this.enabled);
    if (!this.enabled) {
      this.stopBus(0.25);
      return;
    }
    Sound.init();
    if (!this.init()) {
      this.enabled = false;
      store.set('emberpath.music', false);
      return;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    this.startScene(this.sceneName || 'title');
  },

  duck(hidden) {
    if (!this.ctx || !this.master) return;
    const target = hidden ? 0.11 : 0.45;
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25);
  },

  resync() {
    if (!this.ctx || !this.bus) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.schedule();
  }
};

document.addEventListener('visibilitychange', () => {
  if (!Music.ctx) return;
  Music.duck(document.hidden);
  if (!document.hidden) Music.resync();
});

/* ---------------------------------------------------------
   Keyword glossary
   --------------------------------------------------------- */
const KEYWORDS = {
  '格挡': '格挡会抵挡等量伤害。你的格挡会在自己回合开始时清空。',
  '力量': '每层力量使攻击伤害提高 1 点。',
  '敏捷': '每层敏捷使获得的格挡提高 1 点。',
  '易伤': '受到的攻击伤害提高 50%。每回合结束减少 1 层。',
  '虚弱': '造成的攻击伤害降低 25%。每回合结束减少 1 层。',
  '中毒': '在自己的回合开始时失去等量生命，然后减少 1 层。中毒无视格挡。',
  '荆棘': '受到攻击时，对攻击者造成等量伤害。',
  '金属化': '回合结束时获得等量格挡。',
  '再生': '回合开始时回复等量生命，然后减少 1 层。',
  '仪式': '回合开始时获得等量力量。',
  '消耗': '打出后本场战斗不再出现。',
  '能力': '打出后持续生效，本场战斗不再出现。'
};
const KW_RE = new RegExp('(' + Object.keys(KEYWORDS).sort((a, b) => b.length - a.length).join('|') + ')', 'g');
function kw(text) {
  return String(text).replace(KW_RE, (m) => '<span class="kw" title="' + escapeAttr(KEYWORDS[m]) + '">' + m + '</span>');
}

/* ---------------------------------------------------------
   Cards
   --------------------------------------------------------- */
const RARITY_LABEL = { starter: '初始', common: '普通', uncommon: '罕见', rare: '稀有' };
const TYPE_LABEL = { attack: '攻击', skill: '技能', power: '能力' };

const CARD_DEFS = {
  /* ---- starter ---- */
  strike: {
    name: '打击', type: 'attack', rarity: 'starter', target: 'enemy', glyph: '斩',
    stats: { cost: 1, dmg: 6 }, up: { dmg: 9 },
    text: s => '造成 ' + s.dmg + ' 点伤害。',
    effects: s => [{ k: 'damage', n: s.dmg }],
    flavor: '刀锋比誓言更诚实。'
  },
  defend: {
    name: '防御', type: 'skill', rarity: 'starter', target: 'self', glyph: '守',
    stats: { cost: 1, block: 5 }, up: { block: 8 },
    text: s => '获得 ' + s.block + ' 点格挡。',
    effects: s => [{ k: 'block', n: s.block }],
    flavor: '活下来，才有下一页。'
  },
  quick_slash: {
    name: '迅斩', type: 'attack', rarity: 'starter', target: 'enemy', glyph: '迅',
    stats: { cost: 1, dmg: 7, draw: 1 }, up: { dmg: 10 },
    text: s => '造成 ' + s.dmg + ' 点伤害，抽 ' + s.draw + ' 张牌。',
    effects: s => [{ k: 'damage', n: s.dmg }, { k: 'draw', n: s.draw }],
    flavor: '快一步，就多一线生机。'
  },
  meditate: {
    name: '沉思', type: 'skill', rarity: 'starter', target: 'self', glyph: '念',
    stats: { cost: 1, draw: 2 }, up: { draw: 3 },
    text: s => '抽 ' + s.draw + ' 张牌。',
    effects: s => [{ k: 'draw', n: s.draw }],
    flavor: '灰烬落下之前，先看清风的方向。'
  },

  /* ---- common attacks ---- */
  slash: {
    name: '劈砍', type: 'attack', rarity: 'common', target: 'enemy', glyph: '劈',
    stats: { cost: 1, dmg: 9 }, up: { dmg: 12 },
    text: s => '造成 ' + s.dmg + ' 点伤害。',
    effects: s => [{ k: 'damage', n: s.dmg }],
    flavor: '没有花哨，只有从肩到腰的一刀。'
  },
  twin_strike: {
    name: '连刺', type: 'attack', rarity: 'common', target: 'enemy', glyph: '双',
    stats: { cost: 1, dmg: 4, hits: 2 }, up: { dmg: 6 },
    text: s => '造成 ' + s.dmg + ' 点伤害 ' + s.hits + ' 次。',
    effects: s => [{ k: 'damage', n: s.dmg, times: s.hits }],
    flavor: '第一下让你看见刀，第二下让你记住它。'
  },
  cleave: {
    name: '横扫', type: 'attack', rarity: 'common', target: 'all', glyph: '扫',
    stats: { cost: 1, dmg: 6 }, up: { dmg: 9 },
    text: s => '对所有敌人造成 ' + s.dmg + ' 点伤害。',
    effects: s => [{ k: 'damage', n: s.dmg, all: true }],
    flavor: '包围圈越大，刀锋越开心。'
  },
  heavy_blow: {
    name: '重斩', type: 'attack', rarity: 'common', target: 'enemy', glyph: '重',
    stats: { cost: 2, dmg: 16, vuln: 1 }, up: { dmg: 21, vuln: 2 },
    text: s => '造成 ' + s.dmg + ' 点伤害，施加 ' + s.vuln + ' 层易伤。',
    effects: s => [{ k: 'damage', n: s.dmg }, { k: 'status', name: 'vulnerable', n: s.vuln, target: 'enemy' }],
    flavor: '把对手的架势连同骨头一起砸开。'
  },
  shield_bash: {
    name: '盾击', type: 'attack', rarity: 'common', target: 'enemy', glyph: '盾',
    stats: { cost: 1, bonus: 0 }, up: { bonus: 4 },
    text: s => '造成等同于当前格挡' + (s.bonus ? ' + ' + s.bonus : '') + ' 的伤害。',
    effects: s => [{ k: 'damage', n: 0, fromBlock: true, bonus: s.bonus }],
    flavor: '最好的进攻，是把你刚刚挡下的东西还回去。'
  },
  quick_draw: {
    name: '快刀', type: 'attack', rarity: 'common', target: 'enemy', glyph: '刃',
    stats: { cost: 0, dmg: 4, draw: 1 }, up: { dmg: 7 },
    text: s => '造成 ' + s.dmg + ' 点伤害，抽 ' + s.draw + ' 张牌。',
    effects: s => [{ k: 'damage', n: s.dmg }, { k: 'draw', n: s.draw }],
    flavor: '拔刀和收刀，听起来像一声呼吸。'
  },
  poison_fang: {
    name: '毒牙', type: 'attack', rarity: 'common', target: 'enemy', glyph: '毒',
    stats: { cost: 1, dmg: 4, poison: 3 }, up: { dmg: 6, poison: 4 },
    text: s => '造成 ' + s.dmg + ' 点伤害，施加 ' + s.poison + ' 层中毒。',
    effects: s => [{ k: 'damage', n: s.dmg }, { k: 'status', name: 'poison', n: s.poison, target: 'enemy' }],
    flavor: '荒野里的东西，从不只长一副牙齿。'
  },
  blood_edge: {
    name: '血刃', type: 'attack', rarity: 'common', target: 'enemy', glyph: '血',
    stats: { cost: 1, dmg: 9, lose: 2 }, up: { dmg: 13 },
    text: s => '造成 ' + s.dmg + ' 点伤害，失去 ' + s.lose + ' 点生命。',
    effects: s => [{ k: 'damage', n: s.dmg }, { k: 'loseHp', n: s.lose }],
    flavor: '刀上的锈，有一半是自己的血。'
  },
  flurry: {
    name: '乱舞', type: 'attack', rarity: 'common', target: 'enemy', glyph: '乱',
    stats: { cost: 1, dmg: 3, hits: 3 }, up: { dmg: 4 },
    text: s => '造成 ' + s.dmg + ' 点伤害 ' + s.hits + ' 次。',
    effects: s => [{ k: 'damage', n: s.dmg, times: s.hits }],
    flavor: '看起来毫无章法，直到你倒下。'
  },

  /* ---- common skills ---- */
  iron_wall: {
    name: '铁壁', type: 'skill', rarity: 'common', target: 'self', glyph: '壁',
    stats: { cost: 2, block: 14 }, up: { block: 20 },
    text: s => '获得 ' + s.block + ' 点格挡。',
    effects: s => [{ k: 'block', n: s.block }],
    flavor: '后退一步，把世界挡在外面。'
  },
  evade: {
    name: '闪避', type: 'skill', rarity: 'common', target: 'self', glyph: '闪',
    stats: { cost: 1, block: 7, draw: 1 }, up: { block: 10 },
    text: s => '获得 ' + s.block + ' 点格挡，抽 ' + s.draw + ' 张牌。',
    effects: s => [{ k: 'block', n: s.block }, { k: 'draw', n: s.draw }],
    flavor: '刀锋擦过衣角，这也是一种回答。'
  },
  smoke_bomb: {
    name: '烟幕', type: 'skill', rarity: 'common', target: 'all', glyph: '烟',
    stats: { cost: 1, weak: 2 }, up: { weak: 3 },
    text: s => '对所有敌人施加 ' + s.weak + ' 层虚弱。',
    effects: s => [{ k: 'status', name: 'weak', n: s.weak, target: 'all' }],
    flavor: '看不见的敌人，通常也打不准。'
  },
  bandage: {
    name: '绷带', type: 'skill', rarity: 'common', target: 'self', glyph: '愈',
    stats: { cost: 0, heal: 4 }, up: { heal: 7 }, exhaust: true,
    text: s => '回复 ' + s.heal + ' 点生命。消耗。',
    effects: s => [{ k: 'heal', n: s.heal }],
    flavor: '布条不干净，但比流血好。'
  },
  brace: {
    name: '架势', type: 'skill', rarity: 'common', target: 'self', glyph: '架',
    stats: { cost: 1, block: 6, next: 6 }, up: { block: 9, next: 9 },
    text: s => '获得 ' + s.block + ' 点格挡，下回合开始时获得 ' + s.next + ' 点格挡。',
    effects: s => [{ k: 'block', n: s.block }, { k: 'nextBlock', n: s.next }],
    flavor: '呼吸放慢，刀就不会抖。'
  },
  focus: {
    name: '凝神', type: 'skill', rarity: 'common', target: 'self', glyph: '凝',
    stats: { cost: 1, draw: 2 }, up: { draw: 3 },
    text: s => '抽 ' + s.draw + ' 张牌。',
    effects: s => [{ k: 'draw', n: s.draw }],
    flavor: '把杂念一张一张地放下。'
  },
  cleanse: {
    name: '净化', type: 'skill', rarity: 'common', target: 'self', glyph: '净',
    stats: { cost: 1, block: 6 }, up: { block: 10 }, exhaust: true,
    text: s => '移除自身所有易伤、虚弱与中毒，获得 ' + s.block + ' 点格挡。消耗。',
    effects: s => [{ k: 'cleanse' }, { k: 'block', n: s.block }],
    flavor: '灰烬可以洗掉，伤疤不行。'
  },

  /* ---- uncommon ---- */
  sword_dance: {
    name: '剑舞', type: 'attack', rarity: 'uncommon', target: 'enemy', glyph: '舞',
    stats: { cost: 2, dmg: 7, hits: 3 }, up: { dmg: 9 },
    text: s => '造成 ' + s.dmg + ' 点伤害 ' + s.hits + ' 次。',
    effects: s => [{ k: 'damage', n: s.dmg, times: s.hits }],
    flavor: '第三步之后，观众只剩下一个。'
  },
  soul_siphon: {
    name: '吸魂斩', type: 'attack', rarity: 'uncommon', target: 'enemy', glyph: '吸',
    stats: { cost: 2, dmg: 10 }, up: { dmg: 14 },
    text: s => '造成 ' + s.dmg + ' 点伤害，回复等同于未被格挡伤害的生命。',
    effects: s => [{ k: 'damage', n: s.dmg, lifesteal: true }],
    flavor: '刀口饮下的东西，会流回握刀的人。'
  },
  armor_pierce: {
    name: '破甲', type: 'attack', rarity: 'uncommon', target: 'enemy', glyph: '破',
    stats: { cost: 1, dmg: 8, vuln: 2 }, up: { dmg: 11, vuln: 3 },
    text: s => '造成 ' + s.dmg + ' 点伤害，施加 ' + s.vuln + ' 层易伤。',
    effects: s => [{ k: 'damage', n: s.dmg }, { k: 'status', name: 'vulnerable', n: s.vuln, target: 'enemy' }],
    flavor: '盔甲只保护它覆盖的地方。'
  },
  venom_strike: {
    name: '蚀骨', type: 'attack', rarity: 'uncommon', target: 'enemy', glyph: '蚀',
    stats: { cost: 2, dmg: 8, poison: 6 }, up: { dmg: 10, poison: 9 },
    text: s => '造成 ' + s.dmg + ' 点伤害，施加 ' + s.poison + ' 层中毒。',
    effects: s => [{ k: 'damage', n: s.dmg }, { k: 'status', name: 'poison', n: s.poison, target: 'enemy' }],
    flavor: '先让它疼，再让它慢慢明白。'
  },
  riposte: {
    name: '反击', type: 'attack', rarity: 'uncommon', target: 'enemy', glyph: '反',
    stats: { cost: 1, dmg: 6, block: 6 }, up: { dmg: 9, block: 9 },
    text: s => '造成 ' + s.dmg + ' 点伤害，获得 ' + s.block + ' 点格挡。',
    effects: s => [{ k: 'damage', n: s.dmg }, { k: 'block', n: s.block }],
    flavor: '挡住，然后让对方为这个动作后悔。'
  },
  execute: {
    name: '处决', type: 'attack', rarity: 'uncommon', target: 'enemy', glyph: '决',
    stats: { cost: 2, dmg: 18 }, up: { dmg: 24 },
    text: s => '造成 ' + s.dmg + ' 点伤害。若目标生命低于 40%，伤害翻倍。',
    effects: s => [{ k: 'damage', n: s.dmg, execute: true }],
    flavor: '审判不需要陪审团。'
  },
  warcry: {
    name: '战吼', type: 'power', rarity: 'uncommon', target: 'self', glyph: '吼',
    stats: { cost: 1, str: 2, draw: 1 }, up: { str: 3 },
    text: s => '获得 ' + s.str + ' 点力量，抽 ' + s.draw + ' 张牌。',
    effects: s => [{ k: 'status', name: 'strength', n: s.str, target: 'self' }, { k: 'draw', n: s.draw }],
    flavor: '让肺里的火先烧起来。'
  },
  sharpen: {
    name: '磨砺', type: 'power', rarity: 'uncommon', target: 'self', glyph: '砺',
    stats: { cost: 1, dex: 2 }, up: { dex: 3 },
    text: s => '获得 ' + s.dex + ' 点敏捷。',
    effects: s => [{ k: 'status', name: 'dexterity', n: s.dex, target: 'self' }],
    flavor: '磨刀石记得每一次呼吸。'
  },
  intimidate: {
    name: '威吓', type: 'skill', rarity: 'uncommon', target: 'all', glyph: '威',
    stats: { cost: 0, weak: 2 }, up: { weak: 3 }, exhaust: true,
    text: s => '对所有敌人施加 ' + s.weak + ' 层虚弱。消耗。',
    effects: s => [{ k: 'status', name: 'weak', n: s.weak, target: 'all' }],
    flavor: '有些人不用拔刀。'
  },
  blood_sacrifice: {
    name: '血祭', type: 'skill', rarity: 'uncommon', target: 'self', glyph: '祭',
    stats: { cost: 0, lose: 4, energy: 2 }, up: { lose: 2 }, exhaust: true,
    text: s => '失去 ' + s.lose + ' 点生命，获得 ' + s.energy + ' 点行动力。消耗。',
    effects: s => [{ k: 'loseHp', n: s.lose }, { k: 'energy', n: s.energy }],
    flavor: '力量从来不是免费的。'
  },
  second_wind: {
    name: '喘息', type: 'skill', rarity: 'uncommon', target: 'self', glyph: '息',
    stats: { cost: 1, heal: 8 }, up: { heal: 12 }, exhaust: true,
    text: s => '回复 ' + s.heal + ' 点生命。消耗。',
    effects: s => [{ k: 'heal', n: s.heal }],
    flavor: '放下刀，才听得见自己的心跳。'
  },
  flame_ward: {
    name: '炎护', type: 'skill', rarity: 'uncommon', target: 'self', glyph: '炎',
    stats: { cost: 2, block: 12, thorns: 2 }, up: { block: 16, thorns: 3 },
    text: s => '获得 ' + s.block + ' 点格挡和 ' + s.thorns + ' 点荆棘。',
    effects: s => [{ k: 'block', n: s.block }, { k: 'status', name: 'thorns', n: s.thorns, target: 'self' }],
    flavor: '靠近的人会先学会尊重火。'
  },
  dark_pact: {
    name: '暗契', type: 'skill', rarity: 'uncommon', target: 'self', glyph: '契',
    stats: { cost: 0, draw: 2, lose: 3 }, up: { draw: 3 },
    text: s => '抽 ' + s.draw + ' 张牌，失去 ' + s.lose + ' 点生命。',
    effects: s => [{ k: 'draw', n: s.draw }, { k: 'loseHp', n: s.lose }],
    flavor: '影子总会记得你借过什么。'
  },
  strength_awakening: {
    name: '力量觉醒', type: 'power', rarity: 'uncommon', target: 'self', glyph: '力',
    stats: { cost: 1, str: 2 }, up: { str: 3 },
    text: s => '获得 ' + s.str + ' 点力量。',
    effects: s => [{ k: 'status', name: 'strength', n: s.str, target: 'self' }],
    flavor: '骨骼在响，像一扇被推开的老门。'
  },
  iron_skin: {
    name: '铁甲术', type: 'power', rarity: 'uncommon', target: 'self', glyph: '铁',
    stats: { cost: 1, dex: 2 }, up: { dex: 3 },
    text: s => '获得 ' + s.dex + ' 点敏捷。',
    effects: s => [{ k: 'status', name: 'dexterity', n: s.dex, target: 'self' }],
    flavor: '皮肤之下，是更硬的东西。'
  },
  thorns_body: {
    name: '荆棘之躯', type: 'power', rarity: 'uncommon', target: 'self', glyph: '棘',
    stats: { cost: 1, thorns: 3 }, up: { thorns: 5 },
    text: s => '获得 ' + s.thorns + ' 点荆棘。',
    effects: s => [{ k: 'status', name: 'thorns', n: s.thorns, target: 'self' }],
    flavor: '荒野教会人的第一课：学会扎人。'
  },
  metallicize: {
    name: '金属化', type: 'power', rarity: 'uncommon', target: 'self', glyph: '钢',
    stats: { cost: 2, metal: 3 }, up: { metal: 4 },
    text: s => '获得 ' + s.metal + ' 点金属化。',
    effects: s => [{ k: 'status', name: 'metallicize', n: s.metal, target: 'self' }],
    flavor: '一层薄薄的铁，胜过一句厚重的承诺。'
  },
  poison_cloud: {
    name: '毒雾', type: 'power', rarity: 'uncommon', target: 'self', glyph: '雾',
    stats: { cost: 2, poison: 2 }, up: { poison: 3 },
    text: s => '每回合开始时对所有敌人施加 ' + s.poison + ' 层中毒。',
    effects: s => [{ k: 'status', name: 'poisonAura', n: s.poison, target: 'self' }],
    flavor: '空气本身开始有了恶意。'
  },
  draw_engine: {
    name: '抽牌引擎', type: 'power', rarity: 'uncommon', target: 'self', glyph: '智',
    stats: { cost: 1, draw: 1 }, up: { draw: 2 },
    text: s => '每回合多抽 ' + s.draw + ' 张牌。',
    effects: s => [{ k: 'status', name: 'drawPower', n: s.draw, target: 'self' }],
    flavor: '思绪像齿轮，一旦转起来就停不下。'
  },
  ritual_dance: {
    name: '仪式之舞', type: 'power', rarity: 'uncommon', target: 'self', glyph: '仪',
    stats: { cost: 2, ritual: 1 }, up: { ritual: 2 },
    text: s => '每回合开始时获得 ' + s.ritual + ' 点力量。',
    effects: s => [{ k: 'status', name: 'ritual', n: s.ritual, target: 'self' }],
    flavor: '每一步都踩在旧世界的脉搏上。'
  },
  regeneration: {
    name: '再生', type: 'power', rarity: 'uncommon', target: 'self', glyph: '生',
    stats: { cost: 2, regen: 3 }, up: { regen: 5 },
    text: s => '获得 ' + s.regen + ' 点再生。',
    effects: s => [{ k: 'status', name: 'regen', n: s.regen, target: 'self' }],
    flavor: '伤口合拢时，发出新芽的声音。'
  },

  /* ---- rare ---- */
  assassinate: {
    name: '斩魂', type: 'attack', rarity: 'rare', target: 'enemy', glyph: '灭',
    stats: { cost: 2, dmg: 26 }, up: { dmg: 34 }, exhaust: true,
    text: s => '造成 ' + s.dmg + ' 点伤害。消耗。',
    effects: s => [{ k: 'damage', n: s.dmg }],
    flavor: '有些东西被斩断后，连回声都没有。'
  },
  blade_storm: {
    name: '千刃风暴', type: 'attack', rarity: 'rare', target: 'enemy', glyph: '刃',
    stats: { cost: 3, dmg: 7, hits: 4 }, up: { dmg: 9 },
    text: s => '造成 ' + s.dmg + ' 点伤害 ' + s.hits + ' 次。',
    effects: s => [{ k: 'damage', n: s.dmg, times: s.hits }],
    flavor: '天空下起了一场铁做的雨。'
  },
  time_stop: {
    name: '时停', type: 'skill', rarity: 'rare', target: 'self', glyph: '停',
    stats: { cost: 2, energy: 2, draw: 3 }, up: { cost: 1 }, exhaust: true,
    text: s => '获得 ' + s.energy + ' 点行动力，抽 ' + s.draw + ' 张牌。消耗。',
    effects: s => [{ k: 'energy', n: s.energy }, { k: 'draw', n: s.draw }],
    flavor: '钟摆停在最高处。世界忘了下一拍。'
  },
  undying: {
    name: '不死之身', type: 'skill', rarity: 'rare', target: 'self', glyph: '朽',
    stats: { cost: 2, heal: 15 }, up: { heal: 22 }, exhaust: true,
    text: s => '回复 ' + s.heal + ' 点生命。消耗。',
    effects: s => [{ k: 'heal', n: s.heal }],
    flavor: '死亡试过很多次，后来就不来了。'
  },
  sword_saint: {
    name: '剑圣', type: 'power', rarity: 'rare', target: 'self', glyph: '圣',
    stats: { cost: 2, str: 3, draw: 2 }, up: { str: 4, draw: 3 },
    text: s => '获得 ' + s.str + ' 点力量，抽 ' + s.draw + ' 张牌。',
    effects: s => [{ k: 'status', name: 'strength', n: s.str, target: 'self' }, { k: 'draw', n: s.draw }],
    flavor: '剑到了某个境界，就不再需要鞘。'
  },
  blood_rage: {
    name: '血怒', type: 'power', rarity: 'rare', target: 'self', glyph: '怒',
    stats: { cost: 1, lose: 6, str: 3, dex: 3 }, up: { lose: 3 },
    text: s => '失去 ' + s.lose + ' 点生命，获得 ' + s.str + ' 点力量和 ' + s.dex + ' 点敏捷。',
    effects: s => [{ k: 'loseHp', n: s.lose }, { k: 'status', name: 'strength', n: s.str, target: 'self' }, { k: 'status', name: 'dexterity', n: s.dex, target: 'self' }],
    flavor: '疼痛是最快的老师。'
  },
  apocalypse: {
    name: '末日', type: 'attack', rarity: 'rare', target: 'all', glyph: '末',
    stats: { cost: 3, dmg: 20 }, up: { dmg: 28 },
    text: s => '对所有敌人造成 ' + s.dmg + ' 点伤害。',
    effects: s => [{ k: 'damage', n: s.dmg, all: true }],
    flavor: '最后一场火，烧得很安静。'
  },
  perfect_guard: {
    name: '完美格挡', type: 'skill', rarity: 'rare', target: 'self', glyph: '御',
    stats: { cost: 1, block: 18 }, up: { block: 26 },
    text: s => '获得 ' + s.block + ' 点格挡。',
    effects: s => [{ k: 'block', n: s.block }],
    flavor: '不是挡住刀，是让刀没有落下的地方。'
  },
  fate_dice: {
    name: '命运骰', type: 'skill', rarity: 'rare', target: 'self', glyph: '命',
    stats: { cost: 0, draw: 2, energy: 1 }, up: { draw: 3 }, exhaust: true,
    text: s => '抽 ' + s.draw + ' 张牌，获得 ' + s.energy + ' 点行动力。消耗。',
    effects: s => [{ k: 'draw', n: s.draw }, { k: 'energy', n: s.energy }],
    flavor: '骰子落地之前，命运还不算数。'
  },
  offering: {
    name: '献祭', type: 'skill', rarity: 'rare', target: 'self', glyph: '献',
    stats: { cost: 0, lose: 5, energy: 2, draw: 3 }, up: { lose: 3 }, exhaust: true,
    text: s => '失去 ' + s.lose + ' 点生命，获得 ' + s.energy + ' 点行动力，抽 ' + s.draw + ' 张牌。消耗。',
    effects: s => [{ k: 'loseHp', n: s.lose }, { k: 'energy', n: s.energy }, { k: 'draw', n: s.draw }],
    flavor: '祭坛没有回答，但它收下了。'
  },
  limit_break: {
    name: '突破极限', type: 'skill', rarity: 'rare', target: 'self', glyph: '极',
    stats: { cost: 1 }, up: { cost: 0 },
    text: () => '使当前力量翻倍。',
    effects: () => [{ k: 'doubleStrength' }],
    flavor: '极限只是别人画下的一条线。'
  },
  immortal_ember: {
    name: '不灭余烬', type: 'power', rarity: 'rare', target: 'self', glyph: '烬',
    stats: { cost: 2, regen: 4, metal: 4 }, up: { regen: 6, metal: 6 },
    text: s => '获得 ' + s.regen + ' 点再生和 ' + s.metal + ' 点金属化。',
    effects: s => [{ k: 'status', name: 'regen', n: s.regen, target: 'self' }, { k: 'status', name: 'metallicize', n: s.metal, target: 'self' }],
    flavor: '火会熄灭，余烬不会。'
  },
  demon_form: {
    name: '恶魔形态', type: 'power', rarity: 'rare', target: 'self', glyph: '魔',
    stats: { cost: 3, ritual: 2 }, up: { ritual: 3 },
    text: s => '每回合开始时获得 ' + s.ritual + ' 点力量。',
    effects: s => [{ k: 'status', name: 'ritual', n: s.ritual, target: 'self' }],
    flavor: '它一直在你身体里，只是终于被允许呼吸。'
  }
};

const STARTER_DECK = ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'quick_slash', 'meditate'];
const REWARD_CARD_IDS = Object.keys(CARD_DEFS).filter(id => CARD_DEFS[id].rarity !== 'starter');

let cardUidCounter = 0;
function makeCard(id, upgraded = false) {
  return { uid: 'c' + (++cardUidCounter) + '-' + Math.random().toString(36).slice(2, 6), id, upgraded: !!upgraded };
}
function cardData(card) {
  const def = CARD_DEFS[card.id];
  const s = Object.assign({}, def.stats, card.upgraded ? def.up : {});
  return { def, s, cost: s.cost || 0 };
}
function cardName(card) {
  const def = CARD_DEFS[card.id];
  return def.name + (card.upgraded ? '+' : '');
}
function upgradable(card) {
  const def = CARD_DEFS[card.id];
  return !card.upgraded && Object.keys(def.up || {}).length > 0;
}

/* ---------------------------------------------------------
   Relics
   --------------------------------------------------------- */
const RELIC_DEFS = {
  blood_vial: {
    name: '燃血之瓶', icon: 'drop', rarity: 'starter', starter: true,
    desc: '战斗胜利后回复 6 点生命。'
  },
  anchor: {
    name: '锈蚀铁锚', icon: 'anchor', rarity: 'common',
    desc: '每场战斗开始时获得 10 点格挡。'
  },
  whetstone: {
    name: '磨刀石', icon: 'anvil', rarity: 'common',
    desc: '每场战斗开始时获得 1 点力量。'
  },
  eagle_eye: {
    name: '鹰眼护符', icon: 'eye', rarity: 'uncommon',
    desc: '每回合多抽 1 张牌。'
  },
  thorn_armor: {
    name: '荆棘护甲', icon: 'thorn', rarity: 'uncommon',
    desc: '每场战斗开始时获得 2 点荆棘。'
  },
  monk_beads: {
    name: '苦修念珠', icon: 'rose', rarity: 'common',
    desc: '获得时最大生命 +8。'
  },
  coin_purse: {
    name: '沉甸钱袋', icon: 'coin', rarity: 'common',
    desc: '获得时金币 +80。'
  },
  lizard_tail: {
    name: '蜥蜴尾', icon: 'lizard', rarity: 'rare',
    desc: '当你受到致命伤害时，回复至 25% 最大生命并消耗此遗物。'
  },
  hourglass: {
    name: '逆流沙漏', icon: 'hourglass', rarity: 'rare',
    desc: '每 3 个回合开始时获得 1 点额外行动力。'
  },
  double_edge: {
    name: '双刃护符', icon: 'sword', rarity: 'uncommon',
    desc: '攻击牌每次造成伤害 +2；战斗开始时失去 3 点生命。'
  },
  soul_torch: {
    name: '灵魂火把', icon: 'flame', rarity: 'uncommon',
    desc: '战斗开始时对所有敌人施加 2 层易伤。'
  },
  merchant_badge: {
    name: '商人徽章', icon: 'shop', rarity: 'common',
    desc: '商店价格降低 25%。'
  },
  champion_belt: {
    name: '冠军腰带', icon: 'belt', rarity: 'uncommon',
    desc: '精英战后额外获得 30 金币。'
  },
  lucky_coin: {
    name: '幸运币', icon: 'spark', rarity: 'rare',
    desc: '卡牌奖励多 1 个选项。'
  },
  ember_heart: {
    name: '余烬之心', icon: 'heart', rarity: 'uncommon',
    desc: '每场战斗首次打出攻击牌时，抽 2 张牌。'
  },
  herb: {
    name: '治疗药草', icon: 'herb', rarity: 'common',
    desc: '营火治疗量增加 15。'
  },
  dawn_charm: {
    name: '破晓符', icon: 'sun', rarity: 'uncommon',
    desc: '每场战斗第一回合额外获得 1 点行动力。'
  },
  blacksmith: {
    name: '铁匠锤', icon: 'anvil', rarity: 'common',
    desc: '获得时随机升级 2 张牌。'
  },
  mirror_shard: {
    name: '镜之碎片', icon: 'mirror', rarity: 'rare',
    desc: '每场战斗开始时额外抽 1 张牌。'
  }
};
// anchor icon fallback (no anchor in icon set): use shield visually
ICON_PATHS.anchor = ICON_PATHS.shield;
ICON_PATHS.sun = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/>';

/* ---------------------------------------------------------
   Status metadata
   --------------------------------------------------------- */
const STATUS_INFO = {
  strength: { name: '力量', icon: 'sword', cls: 'str', desc: '攻击伤害 +X。' },
  dexterity: { name: '敏捷', icon: 'feather', cls: 'dex', desc: '获得格挡 +X。' },
  vulnerable: { name: '易伤', icon: 'target', cls: 'vuln', desc: '受到的攻击伤害 +50%，剩余 X 回合。' },
  weak: { name: '虚弱', icon: 'arrowDown', cls: 'weak', desc: '造成的攻击伤害 -25%，剩余 X 回合。' },
  poison: { name: '中毒', icon: 'drop', cls: 'poison', desc: '回合开始失去 X 点生命，然后减少 1 层。' },
  thorns: { name: '荆棘', icon: 'thorn', cls: 'thorns', desc: '受到攻击时对攻击者造成 X 点伤害。' },
  metallicize: { name: '金属化', icon: 'shield', cls: 'metal', desc: '回合结束获得 X 点格挡。' },
  regen: { name: '再生', icon: 'heart', cls: 'regen', desc: '回合开始回复 X 点生命，然后减少 1 层。' },
  ritual: { name: '仪式', icon: 'flame', cls: 'ritual', desc: '回合开始获得 X 点力量。' },
  drawPower: { name: '抽牌', icon: 'deck', cls: 'dex', desc: '每回合额外抽 X 张牌。' },
  poisonAura: { name: '毒雾', icon: 'drop', cls: 'poison', desc: '每回合开始对所有敌人施加 X 层中毒。' },
  nextBlock: { name: '预挡', icon: 'shield', cls: 'metal', desc: '下回合开始时获得 X 点格挡。' }
};

/* ---------------------------------------------------------
   Enemies
   --------------------------------------------------------- */
const ENEMY_DEFS = {
  ash_rat: {
    name: '灰烬鼠', sigil: '鼠', color: '#c7a17a', glow: 'rgba(199,161,122,.35)', hp: [19, 23],
    moves: [
      { id: 'bite', name: '啃咬', dmg: 5 },
      { id: 'plague', name: '疫爪', dmg: 3, weak: 1 },
      { id: 'scurry', name: '蜷缩', block: 5 },
      { id: 'gnaw', name: '撕咬', dmg: 2, hits: 2 }
    ],
    pattern: ['bite', 'plague', 'scurry', 'bite', 'gnaw']
  },
  bandit: {
    name: '落难盗匪', sigil: '匪', color: '#b98b69', glow: 'rgba(185,139,105,.35)', hp: [33, 38],
    moves: [
      { id: 'slash', name: '生锈砍刀', dmg: 8 },
      { id: 'guard', name: '横刀格挡', block: 6, str: 1 },
      { id: 'dirty', name: '下三滥', dmg: 4, weak: 1 },
      { id: 'fury', name: '亡命连斩', dmg: 5, hits: 2 }
    ],
    pattern: ['slash', 'dirty', 'slash', 'guard', 'fury']
  },
  raven: {
    name: '噬魂鸦', sigil: '鸦', color: '#9486ab', glow: 'rgba(148,134,171,.38)', hp: [27, 32],
    moves: [
      { id: 'peck', name: '啄击', dmg: 4, hits: 2 },
      { id: 'curse', name: '不祥之鸣', weak: 2, vuln: 1 },
      { id: 'shriek', name: '尖啸', str: 2 },
      { id: 'dive', name: '俯冲', dmg: 9 }
    ],
    pattern: ['peck', 'curse', 'dive', 'shriek', 'peck']
  },
  vine: {
    name: '荆棘藤', sigil: '藤', color: '#7f9a72', glow: 'rgba(127,154,114,.38)', hp: [42, 48],
    moves: [
      { id: 'lash', name: '带刺藤鞭', dmg: 9 },
      { id: 'entangle', name: '缠绕', weak: 2, vuln: 1 },
      { id: 'growth', name: '汲取', block: 6, str: 2 },
      { id: 'bloom', name: '荆棘绽放', dmg: 6, hits: 2 }
    ],
    pattern: ['lash', 'entangle', 'lash', 'growth', 'bloom']
  },
  fire_spirit: {
    name: '余烬之灵', sigil: '灵', color: '#e48a58', glow: 'rgba(228,138,88,.45)', hp: [31, 37],
    moves: [
      { id: 'ember', name: '飞火', dmg: 8 },
      { id: 'blaze', name: '燃身', str: 2, block: 4 },
      { id: 'burst', name: '爆燃', dmg: 12 },
      { id: 'sparks', name: '火星四溅', dmg: 3, hits: 3 }
    ],
    pattern: ['ember', 'blaze', 'burst', 'sparks', 'ember']
  },
  wolf: {
    name: '荒野狼', sigil: '狼', color: '#b0a38e', glow: 'rgba(176,163,142,.35)', hp: [21, 25],
    moves: [
      { id: 'bite', name: '撕咬', dmg: 6 },
      { id: 'howl', name: '长嚎', str: 2 },
      { id: 'pounce', name: '扑击', dmg: 5, hits: 2 }
    ],
    pattern: ['bite', 'howl', 'pounce', 'bite']
  },
  statue: {
    name: '石像守卫', sigil: '像', color: '#9aa6ad', glow: 'rgba(154,166,173,.35)', hp: [48, 54],
    moves: [
      { id: 'smash', name: '石拳', dmg: 11 },
      { id: 'harden', name: '硬化', block: 10, str: 1 },
      { id: 'quake', name: '震地', dmg: 6, weak: 1 },
      { id: 'gaze', name: '石之凝视', vuln: 2 }
    ],
    pattern: ['smash', 'harden', 'quake', 'gaze', 'smash']
  },
  mage: {
    name: '灰袍法师', sigil: '法', color: '#9b9ac8', glow: 'rgba(155,154,200,.4)', hp: [35, 41],
    moves: [
      { id: 'flame', name: '灰焰', dmg: 10 },
      { id: 'hex', name: '恶咒', weak: 2, vuln: 1 },
      { id: 'ward', name: '护法', block: 8, str: 1 },
      { id: 'ritual', name: '禁术', ritual: 1, block: 4 }
    ],
    pattern: ['flame', 'hex', 'ward', 'flame', 'ritual']
  },
  shadow_hound: {
    name: '影犬', sigil: '影', color: '#8c82a8', glow: 'rgba(140,130,168,.4)', hp: [22, 27],
    moves: [
      { id: 'rend', name: '撕裂', dmg: 3, hits: 3 },
      { id: 'pounce', name: '暗跃', dmg: 8 },
      { id: 'fade', name: '遁影', block: 7 },
      { id: 'howl', name: '群嗥', str: 2 }
    ],
    pattern: ['rend', 'pounce', 'fade', 'howl', 'rend']
  },
  thug: {
    name: '拦路恶徒', sigil: '棍', color: '#b17b65', glow: 'rgba(177,123,101,.38)', hp: [39, 45],
    moves: [
      { id: 'bludgeon', name: '重棍', dmg: 10 },
      { id: 'brace', name: '横棍', block: 8, str: 1 },
      { id: 'cheap', name: '阴手', dmg: 5, weak: 1 },
      { id: 'fury', name: '乱棍', dmg: 4, hits: 3 }
    ],
    pattern: ['bludgeon', 'brace', 'cheap', 'fury', 'bludgeon']
  },

  /* ---- elites ---- */
  iron_knight: {
    name: '熔铁骑士', sigil: '骑', color: '#d1845a', glow: 'rgba(209,132,90,.48)', hp: [80, 88], elite: true,
    moves: [
      { id: 'cleave', name: '熔铁斩', dmg: 13 },
      { id: 'bulwark', name: '壁垒', block: 14, str: 1 },
      { id: 'execution', name: '处刑', dmg: 20 },
      { id: 'forge', name: '锻炉之怒', str: 2, block: 6 }
    ],
    pattern: ['cleave', 'bulwark', 'execution', 'forge', 'cleave']
  },
  twin_shade: {
    name: '双生幽影', sigil: '幽', color: '#a38cc0', glow: 'rgba(163,140,192,.45)', hp: [37, 42], elite: true,
    moves: [
      { id: 'slash', name: '影刃', dmg: 8 },
      { id: 'wail', name: '哀嚎', weak: 1, vuln: 1 },
      { id: 'drain', name: '汲取', dmg: 5, heal: 5 },
      { id: 'merge', name: '合流', str: 2 }
    ],
    pattern: ['slash', 'wail', 'drain', 'merge', 'slash']
  },
  beast: {
    name: '荒原巨兽', sigil: '兽', color: '#c6906b', glow: 'rgba(198,144,107,.45)', hp: [92, 102], elite: true,
    moves: [
      { id: 'maul', name: '巨爪', dmg: 16 },
      { id: 'roar', name: '咆哮', str: 3 },
      { id: 'stomp', name: '践踏', dmg: 9, weak: 2 },
      { id: 'charge', name: '冲撞', dmg: 7, hits: 2 }
    ],
    pattern: ['maul', 'roar', 'stomp', 'charge', 'maul']
  },

  /* ---- boss ---- */
  ash_king: {
    name: '余烬之王', sigil: '王', color: '#e0835e', glow: 'rgba(224,131,94,.55)', hp: [185, 185], boss: true,
    moves: [
      { id: 'cleave', name: '王权斩', dmg: 16 },
      { id: 'storm', name: '灰烬风暴', dmg: 7, hits: 2, weak: 1 },
      { id: 'guard', name: '王座壁垒', block: 18, str: 2 },
      { id: 'doom', name: '灭世余烬', dmg: 28 },
      { id: 'crown', name: '加冕', str: 3, metal: 5 }
    ],
    pattern: ['cleave', 'storm', 'guard', 'cleave', 'doom', 'storm'],
    phase2Pattern: ['storm', 'doom', 'cleave', 'guard', 'doom', 'crown']
  }
};

const NORMAL_ENCOUNTERS = [
  { id: 'rats', name: '灰烬鼠群', min: 0, max: 3, enemies: ['ash_rat', 'ash_rat'] },
  { id: 'bandit', name: '落难盗匪', min: 0, max: 4, enemies: ['bandit'] },
  { id: 'wolves', name: '荒野狼群', min: 1, max: 5, enemies: ['wolf', 'wolf'] },
  { id: 'raven', name: '噬魂鸦', min: 2, max: 6, enemies: ['raven'] },
  { id: 'vine', name: '荆棘藤', min: 2, max: 7, enemies: ['vine'] },
  { id: 'statue', name: '石像守卫', min: 3, max: 7, enemies: ['statue'] },
  { id: 'fire', name: '余烬之灵', min: 3, max: 8, enemies: ['fire_spirit'] },
  { id: 'mage', name: '灰袍法师', min: 4, max: 9, enemies: ['mage'] },
  { id: 'shadows', name: '双生影犬', min: 5, max: 9, enemies: ['shadow_hound', 'shadow_hound'] },
  { id: 'thugs', name: '拦路恶徒', min: 5, max: 9, enemies: ['thug', 'bandit'] }
];

const ELITE_ENCOUNTERS = [
  { id: 'knight', name: '熔铁骑士', enemies: ['iron_knight'] },
  { id: 'shades', name: '双生幽影', enemies: ['twin_shade', 'twin_shade'] },
  { id: 'beast', name: '荒原巨兽', enemies: ['beast'] }
];

const BOSS_ENCOUNTER = { id: 'ash_king', name: '余烬之王', enemies: ['ash_king'] };

/* ---------------------------------------------------------
   Map blueprint
   --------------------------------------------------------- */
const MAP_BLUEPRINTS = [
  ['battle'],
  ['battle', 'battle', 'event'],
  ['battle', 'event', 'battle'],
  ['elite', 'battle', 'event'],
  ['treasure', 'treasure', 'treasure'],
  ['battle', 'rest', 'battle'],
  ['elite', 'event', 'battle'],
  ['shop', 'battle', 'event'],
  ['elite', 'rest', 'battle'],
  ['rest', 'rest', 'rest'],
  ['boss']
];
const NODE_META = {
  battle: { name: '战斗', icon: 'sword' },
  elite: { name: '精英', icon: 'skull' },
  event: { name: '事件', icon: 'question' },
  rest: { name: '营火', icon: 'campfire' },
  shop: { name: '商店', icon: 'shop' },
  treasure: { name: '宝箱', icon: 'chest' },
  boss: { name: '首领', icon: 'crown' }
};

/* ---------------------------------------------------------
   Events — choices that shape the run
   --------------------------------------------------------- */
const EVENTS = [
  {
    id: 'ember_altar',
    title: '余烬祭坛',
    glyph: '祭',
    kicker: '一座仍在呼吸的祭坛',
    text: '祭坛上的火没有燃料，却烧得笔直。灰烬在石缝间拼出一行字：<b>“留下一点自己，换一点别的。”</b>',
    options: [
      {
        label: '割开手掌，献上鲜血', hint: '失去 10 点生命，获得一张稀有卡牌', requires: () => G.run.hp > 10,
        effect: () => {
          hurtRun(10);
          const card = addRandomCard('rare');
          return { text: '血滴进火里，火焰变成白色。你从灰烬中拾起 <b>' + card + '</b>。', tone: 'danger' };
        }
      },
      {
        label: '取走供台上的灰烬', hint: '获得 60 金币',
        effect: () => { addGold(60); return { text: '供台下的暗格里散着旧钱币。你带走 <b>60 金币</b>，没有回头。', tone: 'good' }; }
      },
      { label: '离开', hint: '什么也不做', effect: () => ({ text: '你绕过祭坛。身后的火光轻轻晃了一下，像一声没说出口的挽留。', tone: '' }) }
    ]
  },
  {
    id: 'lost_caravan',
    title: '倾覆的商队',
    glyph: '商',
    kicker: '车轮还在转，主人已经不见',
    text: '货车侧翻在路边，货物散了一地。一个戴面具的商人坐在车辕上，像等了你很久。<b>“挑一件吧，活人比货物更需要运气。”</b>',
    options: [
      {
        label: '买下他的压箱底', hint: '花费 70 金币，获得随机遗物', requires: () => G.run.gold >= 70,
        effect: () => {
          addGold(-70);
          const relic = grantRandomRelic();
          if (!relic) {
            addGold(70);
            return { text: '商人翻了半天，只摸出几枚发霉的硬币。他把 <b>70 金币</b> 原样推了回来。', tone: '' };
          }
          return { text: '商人收下金币，从袖中取出一件东西：<b>' + relic.name + '</b>。<br>' + relic.desc, tone: 'good' };
        }
      },
      {
        label: '搜刮散落的货物', hint: '获得 35 金币',
        effect: () => { addGold(35); return { text: '你从碎木与布匹间找出 <b>35 金币</b>。商人没有阻止，只是笑了笑。', tone: 'good' }; }
      },
      { label: '帮他把车扶正', hint: '失去 5 点生命，获得 50 金币', requires: () => G.run.hp > 5,
        effect: () => { hurtRun(5); addGold(50); return { text: '车轮压过你的手背。商人递来一袋钱：<b>50 金币</b>，算是医药费。', tone: 'good' }; } },
      { label: '离开', hint: '不碰来路不明的东西', effect: () => ({ text: '你继续赶路。身后传来商人低低的笑声，很快被风吹散。', tone: '' }) }
    ]
  },
  {
    id: 'stone_tablet',
    title: '古老石碑',
    glyph: '碑',
    kicker: '碑文比这座山更老',
    text: '半截石碑斜插在土里，刻满被磨平的名字。指尖靠近时，那些名字在灰下微微发亮。',
    options: [
      {
        label: '触摸碑文', hint: '失去 8 点生命，随机升级 2 张牌', requires: () => G.run.hp > 8,
        effect: () => {
          hurtRun(8);
          const names = upgradeRandomCards(2);
          return names.length
            ? { text: '冰冷的字迹钻进掌心。你的牌组中，<b>' + names.join('、') + '</b> 被唤醒。', tone: 'good' }
            : { text: '碑文在你脑中轰鸣，但你的牌组已经足够锋利，什么也没有改变。', tone: '' };
        }
      },
      { label: '拓下碑文', hint: '获得 40 金币', effect: () => { addGold(40); return { text: '你把拓片卖给了路过的收藏家，换得 <b>40 金币</b>。', tone: 'good' }; } },
      { label: '绕开', hint: '不要惊动沉睡的名字', effect: () => ({ text: '你从碑旁绕开。风把一些名字吹散，又带来一些新的。', tone: '' }) }
    ]
  },
  {
    id: 'soul_well',
    title: '灵魂之井',
    glyph: '井',
    kicker: '井水映出的不是你',
    text: '井口没有绳，也没有桶。水面平静得像一块黑铁，倒影里的你比你多了一道伤疤。',
    options: [
      {
        label: '投入 50 金币', hint: '最大生命 +10，回复 10 点生命', requires: () => G.run.gold >= 50,
        effect: () => {
          addGold(-50);
          increaseMaxHp(10, true);
          return { text: '金币沉下去，没有水声。井水漫上一层暖意，你的身体变得更结实了。<b>最大生命 +10</b>。', tone: 'good' };
        }
      },
      {
        label: '俯身饮一口', hint: '回复 25 点生命',
        effect: () => { healRun(25); return { text: '井水带着铁锈和旧梦的味道。伤口合拢，<b>回复 25 点生命</b>。', tone: 'good' }; }
      },
      { label: '离开', hint: '倒影的手抬得太慢了', effect: () => ({ text: '你后退一步，倒影却还留在井里，慢慢沉了下去。', tone: '' }) }
    ]
  },
  {
    id: 'trapped_traveler',
    title: '受困的旅人',
    glyph: '旅',
    kicker: '碎石下压着一只伸出的手',
    text: '山道塌了一半。一个人被压在碎石下，气息微弱，怀里死死抱着一只皮包。<b>“救……救我。”</b>',
    options: [
      {
        label: '搬开碎石救他', hint: '失去 6 点生命，获得一张罕见牌和 25 金币', requires: () => G.run.hp > 6,
        effect: () => {
          hurtRun(6);
          const card = addRandomCard('uncommon');
          addGold(25);
          return { text: '你把他拖出来。他喘了很久，把皮包塞给你：<b>' + card + '</b>，还有 <b>25 金币</b>。<br>“前面……别相信火。”', tone: 'good' };
        }
      },
      {
        label: '拿走皮包', hint: '获得 70 金币，最大生命 -5',
        effect: () => {
          addGold(70);
          G.run.maxHp = Math.max(20, G.run.maxHp - 5);
          G.run.hp = Math.min(G.run.hp, G.run.maxHp);
          return { text: '皮包里是 <b>70 金币</b>。你离开时，碎石下传来一声很轻的叹息。你觉得自己也轻了一点。', tone: 'danger' };
        }
      },
      { label: '继续赶路', hint: '荒野里每天都有人消失', effect: () => ({ text: '你没有停下。风很快盖住了身后的声音。', tone: '' }) }
    ]
  },
  {
    id: 'gambler',
    title: '灰烬赌徒',
    glyph: '赌',
    kicker: '他用指骨当骰子',
    text: '一个瘦得像影子的人拦住你，摊开手掌。三枚指骨在掌心自己滚动。<b>“押多少，赢多少。很公平。”</b>',
    options: [
      {
        label: '押上 40 金币', hint: '50% 获得 140 金币，50% 什么也没有', requires: () => G.run.gold >= 40,
        effect: () => {
          addGold(-40);
          if (Math.random() < 0.5) {
            addGold(140);
            return { text: '指骨停在三个六上。赌徒吹了声口哨，把一袋钱推过来：<b>140 金币</b>。', tone: 'good' };
          }
          return { text: '指骨滚进沟里。赌徒摊开空空的双手：<b>“运气也是要还的。”</b>', tone: 'danger' };
        }
      },
      { label: '看一会儿热闹', hint: '获得 10 金币', effect: () => { addGold(10); return { text: '你从地上捡起一枚滚落的硬币：<b>10 金币</b>。赌徒假装没看见。', tone: 'good' }; } },
      { label: '离开', hint: '不要和影子对赌', effect: () => ({ text: '你从他身边走过。身后指骨落地的声音跟了你很久。', tone: '' }) }
    ]
  },
  {
    id: 'sword_graves',
    title: '剑冢',
    glyph: '冢',
    kicker: '上千把断剑，只有一把还在响',
    text: '剑冢中央插着一柄完整的古剑，剑身蒙着灰，却在你靠近时发出低低的鸣响。四周的断剑也跟着震颤起来。',
    options: [
      {
        label: '拔出古剑', hint: '失去 12 点生命，获得一张稀有牌', requires: () => G.run.hp > 12,
        effect: () => {
          hurtRun(12);
          const card = addRandomCard('rare');
          return { text: '剑锋割开你的掌心，也割开一道旧封印。剑鸣停下，你手中多了一张牌：<b>' + card + '</b>。', tone: 'danger' };
        }
      },
      { label: '向剑冢致意', hint: '回复 15 点生命', effect: () => { healRun(15); return { text: '你单膝跪下，把刀插进土里。风穿过剑冢，像很多人的呼吸。<b>回复 15 点生命</b>。', tone: 'good' }; } },
      { label: '离开', hint: '有些剑不是给活人拔的', effect: () => ({ text: '你退出剑冢。身后的剑鸣慢慢平息，像一场没有开始的雨。', tone: '' }) }
    ]
  },
  {
    id: 'whispering_book',
    title: '低语之书',
    glyph: '书',
    kicker: '书页在没有人翻动时自己响',
    text: '一本没有封皮的书摊在石台上。纸页的边缘在动，像嘴唇。你不去看，它也在对你说话。',
    options: [
      {
        label: '读一页', hint: '失去 7 点生命，获得一张升级过的罕见牌', requires: () => G.run.hp > 7,
        effect: () => {
          hurtRun(7);
          const card = addRandomCard('uncommon', true);
          return { text: '字句爬进眼睛。你合上书，发现自己记住了一张不该记住的牌：<b>' + card + '</b>（已升级）。', tone: 'danger' };
        }
      },
      { label: '把书合上', hint: '获得 20 金币', effect: () => { addGold(20); return { text: '书脊里掉出几枚压扁的硬币：<b>20 金币</b>。低语停了，但你的耳朵还在响。', tone: 'good' }; } },
      { label: '离开', hint: '不要听它说完', effect: () => ({ text: '你转身就走。书在你背后继续翻页，越翻越快。', tone: '' }) }
    ]
  },
  {
    id: 'embers_camp',
    title: '无人的营火',
    glyph: '火',
    kicker: '火堆还是温的',
    text: '一顶破帐篷，一堆还没烧尽的火。没有脚印，没有行李，只有火边一块被磨得发亮的石头。',
    options: [
      { label: '坐下来取暖', hint: '回复 18 点生命', effect: () => { healRun(18); return { text: '你靠着石头坐下，让火烤热发僵的手指。<b>回复 18 点生命</b>。', tone: 'good' }; } },
      { label: '把火种收进怀里', hint: '最大生命 +5', effect: () => { increaseMaxHp(5, true); return { text: '火种贴着胸口，像一颗小小的心脏。你觉得自己的呼吸变长了。<b>最大生命 +5</b>。', tone: 'good' }; } },
      { label: '离开', hint: '火边没有主人，也没有脚印', effect: () => ({ text: '你走出很远，才发现那堆火还在原地烧着，像在等下一个坐下的人。', tone: '' }) }
    ]
  },
  {
    id: 'wounded_knight',
    title: '濒死的骑士',
    glyph: '骑',
    kicker: '盔甲里只剩呼吸',
    text: '一名骑士靠在断墙上，胸甲被什么东西从中间撕开。他抬起手，指向自己的剑。<b>“拿去吧……别让它……和我一起烂在这里。”</b>',
    options: [
      {
        label: '接过他的剑', hint: '获得一张稀有牌，失去 5 点生命', requires: () => G.run.hp > 5,
        effect: () => {
          hurtRun(5);
          const card = addRandomCard('rare');
          return { text: '剑柄上还留着他的体温。你握住它时，骑士的手终于松开。<b>' + card + '</b> 加入了你的牌组。', tone: 'good' };
        }
      },
      { label: '为他合上眼', hint: '最大生命 +6', effect: () => { increaseMaxHp(6, true); return { text: '你替他合上眼，把断墙上的灰拂到他胸前。你起身时，觉得脚步更稳了。<b>最大生命 +6</b>。', tone: 'good' }; } },
      { label: '离开', hint: '他的路已经走完了', effect: () => ({ text: '你走出很远，还能听见盔甲里风穿过的声音。', tone: '' }) }
    ]
  }
];

/* ---------------------------------------------------------
   Global state
   --------------------------------------------------------- */
const G = {
  screen: 'title',
  run: null,
  combat: null,
  reward: null,
  rest: null,
  shop: null,
  eventState: null,
  end: null,
  modal: null,
  shake: false,
  runToken: 0
};

const BEST_KEY = 'emberpath.best.v1';
let best = store.get(BEST_KEY, { score: 0, depth: 0, victory: false, date: null });
if (!best || typeof best !== 'object') best = { score: 0, depth: 0, victory: false, date: null };

function hasRelic(id) {
  return !!(G.run && G.run.relics.includes(id));
}

function addGold(n) {
  if (!G.run) return;
  G.run.gold = Math.max(0, G.run.gold + n);
  if (n > 0) G.run.stats.goldEarned += n;
}

function healRun(n) {
  if (!G.run) return 0;
  const before = G.run.hp;
  G.run.hp = Math.min(G.run.maxHp, G.run.hp + n);
  return G.run.hp - before;
}

function hurtRun(n) {
  if (!G.run) return;
  G.run.hp = Math.max(1, G.run.hp - n);
}

function increaseMaxHp(n, alsoHeal) {
  if (!G.run) return;
  G.run.maxHp += n;
  if (alsoHeal) G.run.hp = Math.min(G.run.maxHp, G.run.hp + n);
}

function addCardToDeck(id, upgraded) {
  const card = makeCard(id, !!upgraded);
  G.run.deck.push(card);
  return card;
}

function addRandomCard(rarity, upgraded) {
  let pool = REWARD_CARD_IDS.filter(id => CARD_DEFS[id].rarity === rarity);
  if (!pool.length) pool = REWARD_CARD_IDS.slice();
  const card = addCardToDeck(pick(pool), !!upgraded);
  return cardName(card) + '（' + TYPE_LABEL[CARD_DEFS[card.id].type] + '）';
}

function upgradeRandomCards(n) {
  if (!G.run) return [];
  const candidates = shuffle(G.run.deck.filter(upgradable));
  const names = [];
  for (const card of candidates.slice(0, n)) {
    card.upgraded = true;
    names.push(cardName(card));
  }
  return names;
}

function grantRelic(id, silent) {
  if (!G.run || G.run.relics.includes(id)) return null;
  const def = RELIC_DEFS[id];
  if (!def) return null;
  G.run.relics.push(id);
  if (id === 'monk_beads') increaseMaxHp(8, true);
  if (id === 'coin_purse') addGold(80);
  if (id === 'blacksmith') {
    const names = upgradeRandomCards(2);
    if (!silent && names.length) showToast('铁匠锤升级了：' + names.join('、'), 'good');
  }
  if (!silent) showToast('获得遗物：' + def.name, 'gold');
  return def;
}

function grantRandomRelic(silent) {
  if (!G.run) return null;
  const owned = new Set(G.run.relics);
  const pool = Object.keys(RELIC_DEFS).filter(id => !owned.has(id) && !RELIC_DEFS[id].starter);
  if (!pool.length) return null;
  const id = pick(pool);
  grantRelic(id, silent);
  return RELIC_DEFS[id];
}

function relicOwnedName(id) { return RELIC_DEFS[id] ? RELIC_DEFS[id].name : id; }

function runDepth() {
  if (!G.run || !G.run.currentNode) return 0;
  const node = G.run.map.nodes.find(n => n.id === G.run.currentNode);
  return node ? node.level + 1 : 0;
}

function computeScore(victory) {
  if (!G.run) return 0;
  const s = G.run.stats;
  return Math.max(0, Math.round(
    (victory ? 1200 : 0) +
    runDepth() * 110 +
    s.kills * 22 +
    s.elites * 60 +
    G.run.gold +
    G.run.maxHp * 4 +
    G.run.deck.length * 8 +
    G.run.relics.length * 35
  ));
}

function saveBest(victory) {
  const score = computeScore(victory);
  const depth = Math.max(runDepth(), victory ? 11 : 0);
  let isNew = false;
  if (score > (best.score || 0) || (victory && !best.victory && score >= best.score)) {
    best = { score, depth, victory, date: new Date().toISOString() };
    store.set(BEST_KEY, best);
    isNew = true;
  }
  return { score, isNew, depth };
}

function nodeById(id) {
  return G.run && G.run.map ? G.run.map.nodes.find(n => n.id === id) : null;
}

function accessibleNodeIds() {
  if (!G.run) return [];
  const map = G.run.map;
  if (!G.run.currentNode) return [map.startId];
  return map.edges.filter(e => e.from === G.run.currentNode).map(e => e.to);
}

/* ---------------------------------------------------------
   Map generation
   --------------------------------------------------------- */
const MAP_GAP = 84;
const MAP_TOP = 58;
const MAP_HEIGHT = 990;

function generateMap() {
  const rows = MAP_BLUEPRINTS.map((types, level) => {
    const shuffled = (level === 0 || level === MAP_BLUEPRINTS.length - 1) ? types.slice() : shuffle(types);
    return shuffled.map((type, col) => {
      const count = shuffled.length;
      const x = count === 1 ? 50 : (count === 2 ? 33 + col * 34 : 18 + col * 32);
      return { id: 'n-' + level + '-' + col, level, col, type, x, visited: false };
    });
  });
  const nodes = rows.flat();
  const edges = [];
  const edgeKeys = new Set();
  function addEdge(from, to) {
    if (!from || !to) return;
    const key = from.id + '>' + to.id;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from: from.id, to: to.id });
  }
  rows[0].forEach(from => rows[1].forEach(to => addEdge(from, to)));
  for (let level = 1; level < 9; level++) {
    const fromRow = rows[level];
    const toRow = rows[level + 1];
    fromRow.forEach(from => {
      const same = toRow.find(n => n.col === from.col) || toRow[0];
      addEdge(from, same);
      [-1, 1].forEach(delta => {
        const near = toRow.find(n => n.col === from.col + delta);
        if (near && Math.random() < 0.52) addEdge(from, near);
      });
    });
  }
  rows[9].forEach(from => addEdge(from, rows[10][0]));
  return { rows, nodes, edges, startId: rows[0][0].id, bossId: rows[10][0].id };
}

function createRun() {
  return {
    token: 'run-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    hp: 75,
    maxHp: 75,
    gold: 99,
    deck: STARTER_DECK.map(id => makeCard(id)),
    relics: ['blood_vial'],
    currentNode: null,
    path: [],
    map: generateMap(),
    lastEncounter: null,
    flags: { lizardUsed: false },
    seenEvents: [],
    stats: { kills: 0, elites: 0, cardsPlayed: 0, damageDealt: 0, goldEarned: 0, turns: 0 }
  };
}

/* ---------------------------------------------------------
   Shared markup
   --------------------------------------------------------- */
function emberParticles(count) {
  count = count || 26;
  let out = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const dur = 8 + Math.random() * 13;
    const delay = -Math.random() * 18;
    const drift = (Math.random() * 140 - 70).toFixed(0) + 'px';
    const size = (Math.random() * 2.4 + 1.4).toFixed(1);
    out += '<span class="ember-particle" style="left:' + left.toFixed(2) + '%;width:' + size + 'px;height:' + size + 'px;animation-duration:' + dur.toFixed(1) + 's;animation-delay:' + delay.toFixed(1) + 's;--drift:' + drift + '"></span>';
  }
  return out;
}

function heroArt() {
  return [
    '<svg viewBox="0 0 620 700" role="img" aria-label="拾烬者站在余烬之月前">',
    '<defs>',
    '<radialGradient id="moon-glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f0b47b" stop-opacity=".55"/><stop offset="42%" stop-color="#b85e37" stop-opacity=".22"/><stop offset="100%" stop-color="#b85e37" stop-opacity="0"/></radialGradient>',
    '<radialGradient id="moon-disc" cx="42%" cy="38%" r="65%"><stop offset="0%" stop-color="#f0d2a5"/><stop offset="48%" stop-color="#c9855e"/><stop offset="100%" stop-color="#763c28"/></radialGradient>',
    '<clipPath id="moon-clip"><circle cx="360" cy="212" r="112"/></clipPath>',
    '<linearGradient id="cloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2a2e3a"/><stop offset="55%" stop-color="#181b25"/><stop offset="100%" stop-color="#0a0c11"/></linearGradient>',
    '<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#161923"/><stop offset="100%" stop-color="#090b10"/></linearGradient>',
    '<linearGradient id="blade" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff4d2"/><stop offset="45%" stop-color="#ffb47d"/><stop offset="100%" stop-color="#a8452a"/></linearGradient>',
    '<filter id="soft-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
    '<filter id="blade-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
    '</defs>',
    '<circle cx="360" cy="212" r="230" fill="url(#moon-glow)"/>',
    '<circle cx="360" cy="212" r="112" fill="url(#moon-disc)" opacity=".82"/>',
    '<g clip-path="url(#moon-clip)" fill="#864b32" opacity=".24"><circle cx="326" cy="174" r="24"/><circle cx="394" cy="238" r="17"/><circle cx="310" cy="258" r="10"/><circle cx="420" cy="184" r="8"/></g>',
    '<circle cx="360" cy="212" r="112" fill="#291511" opacity=".12"/>',
    '<circle cx="360" cy="212" r="128" fill="none" stroke="#e4b986" stroke-opacity=".3"/>',
    '<circle cx="360" cy="212" r="158" fill="none" stroke="#d6a16f" stroke-opacity=".12"/>',
    '<g opacity=".68" fill="#dfb184"><circle cx="310" cy="176" r="2"/><circle cx="400" cy="158" r="1.4"/><circle cx="424" cy="238" r="2.2"/><circle cx="318" cy="264" r="1.6"/><circle cx="386" cy="290" r="1.2"/><circle cx="492" cy="128" r="1.5"/><circle cx="238" cy="120" r="1.2"/><circle cx="532" cy="300" r="1.6"/><circle cx="192" cy="250" r="1.4"/></g>',
    '<path d="M0 430 90 354l66 40 62-72 92 74 76-34 74 58 88-94 72 76v166H0Z" fill="#0b0e15" opacity=".94"/>',
    '<path d="M0 490 94 424l72 40 70-58 88 68 88-28 74 44 70-66 64 50v126H0Z" fill="#0b0e15"/>',
    '<path d="M0 545c90-42 178-38 260-8 88 33 184 40 360-12v175H0Z" fill="url(#ground)"/>',
    '<g opacity=".55" stroke="#b8744e" stroke-width="1"><path d="M18 607h122M462 589h138M86 636h74M410 630h110"/></g>',
    '<g filter="url(#soft-glow)"><ellipse cx="330" cy="606" rx="128" ry="18" fill="#c66138" opacity=".14"/></g>',
    '<g>',
    '<path d="M268 596c-24-57-20-122 2-176 18-44 44-70 72-76 30-6 54 12 68 40 23 46 24 120 8 201l-40 42-76 2Z" fill="url(#cloak)" stroke="#323645" stroke-width="1.2"/>',
    '<path d="M294 408c-9 54-12 112-2 172l38 24 14-206Z" fill="#11141b" opacity=".8"/>',
    '<path d="M302 390c-19-23-16-52 4-71 18-17 45-18 64-3 18 14 25 38 17 58-7 19-27 31-49 31-14 0-27-5-36-15Z" fill="#0b0e14" stroke="#3b3f4d" stroke-width="1.1"/>',
    '<path d="M306 342c7-26 31-43 57-38 19 4 33 18 38 37" fill="none" stroke="#6d5a46" stroke-width="2" opacity=".38"/>',
    '<path d="M309 365c8-22 27-35 49-32 16 2 28 13 32 28-10 5-21 5-30 1-13-6-24-4-35 4-5 4-11 4-16-1Z" fill="#090b10"/>',
    '<path d="M327 376l10 3" stroke="#ffb17c" stroke-width="2" stroke-linecap="round" opacity=".9"/>',
    '<path d="M353 378l9-3" stroke="#ffb17c" stroke-width="2" stroke-linecap="round" opacity=".9"/>',
    '<path d="M318 452c-5 46-5 91 0 130M365 455c3 42 1 84-5 125" stroke="#343a49" stroke-width="1.2" fill="none" opacity=".6"/>',
    '<circle cx="348" cy="475" r="4" fill="#ff9b62" opacity=".5" filter="url(#soft-glow)"/>',
    '<path d="M288 452c-30 22-49 56-58 91-8 31 4 55 27 66" fill="none" stroke="#20242f" stroke-width="26" stroke-linecap="round"/>',
    '<path d="M286 451c-27 23-45 56-52 89" fill="none" stroke="#6a5743" stroke-width="1.6" opacity=".3"/>',
    '<path d="M282 462c-18 12-42 24-54 44" fill="none" stroke="#242936" stroke-width="16" stroke-linecap="round"/>',
    '<path d="M395 452c25 16 41 34 43 55 2 22-9 37-26 45" fill="none" stroke="#20242f" stroke-width="24" stroke-linecap="round"/>',
    '<path d="M392 446 474 566" stroke="#3a2a24" stroke-width="9" stroke-linecap="round"/>',
    '<path d="M398 436 484 552" stroke="url(#blade)" stroke-width="4.2" stroke-linecap="round" filter="url(#blade-glow)"/>',
    '<path d="M390 451 417 487" stroke="#b87a45" stroke-width="7" stroke-linecap="round"/>',
    '<path d="M378 438 408 478" stroke="#6a4a2f" stroke-width="2.4" stroke-linecap="round"/>',
    '<path d="M420 494c5 2 8 6 8 11" stroke="#ffcb99" stroke-width="1.5" opacity=".7"/>',
    '<path d="M300 584c-8 6-12 14-10 24l94 4c4-10-2-20-13-26Z" fill="#0a0c11"/>',
    '<path d="M322 586c12 10 30 10 44 0" stroke="#2c303c" stroke-width="1.4" fill="none"/>',
    '</g>',
    '<g fill="#ff9b62" filter="url(#soft-glow)"><circle cx="470" cy="460" r="2.2" opacity=".8"/><circle cx="492" cy="430" r="1.5" opacity=".55"/><circle cx="214" cy="500" r="1.8" opacity=".6"/><circle cx="248" cy="324" r="1.3" opacity=".55"/><circle cx="448" cy="268" r="1.7" opacity=".6"/><circle cx="510" cy="336" r="1.3" opacity=".5"/></g>',
    '</svg>'
  ].join('');
}

function hudHTML() {
  if (!G.run) return '';
  const depth = runDepth();
  return '<header class="hud">' +
    '<div class="brand"><div class="brand-mark">' + icon('flame') + '</div><div><div class="brand-name">烬旅</div><div class="brand-sub">EMBERPATH</div></div></div>' +
    '<div class="hud-stats">' +
      '<div class="stat-pill hp" title="生命值">' + icon('heart') + '<b>' + G.run.hp + '</b><small>/ ' + G.run.maxHp + '</small></div>' +
      '<div class="stat-pill gold" title="金币">' + icon('coin') + '<b>' + G.run.gold + '</b></div>' +
      '<div class="stat-pill floor" title="当前深度">' + icon('map') + '<span>深度</span><b>' + (depth || 1) + '</b></div>' +
      '<div class="stat-pill deck" title="牌组">' + icon('deck') + '<span>牌组</span><b>' + G.run.deck.length + '</b></div>' +
    '</div>' +
    '<div class="hud-actions">' +
      '<button class="hud-btn" data-act="open-deck" title="查看牌组">' + icon('deck') + '<b>' + G.run.deck.length + '</b><span>牌组</span></button>' +
      '<button class="hud-btn icon-only" data-act="help" title="玩法说明" aria-label="玩法说明">' + icon('help') + '</button>' +
      '<button class="hud-btn icon-only" data-act="toggle-music" title="' + (Music.enabled ? '关闭背景音乐' : '开启背景音乐') + '" aria-label="切换背景音乐">' + icon(Music.enabled ? 'music' : 'musicOff') + '</button>' +
      '<button class="hud-btn icon-only" data-act="toggle-sound" title="' + (Sound.enabled ? '关闭音效' : '开启音效') + '" aria-label="切换音效">' + icon(Sound.enabled ? 'sound' : 'mute') + '</button>' +
    '</div>' +
  '</header>';
}

function statusChips(status) {
  if (!status) return '';
  const keys = ['strength', 'dexterity', 'vulnerable', 'weak', 'poison', 'thorns', 'metallicize', 'regen', 'ritual', 'drawPower', 'poisonAura', 'nextBlock'];
  return keys.filter(k => (status[k] || 0) > 0).map(k => {
    const info = STATUS_INFO[k];
    const value = status[k];
    const tip = info.desc.replace('X', value);
    return '<span class="status-chip ' + info.cls + '" title="' + escapeAttr(info.name + '：' + tip) + '">' + icon(info.icon) + '<b>' + value + '</b></span>';
  }).join('');
}

function relicChipHTML(id) {
  const def = RELIC_DEFS[id];
  if (!def) return '';
  return '<span class="relic-chip" title="' + escapeAttr(def.name + '：' + def.desc) + '">' + icon(def.icon) + '</span>';
}

function cardMarkup(card, opts) {
  opts = opts || {};
  const data = cardData(card);
  const def = data.def;
  const s = data.s;
  const cost = data.cost;
  const isButton = !!opts.act;
  const tag = isButton ? 'button' : 'div';
  const classes = ['card', 'type-' + def.type, card.upgraded ? 'upgraded' : '', opts.mini ? 'card-mini' : '', opts.selected ? 'targeting' : '', opts.disabled ? 'unplayable' : '', opts.extraClass || ''].filter(Boolean).join(' ');
  let attrs = ' class="' + classes + '"';
  if (isButton) {
    attrs += ' type="button" data-act="' + opts.act + '"';
    if (opts.index !== undefined) attrs += ' data-index="' + opts.index + '"';
    if (opts.uid) attrs += ' data-uid="' + opts.uid + '"';
    if (opts.ariaLabel) attrs += ' aria-label="' + escapeAttr(opts.ariaLabel) + '"';
  } else if (opts.roleButton) {
    attrs += ' role="button" tabindex="0"';
  }
  if (opts.dataAttrs) attrs += ' ' + opts.dataAttrs;
  const price = opts.price !== undefined ? '<span class="card-price">' + icon('coin') + opts.price + '</span>' : '';
  const sold = opts.sold ? '<span class="card-sold">已售出</span>' : '';
  return '<' + tag + attrs + '>' +
    '<span class="card-cost' + (cost === 0 ? ' free' : '') + '">' + cost + '</span>' +
    '<span class="card-name">' + escapeHTML(def.name) + (card.upgraded ? '<span class="plus">+</span>' : '') + '</span>' +
    '<span class="card-art"><span class="card-art-glyph">' + escapeHTML(def.glyph) + '</span><span class="card-art-type">' + TYPE_LABEL[def.type] + '</span></span>' +
    '<span class="card-rarity ' + def.rarity + '"></span>' +
    '<span class="card-text">' + kw(def.text(s)) + '</span>' +
    '<span class="card-flavor">' + escapeHTML(def.flavor) + '</span>' +
    price + sold +
  '</' + tag + '>';
}

/* ---------------------------------------------------------
   Title screen
   --------------------------------------------------------- */
function renderTitle() {
  const hasBest = best && best.score > 0;
  return '<div class="title-screen">' +
    '<div class="embers">' + emberParticles(30) + '</div>' +
    '<nav class="title-nav">' +
      '<div class="brand"><div class="brand-mark">' + icon('flame') + '</div><div><div class="brand-name">烬旅</div><div class="brand-sub">EMBERPATH</div></div></div>' +
      '<div class="title-nav-right">' +
        '<button class="hud-btn" data-act="help">' + icon('help') + '<span>玩法</span></button>' +
        '<button class="hud-btn icon-only" data-act="toggle-music" aria-label="切换背景音乐" title="' + (Music.enabled ? '关闭背景音乐' : '开启背景音乐') + '">' + icon(Music.enabled ? 'music' : 'musicOff') + '</button>' +
        '<button class="hud-btn icon-only" data-act="toggle-sound" aria-label="切换音效" title="' + (Sound.enabled ? '关闭音效' : '开启音效') + '">' + icon(Sound.enabled ? 'sound' : 'mute') + '</button>' +
      '</div>' +
    '</nav>' +
    '<div class="title-grid">' +
      '<div class="title-copy">' +
        '<div class="title-kicker">ROGUELIKE DECKBUILDER · 肉鸽卡牌</div>' +
        '<h1 class="title-logo">烬旅</h1>' +
        '<div class="title-en">E M B E R P A T H</div>' +
        '<p class="title-lede">王国烧尽之后，灰烬之上仍有路。<br>拾起残破的牌，穿过 <strong>十层荒野</strong>，<br>在余烬之王的王座前，<strong>点燃最后一次火</strong>。</p>' +
        '<div class="title-menu">' +
          '<button class="btn btn-primary" data-act="new-run">' + icon('flame') + '点燃余烬 <span>开始旅程</span></button>' +
          '<button class="btn btn-ghost" data-act="help">' + icon('book') + '玩法说明</button>' +
        '</div>' +
        '<div class="title-best">' +
          '<span>最佳记录：<b>' + (hasBest ? best.score.toLocaleString('zh-CN') : '—') + '</b></span>' +
          '<span>最深抵达：<b>' + (hasBest ? '第 ' + best.depth + ' 层' : '—') + '</b></span>' +
          '<span>' + (hasBest && best.victory ? '<b>已击败余烬之王</b>' : '尚未走到王座') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="title-art">' + heroArt() +
        '<div class="title-art-caption"><b>拾 烬 者</b>ASHWALKER<br>“火会熄灭，路不会。”</div>' +
      '</div>' +
    '</div>' +
    '<footer class="title-foot"><span>一副牌 · 一条不归路 · 每次旅程都不同</span><span>键盘：1-9 出牌 · E 结束回合 · Esc 取消</span></footer>' +
  '</div>';
}

/* ---------------------------------------------------------
   Map screen
   --------------------------------------------------------- */
function renderMap() {
  const map = G.run.map;
  const current = G.run.currentNode;
  const available = new Set(accessibleNodeIds());
  const visited = new Set(G.run.path);
  const nodeY = (level) => MAP_TOP + level * MAP_GAP;
  let edges = '';
  for (const e of map.edges) {
    const a = map.nodes.find(n => n.id === e.from);
    const b = map.nodes.find(n => n.id === e.to);
    if (!a || !b) continue;
    const isActive = e.from === current && available.has(e.to);
    const isVisited = visited.has(e.from) && visited.has(e.to);
    const d = 'M ' + a.x + ' ' + nodeY(a.level) + ' C ' + a.x + ' ' + (nodeY(a.level) + 30) + ', ' + b.x + ' ' + (nodeY(b.level) - 30) + ', ' + b.x + ' ' + nodeY(b.level);
    edges += '<path class="map-edge' + (isActive ? ' active' : isVisited ? ' visited' : '') + '" d="' + d + '" vector-effect="non-scaling-stroke"/>';
  }
  const nodes = map.nodes.map(n => {
    const isAvailable = available.has(n.id);
    const isVisited = visited.has(n.id);
    const locked = !isAvailable && !isVisited ? ' locked' : '';
    const cls = 'map-node ' + n.type + (isVisited ? ' visited' : '') + (isAvailable ? ' available' : '') + locked;
    const meta = NODE_META[n.type] || NODE_META.battle;
    const act = isAvailable ? ' data-act="node" data-node="' + n.id + '"' : '';
    return '<button class="' + cls + '" style="left:' + n.x + '%;top:' + nodeY(n.level) + 'px" data-label="' + meta.name + '" data-node-id="' + n.id + '"' + act + ' aria-label="' + meta.name + '，第 ' + (n.level + 1) + ' 层"' + (isAvailable ? '' : ' tabindex="-1"') + '>' +
      '<span class="node-floor">' + String(n.level + 1).padStart(2, '0') + '</span>' + icon(meta.icon) + '</button>';
  }).join('');
  const relics = G.run.relics.length ? G.run.relics.map(relicChipHTML).join('') : '<span class="empty-note">还没有拾到遗物。</span>';
  return '<div class="screen map-screen"><div class="map-layout">' +
    '<aside class="run-panel panel">' +
      '<div class="hero-card"><div class="hero-portrait"><span class="glyph">烬</span></div><div class="hero-meta"><h2>拾烬者</h2><p>ASHWALKER · 无名的旅人</p></div></div>' +
      '<div class="hero-hp"><div class="hp-line"><span class="label">生命</span><span class="value"><b>' + G.run.hp + '</b> / ' + G.run.maxHp + '</span></div><div class="bar"><i style="width:' + pct(G.run.hp, G.run.maxHp) + '%"></i></div></div>' +
      '<div class="mini-stats">' +
        '<div class="mini-stat">' + icon('coin') + '金币<b>' + G.run.gold + '</b></div>' +
        '<div class="mini-stat">' + icon('map') + '深度<b>' + (runDepth() || 1) + '</b></div>' +
        '<div class="mini-stat">' + icon('deck') + '牌组<b>' + G.run.deck.length + '</b></div>' +
        '<div class="mini-stat">' + icon('skull') + '击败<b>' + G.run.stats.kills + '</b></div>' +
      '</div>' +
      '<div class="side-title"><span>遗物</span><b>' + G.run.relics.length + '</b></div>' +
      '<div class="relic-strip">' + relics + '</div>' +
      '<div class="run-tip">每一次选择都会留下痕迹。营火可以疗伤，也可以锻造；商店能买到力量，但买不到退路。</div>' +
    '</aside>' +
    '<section class="map-main">' +
      '<div class="map-head"><div><div class="eyebrow">THE ASHEN DESCENT</div><h1>灰烬之路</h1><p>' + (current ? '继续向下，王座就在灰烬最深处。' : '从入口出发。点击发光的节点选择下一步。') + '</p></div>' +
        '<div class="map-legend">' +
          '<span class="legend-item"><i class="legend-dot battle"></i>战斗</span><span class="legend-item"><i class="legend-dot elite"></i>精英</span><span class="legend-item"><i class="legend-dot event"></i>事件</span><span class="legend-item"><i class="legend-dot rest"></i>营火</span><span class="legend-item"><i class="legend-dot shop"></i>商店</span><span class="legend-item"><i class="legend-dot treasure"></i>宝箱</span><span class="legend-item"><i class="legend-dot boss"></i>首领</span>' +
        '</div>' +
      '</div>' +
      '<div class="map-frame"><div class="map-scroll"><div class="map-canvas" style="height:' + MAP_HEIGHT + 'px">' +
        '<svg class="map-lines" viewBox="0 0 100 ' + MAP_HEIGHT + '" preserveAspectRatio="none" aria-hidden="true">' + edges + '</svg>' + nodes +
      '</div></div><div class="map-foot"><span>你已走过 <b class="path-count">' + G.run.path.length + '</b> 个节点</span><span>' + (current ? '下一站：选择一条路' : '点击「战斗」开始') + '</span></div></div>' +
    '</section>' +
  '</div></div>';
}

/* ---------------------------------------------------------
   Modals
   --------------------------------------------------------- */
function openModal(type, data) {
  G.modal = Object.assign({ type }, data || {});
  renderModal();
}
function closeModal() {
  G.modal = null;
  renderModal();
}

function renderModal() {
  const root = $('#modal-root');
  if (!root) return;
  if (!G.modal) { root.innerHTML = ''; return; }
  let title = '';
  let subtitle = '';
  let body = '';
  const type = G.modal.type;
  if (type === 'deck') {
    const cards = G.run.deck.slice().sort((a, b) => {
      const order = { attack: 0, skill: 1, power: 2 };
      const da = CARD_DEFS[a.id], db = CARD_DEFS[b.id];
      return (order[da.type] - order[db.type]) || da.name.localeCompare(db.name, 'zh');
    });
    const attacks = cards.filter(c => CARD_DEFS[c.id].type === 'attack').length;
    const skills = cards.filter(c => CARD_DEFS[c.id].type === 'skill').length;
    const powers = cards.filter(c => CARD_DEFS[c.id].type === 'power').length;
    const up = cards.filter(c => c.upgraded).length;
    title = '牌组';
    subtitle = G.run.deck.length + ' 张牌 · ' + up + ' 张已升级';
    body = '<div class="deck-summary"><span>攻击 <b>' + attacks + '</b></span><span>技能 <b>' + skills + '</b></span><span>能力 <b>' + powers + '</b></span><span>已升级 <b>' + up + '</b></span></div><div class="deck-grid">' + cards.map(c => cardMarkup(c)).join('') + '</div>';
  } else if (type === 'pile') {
    const pile = G.combat[G.modal.pile] || [];
    const names = { drawPile: '抽牌堆', discardPile: '弃牌堆', exhaustPile: '消耗堆' };
    title = names[G.modal.pile] || '牌堆';
    subtitle = pile.length + ' 张牌' + (G.modal.pile === 'drawPile' ? ' · 顺序已隐藏' : '');
    const list = G.modal.pile === 'drawPile' ? shuffle(pile) : pile.slice().reverse();
    body = list.length ? '<div class="deck-grid">' + list.map(c => cardMarkup(c)).join('') + '</div>' : '<p class="empty-note" style="text-align:center;padding:30px 0">这里空空如也。</p>';
  } else if (type === 'upgrade') {
    const cards = G.run.deck.filter(upgradable);
    title = '锻造';
    subtitle = '选择一张牌进行升级';
    body = cards.length ? '<div class="upgrade-grid">' + cards.map(c => cardMarkup(c, { act: 'upgrade-card', uid: c.uid })).join('') + '</div>' : '<p class="empty-note" style="text-align:center;padding:30px 0">你的牌组已经没有可升级的牌了。</p>';
  } else if (type === 'remove') {
    title = '移除一张牌';
    subtitle = '花费 ' + G.modal.price + ' 金币，从牌组中永久移除一张牌';
    body = '<div class="upgrade-grid">' + G.run.deck.map(c => cardMarkup(c, { act: 'remove-card', uid: c.uid })).join('') + '</div>';
  } else if (type === 'help') {
    title = '玩法说明';
    subtitle = '在灰烬里活下去的几件事';
    const kwRows = Object.keys(KEYWORDS).map(k => '<dt>' + k + '</dt><dd>' + KEYWORDS[k] + '</dd>').join('');
    body = '<div class="help-grid">' +
      '<div class="help-section"><h3>旅程</h3>' +
        '<p>从地图入口出发，每一次只能前往与当前位置相连的节点。穿过十层荒野，击败最深处王座上的<b>余烬之王</b>。</p>' +
        '<p style="margin-top:10px">战斗胜利后可以获得金币与卡牌；精英会额外掉落遗物。营火可以治疗或升级卡牌，商店可以购买卡牌、遗物与移除服务。</p>' +
        '<h3 style="margin-top:22px">战斗</h3>' +
        '<ul><li>每回合获得 <b>3 点行动力</b>，抽 5 张牌。</li><li>点击卡牌打出；单体攻击在有多名敌人时需要选择目标。</li><li>格挡会抵挡伤害，并在你的下个回合开始时清空。</li><li>敌人头顶会显示下一步意图，提前规划格挡与进攻。</li><li>回合结束时手牌会被弃置，未使用的行动力不会保留。</li></ul>' +
        '<p style="margin-top:10px">右上角可以分别开关背景音乐与音效。音乐会在首次点击后开始。</p>' +
        '<div class="help-keys"><kbd>1</kbd>-<kbd>9</kbd> 出牌 <kbd>E</kbd> 结束回合 <kbd>Esc</kbd> 取消/关闭</div>' +
      '</div>' +
      '<div class="help-section"><h3>关键词</h3><dl class="help-kw">' + kwRows + '</dl>' +
        '<h3 style="margin-top:22px">提示</h3><p>牌组不是越厚越好。围绕一两个核心机制构筑（力量、格挡、中毒、荆棘），比什么都拿一点更容易走到王座。</p>' +
      '</div>' +
    '</div>';
  }
  root.innerHTML = '<div class="modal-backdrop" data-act="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-label="' + escapeAttr(title) + '">' +
    '<div class="modal-head"><div><h2>' + title + '</h2><p>' + subtitle + '</p></div><button class="modal-close" data-act="close-modal" aria-label="关闭">' + icon('x') + '</button></div>' +
    '<div class="modal-body">' + body + '</div>' +
  '</div></div>';
}

/* ---------------------------------------------------------
   Render dispatcher
   --------------------------------------------------------- */
function render() {
  const app = $('#app');
  if (!app) return;
  let html = '';
  if (G.screen === 'title') html = renderTitle();
  else if (G.screen === 'end') html = renderEnd();
  else html = hudHTML() + (
    G.screen === 'map' ? renderMap() :
    G.screen === 'combat' ? renderCombat() :
    G.screen === 'reward' ? renderReward() :
    G.screen === 'rest' ? renderRest() :
    G.screen === 'shop' ? renderShop() :
    G.screen === 'event' ? renderEvent() : ''
  );
  app.innerHTML = html;
  document.title = G.screen === 'title'
    ? '烬旅 · Emberpath — 肉鸽卡牌游戏'
    : G.screen === 'combat' && G.combat
      ? '战斗 · ' + G.combat.name + ' — 烬旅'
      : '烬旅 · Emberpath';
  Music.setScene(
    G.screen === 'title' ? 'title' :
    G.screen === 'combat' ? (G.combat && G.combat.type === 'boss' ? 'boss' : 'combat') :
    G.screen === 'end' ? 'end' : 'map'
  );
  renderModal();
  afterRender();
}

function afterRender() {
  if (G.screen === 'map' && G.run) {
    const scroller = $('.map-scroll');
    if (scroller) {
      const id = G.run.currentNode || accessibleNodeIds()[0];
      const el = scroller.querySelector('[data-node-id="' + id + '"]');
      if (el) {
        requestAnimationFrame(() => {
          scroller.scrollTop = Math.max(0, el.offsetTop - scroller.clientHeight * 0.58);
        });
      }
    }
  }
  flushFloats();
  if (G.shake) {
    const field = $('.battlefield');
    if (field) {
      field.classList.add('shake');
      setTimeout(() => field.classList.remove('shake'), 380);
    }
    G.shake = false;
  }
}

/* ---------------------------------------------------------
   Combat feedback helpers
   --------------------------------------------------------- */
function clearFeedback() {
  const toasts = $('#toast-root');
  if (toasts) toasts.innerHTML = '';
  const fx = $('#fx-root');
  if (fx) fx.innerHTML = '';
}

function showToast(text, tone) {
  const root = $('#toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (tone || '');
  el.innerHTML = text;
  root.appendChild(el);
  while (root.children.length > 4) root.firstElementChild.remove();
  setTimeout(() => { if (el.parentNode) el.remove(); }, 2900);
}

function logCombat(text, tone) {
  if (!G.combat) return;
  G.combat.log.push({ text, tone: tone || '' });
  if (G.combat.log.length > 30) G.combat.log.shift();
}

function queueFloat(target, text, cls) {
  if (!G.combat) return;
  G.combat.floats.push({ target, text, cls: cls || '' });
}

function queueSlash(target) {
  if (!G.combat) return;
  G.combat.slashes.push(target);
}

function flushFloats() {
  if (!G.combat) return;
  const list = G.combat.floats.slice();
  G.combat.floats = [];
  list.forEach((f, i) => {
    const el = f.target === 'player'
      ? $('.combat-player')
      : $('[data-float="' + f.target + '"]');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const div = document.createElement('div');
    div.className = 'float-text ' + f.cls;
    div.textContent = f.text;
    div.style.left = (rect.left + rect.width / 2 + (Math.random() * 34 - 17)) + 'px';
    div.style.top = (rect.top + rect.height * 0.4 + (Math.random() * 16 - 8)) + 'px';
    div.style.animationDelay = (i * 0.045) + 's';
    const root = $('#fx-root');
    if (root) root.appendChild(div);
    setTimeout(() => { if (div.parentNode) div.remove(); }, 1100);
  });
  const slashes = G.combat.slashes.slice();
  G.combat.slashes = [];
  slashes.forEach((target) => {
    const el = $('[data-float="' + target + '"]');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const div = document.createElement('div');
    div.className = 'slash-fx';
    div.style.left = (rect.left + rect.width / 2) + 'px';
    div.style.top = (rect.top + rect.height / 2) + 'px';
    const root = $('#fx-root');
    if (root) root.appendChild(div);
    setTimeout(() => { if (div.parentNode) div.remove(); }, 420);
  });
}

function paint() { render(); }

/* ---------------------------------------------------------
   Encounter construction
   --------------------------------------------------------- */
function chooseEncounter(type, floor) {
  if (type === 'boss') return BOSS_ENCOUNTER;
  let pool;
  if (type === 'elite') {
    pool = ELITE_ENCOUNTERS.filter(e => e.id !== G.run.lastEncounter);
    if (!pool.length) pool = ELITE_ENCOUNTERS.slice();
  } else {
    pool = NORMAL_ENCOUNTERS.filter(e => e.min <= floor && e.max >= floor && e.id !== G.run.lastEncounter);
    if (!pool.length) pool = NORMAL_ENCOUNTERS.filter(e => e.min <= floor && e.max >= floor);
    if (!pool.length) pool = NORMAL_ENCOUNTERS.filter(e => e.min <= 5 && e.max >= 5);
  }
  return pick(pool) || NORMAL_ENCOUNTERS[0];
}

function makeEnemy(defId, floor, index, type) {
  const def = ENEMY_DEFS[defId];
  const isBoss = type === 'boss';
  const hpScale = isBoss ? 1 : 1 + floor * 0.035;
  const dmgScale = isBoss ? 1 : 1 + floor * 0.022;
  const blockScale = isBoss ? 1 : 1 + floor * 0.018;
  const hp = Math.round(rand(def.hp[0], def.hp[1]) * hpScale);
  return {
    uid: 'e' + index,
    defId, def,
    name: def.name,
    sigil: def.sigil,
    color: def.color,
    glow: def.glow,
    hp, maxHp: hp,
    block: 0,
    status: {},
    move: null,
    intentId: null,
    patternIndex: -1,
    dmgScale, blockScale,
    phase2: false,
    dead: false
  };
}

function chooseIntent(e) {
  const pattern = e.phase2 && e.def.phase2Pattern ? e.def.phase2Pattern : e.def.pattern;
  if (pattern && pattern.length) {
    e.patternIndex = (e.patternIndex + 1) % pattern.length;
    e.intentId = pattern[e.patternIndex];
  } else {
    const moves = e.def.moves;
    const choices = moves.filter(m => m.id !== e.intentId);
    e.intentId = pick(choices.length ? choices : moves).id;
  }
  e.move = e.def.moves.find(m => m.id === e.intentId) || e.def.moves[0];
  return e.move;
}

function startCombat(node) {
  const type = node.type;
  const floor = node.level;
  const enc = chooseEncounter(type, floor);
  G.run.lastEncounter = enc.id;
  const enemies = enc.enemies.map((defId, i) => makeEnemy(defId, floor, i, type));
  const c = {
    token: G.run.token,
    nodeId: node.id,
    type,
    floor,
    name: enc.name,
    enemies,
    drawPile: shuffle(G.run.deck.slice()),
    hand: [],
    discardPile: [],
    exhaustPile: [],
    energy: 0,
    maxEnergy: 3,
    block: 0,
    status: {},
    turn: 0,
    busy: true,
    over: false,
    finished: false,
    selectedCard: null,
    extraFirstDraw: hasRelic('mirror_shard') ? 1 : 0,
    emberHeartUsed: false,
    log: [],
    floats: [],
    slashes: [],
    actingEnemy: null
  };
  G.combat = c;
  G.screen = 'combat';
  enemies.forEach(e => { e.move = chooseIntent(e); });
  logCombat('你遇见了 <b>' + enc.name + '</b>。', 'info');
  // Relic hooks that fire before the first turn.
  if (hasRelic('anchor')) {
    c.block += 10;
    logCombat('锈蚀铁锚：获得 10 点格挡。', 'good');
  }
  if (hasRelic('whetstone')) {
    c.status.strength = (c.status.strength || 0) + 1;
    logCombat('磨刀石：获得 1 点力量。', 'good');
  }
  if (hasRelic('thorn_armor')) {
    c.status.thorns = (c.status.thorns || 0) + 2;
    logCombat('荆棘护甲：获得 2 点荆棘。', 'good');
  }
  if (hasRelic('eagle_eye')) {
    c.status.drawPower = (c.status.drawPower || 0) + 1;
  }
  if (hasRelic('soul_torch')) {
    enemies.forEach(e => { e.status.vulnerable = (e.status.vulnerable || 0) + 2; });
    logCombat('灵魂火把：所有敌人获得 2 层易伤。', 'good');
  }
  if (hasRelic('double_edge')) {
    G.run.hp = Math.max(1, G.run.hp - 3);
    logCombat('双刃护符：失去 3 点生命。', 'hit');
  }
  startPlayerTurn(true);
  render();
}

/* ---------------------------------------------------------
   Piles and card flow
   --------------------------------------------------------- */
function drawCards(n) {
  const c = G.combat;
  if (!c) return;
  for (let i = 0; i < n; i++) {
    if (!c.drawPile.length) {
      if (!c.discardPile.length) break;
      c.drawPile = shuffle(c.discardPile);
      c.discardPile = [];
      logCombat('弃牌堆洗回抽牌堆。', 'info');
    }
    const card = c.drawPile.pop();
    if (c.hand.length >= 10) {
      c.discardPile.push(card);
      logCombat('手牌已满，<b>' + cardName(card) + '</b> 被弃置。', 'info');
    } else {
      c.hand.push(card);
    }
  }
}

function discardHand() {
  const c = G.combat;
  if (!c) return;
  if (c.hand.length) c.discardPile.push.apply(c.discardPile, c.hand);
  c.hand = [];
}

function aliveEnemies() {
  return G.combat ? G.combat.enemies.filter(e => e.hp > 0) : [];
}

function cardPlayable(card) {
  if (!G.combat) return false;
  const data = cardData(card);
  return !G.combat.busy && !G.combat.over && G.combat.energy >= data.cost;
}

/* ---------------------------------------------------------
   Playing cards
   --------------------------------------------------------- */
function playCard(handIndex, targetIndex) {
  const c = G.combat;
  if (!c || c.busy || c.over) return;
  const card = c.hand[handIndex];
  if (!card) return;
  const data = cardData(card);
  const def = data.def;
  if (c.energy < data.cost) {
    showToast('行动力不足。', 'danger');
    Sound.play('click');
    return;
  }
  const alive = aliveEnemies();
  if (!alive.length) return;
  if (def.target === 'enemy') {
    if (targetIndex === undefined || targetIndex === null) {
      if (alive.length > 1) {
        if (c.selectedCard === handIndex) {
          c.selectedCard = null;
        } else {
          c.selectedCard = handIndex;
          Sound.play('click');
        }
        render();
        return;
      }
      targetIndex = c.enemies.indexOf(alive[0]);
    }
    if (!c.enemies[targetIndex] || c.enemies[targetIndex].hp <= 0) {
      c.selectedCard = null;
      render();
      return;
    }
  }
  resolveCard(handIndex, targetIndex, data);
}

function targetEnemy(enemyIndex) {
  const c = G.combat;
  if (!c || c.selectedCard === null || c.busy) return;
  const idx = c.selectedCard;
  c.selectedCard = null;
  playCard(idx, enemyIndex);
}

function cancelTargeting() {
  if (G.combat && G.combat.selectedCard !== null) {
    G.combat.selectedCard = null;
    render();
  }
}

function resolveCard(handIndex, targetIndex, data) {
  const c = G.combat;
  const card = c.hand[handIndex];
  if (!card) return;
  const def = data.def;
  const s = data.s;
  c.hand.splice(handIndex, 1);
  c.selectedCard = null;
  c.energy -= data.cost;
  G.run.stats.cardsPlayed++;
  logCombat('你打出 <b>' + cardName(card) + '</b>。', '');
  Sound.play(def.type === 'attack' ? 'attack' : 'card');
  if (def.type === 'attack' && hasRelic('ember_heart') && !c.emberHeartUsed) {
    c.emberHeartUsed = true;
    drawCards(2);
    logCombat('余烬之心：抽 2 张牌。', 'good');
  }
  applyCardEffects(def, s, targetIndex);
  if (def.exhaust || def.type === 'power') {
    c.exhaustPile.push(card);
    if (def.type === 'power') logCombat('<b>' + cardName(card) + '</b> 的能力持续生效。', 'good');
  } else {
    c.discardPile.push(card);
  }
  checkVictory();
  paint();
}

function applyCardEffects(def, s, targetIndex) {
  const c = G.combat;
  const effects = def.effects(s) || [];
  for (const fx of effects) {
    if (!G.combat || c.over) return;
    if (fx.k === 'damage') {
      const times = fx.times || 1;
      const targets = fx.all ? c.enemies.filter(e => e.hp > 0) : [c.enemies[targetIndex]].filter(e => e && e.hp > 0);
      let totalUnblocked = 0;
      for (const target of targets) {
        let targetUnblocked = 0;
        const base = fx.fromBlock ? c.block + (fx.bonus || 0) : fx.n;
        for (let h = 0; h < times; h++) {
          if (target.hp <= 0 || c.over) break;
          const res = dealDamageToEnemy(target, base, { attack: true, execute: !!fx.execute });
          targetUnblocked += res.unblocked;
          if (target.hp <= 0) break;
        }
        totalUnblocked += targetUnblocked;
        if (targetUnblocked > 0) {
          logCombat('对 <b>' + target.name + '</b> 造成 ' + targetUnblocked + ' 点伤害。', 'hit');
        } else {
          logCombat('<b>' + target.name + '</b> 挡住了这次攻击。', 'info');
        }
      }
      if (fx.lifesteal && totalUnblocked > 0) {
        const healed = healRun(totalUnblocked);
        if (healed > 0) {
          queueFloat('player', '+' + healed, 'heal');
          logCombat('吸取生命，回复 ' + healed + ' 点。', 'good');
          Sound.play('heal');
        }
      }
    } else if (fx.k === 'block') {
      const gained = addBlock(fx.n);
      queueFloat('player', '+' + gained, 'block');
      logCombat('获得 ' + gained + ' 点格挡。', 'good');
      Sound.play('block');
    } else if (fx.k === 'draw') {
      drawCards(fx.n);
      logCombat('抽 ' + fx.n + ' 张牌。', 'info');
    } else if (fx.k === 'energy') {
      c.energy += fx.n;
      queueFloat('player', '+' + fx.n + ' 行动力', 'status');
    } else if (fx.k === 'heal') {
      const healed = healRun(fx.n);
      if (healed > 0) {
        queueFloat('player', '+' + healed, 'heal');
        logCombat('回复 ' + healed + ' 点生命。', 'good');
        Sound.play('heal');
      }
    } else if (fx.k === 'loseHp') {
      losePlayerHp(fx.n);
      logCombat('失去 ' + fx.n + ' 点生命。', 'hit');
    } else if (fx.k === 'status') {
      if (fx.target === 'self') {
        addStatusPlayer(fx.name, fx.n);
        logCombat('获得 ' + fx.n + ' 层' + STATUS_INFO[fx.name].name + '。', 'good');
      } else {
        const targets = fx.target === 'all' ? c.enemies.filter(e => e.hp > 0) : [c.enemies[targetIndex]].filter(e => e && e.hp > 0);
        for (const target of targets) {
          addStatusEnemy(target, fx.name, fx.n);
          logCombat('对 <b>' + target.name + '</b> 施加 ' + fx.n + ' 层' + STATUS_INFO[fx.name].name + '。', 'info');
        }
      }
    } else if (fx.k === 'nextBlock') {
      c.status.nextBlock = (c.status.nextBlock || 0) + fx.n;
      logCombat('下回合开始时获得 ' + fx.n + ' 点格挡。', 'good');
    } else if (fx.k === 'cleanse') {
      c.status.vulnerable = 0;
      c.status.weak = 0;
      c.status.poison = 0;
      logCombat('负面状态被净化。', 'good');
      queueFloat('player', '净化', 'status');
    } else if (fx.k === 'doubleStrength') {
      c.status.strength = (c.status.strength || 0) * 2;
      queueFloat('player', '力量 ×2', 'status');
      logCombat('力量翻倍，当前为 ' + (c.status.strength || 0) + '。', 'good');
    } else if (fx.k === 'maxHp') {
      increaseMaxHp(fx.n, true);
      logCombat('最大生命 +' + fx.n + '。', 'good');
    }
  }
}

/* ---------------------------------------------------------
   Block, damage, status
   --------------------------------------------------------- */
function addBlock(n, useDex) {
  const c = G.combat;
  if (!c) return 0;
  const bonus = useDex === false ? 0 : (c.status.dexterity || 0);
  const gain = Math.max(0, Math.round(n + bonus));
  c.block += gain;
  return gain;
}

function addStatusPlayer(name, n) {
  const c = G.combat;
  if (!c) return;
  c.status[name] = (c.status[name] || 0) + n;
  queueFloat('player', STATUS_INFO[name] ? STATUS_INFO[name].name + ' +' + n : '+' + n, 'status');
}

function addStatusEnemy(e, name, n) {
  if (!e || e.hp <= 0) return;
  e.status[name] = (e.status[name] || 0) + n;
  queueFloat('enemy-' + e.uid, (STATUS_INFO[name] ? STATUS_INFO[name].name : '') + ' +' + n, 'status');
}

function healPlayer(n) {
  const healed = healRun(n);
  if (healed > 0) queueFloat('player', '+' + healed, 'heal');
  return healed;
}

function losePlayerHp(n) {
  if (!G.combat) return;
  dealDamageToPlayer(n, { ignoreBlock: true, source: 'self' });
}

function dealDamageToEnemy(e, rawBase, opts) {
  opts = opts || {};
  const c = G.combat;
  if (!c || !e || e.hp <= 0) return { unblocked: 0, blocked: 0, raw: 0 };
  let raw = rawBase;
  if (!opts.direct) {
    raw += c.status.strength || 0;
    if (hasRelic('double_edge')) raw += 2;
    if (c.status.weak > 0) raw = Math.floor(raw * 0.75);
    if (opts.execute && e.hp / e.maxHp <= 0.4) raw *= 2;
    if (e.status.vulnerable > 0) raw = Math.floor(raw * 1.5);
  }
  raw = Math.max(0, Math.round(raw));
  const blocked = Math.min(e.block, raw);
  e.block -= blocked;
  const unblocked = raw - blocked;
  e.hp = Math.max(0, e.hp - unblocked);
  if (unblocked > 0) G.run.stats.damageDealt += unblocked;
  queueFloat('enemy-' + e.uid, unblocked > 0 ? String(unblocked) : '格挡', unblocked > 0 ? '' : 'block');
  if (opts.attack) queueSlash('enemy-' + e.uid);
  if (unblocked > 0) {
    Sound.play('hit');
    if (unblocked >= 8) G.shake = true;
  } else if (blocked > 0) {
    Sound.play('block');
  }
  if (opts.attack && e.hp > 0 && e.status.thorns > 0) {
    dealDamageToPlayer(e.status.thorns, { direct: true, source: 'thorns' });
  }
  if (e.hp <= 0 && !e.dead) {
    e.dead = true;
    e.block = 0;
    logCombat('<b>' + e.name + '</b> 倒下了。', 'good');
  } else if (e.def.boss && !e.phase2 && e.hp > 0 && e.hp <= e.maxHp * 0.5) {
    e.phase2 = true;
    e.patternIndex = -1;
    e.status.strength = (e.status.strength || 0) + 3;
    e.status.metallicize = (e.status.metallicize || 0) + 6;
    logCombat('<b>余烬之王</b>撕开了王座。灰烬从伤口里涌出。', 'hit');
    showToast('余烬之王 · 觉醒：力量 +3，金属化 +6', 'danger');
    Sound.play('hurt');
    G.shake = true;
  }
  checkVictory();
  return { unblocked, blocked, raw };
}

function dealDamageToPlayer(raw, opts) {
  opts = opts || {};
  const c = G.combat;
  if (!c || c.over) return { unblocked: 0, blocked: 0, raw: 0 };
  let dmg = Math.max(0, Math.round(raw));
  let blocked = 0;
  if (!opts.ignoreBlock) {
    blocked = Math.min(c.block, dmg);
    c.block -= blocked;
    dmg -= blocked;
  }
  let lost = 0;
  if (dmg > 0) {
    if (hasRelic('lizard_tail') && G.run.hp - dmg <= 0) {
      const idx = G.run.relics.indexOf('lizard_tail');
      if (idx >= 0) G.run.relics.splice(idx, 1);
      G.run.flags.lizardUsed = true;
      G.run.hp = Math.max(1, Math.ceil(G.run.maxHp * 0.25));
      queueFloat('player', '蜥蜴尾', 'heal');
      logCombat('<b>蜥蜴尾</b>断裂，你从死亡边缘被拽了回来。', 'good');
      showToast('蜥蜴尾断裂：回复至 ' + G.run.hp + ' 点生命', 'good');
      Sound.play('heal');
      dmg = 0;
    }
  }
  if (dmg > 0) {
    G.run.hp = Math.max(0, G.run.hp - dmg);
    lost = dmg;
    if (dmg >= 8) G.shake = true;
    Sound.play('hurt');
    queueFloat('player', '-' + dmg, '');
  } else {
    queueFloat('player', '格挡', 'block');
    if (blocked > 0) Sound.play('block');
  }
  if (G.run.hp <= 0) triggerGameOver();
  return { unblocked: lost, blocked, raw: Math.round(raw) };
}

function canAct() {
  const c = G.combat;
  return !!(c && !c.busy && !c.over);
}

/* ---------------------------------------------------------
   End of fight
   --------------------------------------------------------- */
function checkVictory() {
  const c = G.combat;
  if (!c || c.over) return false;
  if (c.enemies.every(e => e.hp <= 0)) {
    c.over = true;
    c.busy = true;
    c.selectedCard = null;
    logCombat('战斗结束。灰烬重新落定。', 'good');
    Sound.play('victory');
    setTimeout(() => {
      if (G.combat === c) finishCombat();
    }, 700);
    return true;
  }
  return false;
}

function finishCombat() {
  const c = G.combat;
  if (!c || c.finished) return;
  c.finished = true;
  c.over = true;
  c.busy = true;
  G.run.stats.kills += c.enemies.length;
  if (c.type === 'elite') G.run.stats.elites++;
  if (c.type === 'boss') {
    finishRun(true);
    return;
  }
  if (hasRelic('blood_vial')) {
    const healed = healRun(6);
    if (healed > 0) logCombat('燃血之瓶回复 ' + healed + ' 点生命。', 'good');
  }
  openCombatReward(c);
}

function triggerGameOver() {
  const c = G.combat;
  if (!c || c.over) return;
  c.over = true;
  c.busy = true;
  c.selectedCard = null;
  G.run.hp = 0;
  logCombat('你的火熄灭了。', 'hit');
  Sound.play('defeat');
  setTimeout(() => {
    if (G.combat === c) finishRun(false);
  }, 850);
}

/* ---------------------------------------------------------
   Turn flow
   --------------------------------------------------------- */
function startPlayerTurn(initial) {
  const c = G.combat;
  if (!c || c.over) return false;
  c.turn++;
  if (!initial) c.block = 0;
  c.selectedCard = null;
  c.actingEnemy = null;
  if ((c.status.poison || 0) > 0) {
    const p = c.status.poison;
    c.status.poison--;
    logCombat('中毒发作，失去 ' + p + ' 点生命。', 'hit');
    dealDamageToPlayer(p, { ignoreBlock: true, source: 'poison' });
    if (c.over) return false;
  }
  if ((c.status.regen || 0) > 0) {
    const healed = healRun(c.status.regen);
    c.status.regen--;
    if (healed > 0) {
      queueFloat('player', '+' + healed, 'heal');
      logCombat('再生回复 ' + healed + ' 点生命。', 'good');
    }
  }
  if ((c.status.ritual || 0) > 0) {
    c.status.strength = (c.status.strength || 0) + c.status.ritual;
    queueFloat('player', '力量 +' + c.status.ritual, 'status');
    logCombat('仪式：获得 ' + c.status.ritual + ' 点力量。', 'good');
  }
  if ((c.status.poisonAura || 0) > 0) {
    c.enemies.filter(e => e.hp > 0).forEach(e => addStatusEnemy(e, 'poison', c.status.poisonAura));
    logCombat('毒雾弥漫，所有敌人中毒。', 'good');
  }
  let energy = 3;
  if (c.turn === 1 && hasRelic('dawn_charm')) energy++;
  if (hasRelic('hourglass') && c.turn % 3 === 0) energy++;
  c.energy = energy;
  if ((c.status.nextBlock || 0) > 0) {
    const gained = addBlock(c.status.nextBlock);
    queueFloat('player', '+' + gained, 'block');
    c.status.nextBlock = 0;
  }
  const drawCount = 5 + (c.status.drawPower || 0) + (c.turn === 1 ? c.extraFirstDraw : 0);
  drawCards(drawCount);
  G.run.stats.turns++;
  c.busy = false;
  logCombat('第 <b>' + c.turn + '</b> 回合开始。', 'info');
  Sound.play('turn');
  return true;
}

async function endTurn() {
  const c = G.combat;
  if (!c || c.busy || c.over) return;
  if (c.selectedCard !== null) {
    c.selectedCard = null;
    render();
    return;
  }
  c.busy = true;
  c.selectedCard = null;
  if ((c.status.metallicize || 0) > 0) {
    const gained = addBlock(c.status.metallicize);
    queueFloat('player', '+' + gained, 'block');
    logCombat('金属化：获得 ' + gained + ' 点格挡。', 'good');
  }
  discardHand();
  if ((c.status.vulnerable || 0) > 0) c.status.vulnerable--;
  if ((c.status.weak || 0) > 0) c.status.weak--;
  logCombat('你结束了回合。', 'info');
  paint();
  await sleep(340);
  await enemyPhase();
}

async function enemyPhase() {
  const c = G.combat;
  if (!c) return;
  const token = c.token;
  for (let i = 0; i < c.enemies.length; i++) {
    const e = c.enemies[i];
    if (!e || e.hp <= 0 || c.over || G.run.token !== token) continue;
    e.block = 0;
    if ((e.status.poison || 0) > 0) {
      const p = e.status.poison;
      e.status.poison--;
      e.hp = Math.max(0, e.hp - p);
      queueFloat('enemy-' + e.uid, String(p), 'poison');
      logCombat('<b>' + e.name + '</b> 受到 ' + p + ' 点中毒伤害。', 'hit');
      if (e.hp <= 0) {
        e.dead = true;
        e.block = 0;
        logCombat('<b>' + e.name + '</b> 在毒雾中倒下。', 'good');
        paint();
        await sleep(320);
        if (checkVictory()) return;
        continue;
      }
      paint();
      await sleep(280);
    }
    if ((e.status.regen || 0) > 0) {
      const healed = Math.min(e.maxHp - e.hp, e.status.regen);
      e.hp += healed;
      e.status.regen--;
      if (healed > 0) {
        queueFloat('enemy-' + e.uid, '+' + healed, 'heal');
        logCombat('<b>' + e.name + '</b> 回复了 ' + healed + ' 点生命。', 'info');
      }
    }
    if ((e.status.metallicize || 0) > 0) {
      e.block += e.status.metallicize;
      queueFloat('enemy-' + e.uid, '+' + e.status.metallicize, 'block');
    }
    if ((e.status.ritual || 0) > 0) {
      e.status.strength = (e.status.strength || 0) + e.status.ritual;
      queueFloat('enemy-' + e.uid, '力量 +' + e.status.ritual, 'status');
    }
    if (e.hp <= 0) {
      if (checkVictory()) return;
      continue;
    }
    c.actingEnemy = e.uid;
    executeEnemyMove(e);
    if (c.over) return;
    c.actingEnemy = null;
    if ((e.status.vulnerable || 0) > 0) e.status.vulnerable--;
    if ((e.status.weak || 0) > 0) e.status.weak--;
    e.move = chooseIntent(e);
    paint();
    await sleep(650);
    if (c.over || G.run.token !== token) return;
  }
  if (c.over) return;
  startPlayerTurn(false);
  paint();
}

function executeEnemyMove(e) {
  const c = G.combat;
  const m = e.move;
  if (!c || !m || e.hp <= 0) return;
  logCombat('<b>' + e.name + '</b> 使用 <b>' + m.name + '</b>。', '');
  if (m.dmg) {
    const hits = m.hits || 1;
    for (let h = 0; h < hits; h++) {
      if (c.over || e.hp <= 0) break;
      let raw = (m.dmg + (e.status.strength || 0)) * e.dmgScale;
      if ((e.status.weak || 0) > 0) raw *= 0.75;
      if ((c.status.vulnerable || 0) > 0) raw *= 1.5;
      raw = Math.max(0, Math.round(raw));
      dealDamageToPlayer(raw, { source: e.uid });
      if ((c.status.thorns || 0) > 0 && e.hp > 0 && !c.over) {
        dealDamageToEnemy(e, c.status.thorns, { direct: true, source: 'thorns' });
      }
    }
    if (c.over) return;
  }
  if (m.block) {
    const gained = Math.round(m.block * e.blockScale);
    e.block += gained;
    queueFloat('enemy-' + e.uid, '+' + gained, 'block');
    logCombat('<b>' + e.name + '</b> 获得 ' + gained + ' 点格挡。', 'info');
    Sound.play('block');
  }
  if (m.str) {
    e.status.strength = (e.status.strength || 0) + m.str;
    queueFloat('enemy-' + e.uid, '力量 +' + m.str, 'status');
    logCombat('<b>' + e.name + '</b> 获得 ' + m.str + ' 点力量。', 'info');
  }
  if (m.metal) {
    e.status.metallicize = (e.status.metallicize || 0) + m.metal;
    queueFloat('enemy-' + e.uid, '金属化 +' + m.metal, 'status');
  }
  if (m.ritual) {
    e.status.ritual = (e.status.ritual || 0) + m.ritual;
  }
  if (m.regen) {
    e.status.regen = (e.status.regen || 0) + m.regen;
  }
  if (m.heal) {
    const healed = Math.min(e.maxHp - e.hp, m.heal);
    e.hp += healed;
    if (healed > 0) queueFloat('enemy-' + e.uid, '+' + healed, 'heal');
  }
  if (m.weak) {
    addStatusPlayer('weak', m.weak);
    logCombat('你获得 ' + m.weak + ' 层虚弱。', 'hit');
  }
  if (m.vuln) {
    addStatusPlayer('vulnerable', m.vuln);
    logCombat('你获得 ' + m.vuln + ' 层易伤。', 'hit');
  }
  if (m.poison) {
    addStatusPlayer('poison', m.poison);
    logCombat('你获得 ' + m.poison + ' 层中毒。', 'hit');
  }
}

function enemyAttackPreview(e, m) {
  let raw = (m.dmg + (e.status.strength || 0)) * e.dmgScale;
  if ((e.status.weak || 0) > 0) raw *= 0.75;
  if (G.combat && (G.combat.status.vulnerable || 0) > 0) raw *= 1.5;
  return Math.max(0, Math.round(raw));
}

/* ---------------------------------------------------------
   Combat rendering
   --------------------------------------------------------- */
function enemyIntentHTML(e) {
  if (!e || e.hp <= 0 || !e.move) return '';
  const m = e.move;
  const badges = [];
  if (m.dmg) {
    badges.push('<span class="intent-badge" title="攻击">' + icon('sword') + '<b>' + enemyAttackPreview(e, m) + '</b>' + (m.hits > 1 ? '<span>×' + m.hits + '</span>' : '') + '</span>');
  }
  if (m.block) {
    badges.push('<span class="intent-badge block" title="格挡">' + icon('shield') + '<b>' + Math.round(m.block * e.blockScale) + '</b></span>');
  }
  if (m.str) badges.push('<span class="intent-badge buff" title="力量 +' + m.str + '">' + icon('arrowUp') + '<b>' + m.str + '</b></span>');
  if (m.metal) badges.push('<span class="intent-badge buff" title="金属化 +' + m.metal + '">' + icon('shield') + '<b>' + m.metal + '</b></span>');
  if (m.heal) badges.push('<span class="intent-badge buff" title="治疗">' + icon('heart') + '<b>' + m.heal + '</b></span>');
  if (m.weak) badges.push('<span class="intent-badge debuff" title="施加 ' + m.weak + ' 层虚弱">' + icon('arrowDown') + '<b>' + m.weak + '</b></span>');
  if (m.vuln) badges.push('<span class="intent-badge debuff" title="施加 ' + m.vuln + ' 层易伤">' + icon('target') + '<b>' + m.vuln + '</b></span>');
  if (m.ritual) badges.push('<span class="intent-badge buff" title="仪式">' + icon('flame') + '<b>' + m.ritual + '</b></span>');
  if (!badges.length) badges.push('<span class="intent-badge" title="准备">' + icon('spark') + '</span>');
  return '<div class="enemy-intent" title="意图：' + escapeAttr(m.name) + '"><span class="intent-name">' + escapeHTML(m.name) + '</span>' + badges.join('') + '</div>';
}

function enemyHTML(e, index) {
  const c = G.combat;
  const targetable = c.selectedCard !== null && e.hp > 0;
  const classes = ['enemy-card', e.hp <= 0 ? 'dead' : '', targetable ? 'targetable' : '', c.actingEnemy === e.uid ? 'attacking' : '', e.def.boss ? 'boss' : '', e.phase2 ? 'phase2' : ''].filter(Boolean).join(' ');
  const act = targetable ? ' data-act="target-enemy" data-enemy="' + index + '"' : '';
  const block = e.block > 0 ? '<span class="enemy-block">' + icon('shield') + e.block + '</span>' : '';
  const name = e.def.boss && e.phase2 ? e.name + ' · 觉醒' : e.name;
  return '<div class="' + classes + '" data-float="enemy-' + e.uid + '"' + act + ' style="--enemy-color:' + e.color + ';--enemy-glow:' + e.glow + '">' +
    enemyIntentHTML(e) +
    '<div class="enemy-portrait">' + block + '<span class="enemy-sigil">' + escapeHTML(e.sigil) + '</span></div>' +
    '<div class="enemy-name">' + escapeHTML(name) + '</div>' +
    '<div class="enemy-hp"><div class="hp-line"><span class="label">生命</span><span class="value">' + e.hp + ' / ' + e.maxHp + '</span></div><div class="bar"><i style="width:' + pct(e.hp, e.maxHp) + '%"></i></div></div>' +
    '<div class="status-row enemy-status">' + statusChips(e.status) + '</div>' +
  '</div>';
}

function battleScene() {
  return [
    '<svg viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">',
    '<defs>',
    '<radialGradient id="arena-haze" cx="50%" cy="42%" r="50%"><stop offset="0%" stop-color="#e88352" stop-opacity=".2"/><stop offset="52%" stop-color="#9f4a2e" stop-opacity=".07"/><stop offset="100%" stop-color="#080a0f" stop-opacity="0"/></radialGradient>',
    '<linearGradient id="arena-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0a0c12" stop-opacity="0"/><stop offset="100%" stop-color="#080a0f" stop-opacity=".96"/></linearGradient>',
    '<linearGradient id="arena-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#25242a"/><stop offset="100%" stop-color="#0b0d12"/></linearGradient>',
    '</defs>',
    '<rect width="1440" height="760" fill="#080a0f"/>',
    '<circle cx="720" cy="272" r="430" fill="url(#arena-haze)"/>',
    '<circle cx="720" cy="272" r="172" fill="#c47850" opacity=".075"/>',
    '<circle cx="720" cy="272" r="172" fill="none" stroke="#d89b6e" stroke-opacity=".12" stroke-width="1.2"/>',
    '<circle cx="720" cy="272" r="224" fill="none" stroke="#b57c58" stroke-opacity=".06" stroke-width="1"/>',
    '<g opacity=".38" fill="#0b0d13">',
    '<path d="M0 430 120 330l92 54 84-90 120 98 110-50 108 68 122-112 96 88 120-62 88 74 140-86v162H0Z"/>',
    '<path d="M0 500 100 428l104 46 92-62 118 70 96-30 132 54 104-82 98 58 130-30 100 52 166-84v150H0Z"/>',
    '</g>',
    '<g opacity=".4" fill="url(#arena-stone)" stroke="#3b332c" stroke-width="1">',
    '<path d="M106 620V300c0-50 30-92 78-112l12 32c-37 18-58 48-58 80v320Z"/>',
    '<path d="M186 620V318c0-47 20-83 54-106l14 28c-26 19-38 43-38 78v302Z"/>',
    '<path d="M1334 620V300c0-50-30-92-78-112l-12 32c37 18 58 48 58 80v320Z"/>',
    '<path d="M1254 620V318c0-47-20-83-54-106l-14 28c26 19 38 43 38 78v302Z"/>',
    '<path d="M430 620V360c0-88 44-150 116-184l16 34c-64 34-98 87-98 150v260Z"/>',
    '<path d="M1010 620V360c0-88-44-150-116-184l-16 34c64 34 98 87 98 150v260Z"/>',
    '</g>',
    '<g opacity=".45" fill="none" stroke="#5a4636" stroke-width="1">',
    '<path d="M486 578V370c0-64 34-110 84-136"/>',
    '<path d="M954 578V370c0-64-34-110-84-136"/>',
    '<path d="M560 300c36-46 84-70 160-70s124 24 160 70"/>',
    '<path d="M600 312c30-30 66-45 120-45s90 15 120 45"/>',
    '</g>',
    '<g opacity=".28" stroke="#8e5b3d" stroke-width="1">',
    '<path d="M180 628h1080M240 654h960M320 684h800"/>',
    '<path d="M420 610 300 760M1020 610l120 150M720 610v150"/>',
    '</g>',
    '<rect x="0" y="500" width="1440" height="260" fill="url(#arena-fog)"/>',
    '<g fill="#ff9a62" opacity=".55">',
    '<circle cx="262" cy="390" r="2"/><circle cx="1134" cy="332" r="1.7"/><circle cx="1050" cy="498" r="1.4"/><circle cx="378" cy="520" r="1.2"/><circle cx="1018" cy="208" r="1.6"/><circle cx="432" cy="214" r="1.3"/>',
    '</g>',
    '<g stroke="#a86544" stroke-opacity=".18" fill="none">',
    '<path d="M0 566c150-20 250-12 356 8M1084 580c118-18 226-14 356 6"/>',
    '</g>',
    '</svg>'
  ].join('');
}

function renderCombat() {
  const c = G.combat;
  if (!c) return '';
  const selectedCard = c.selectedCard !== null ? c.hand[c.selectedCard] : null;
  const enemies = c.enemies.map((e, i) => enemyHTML(e, i)).join('');
  const logs = c.log.slice(-8).map(l => '<div class="log-line ' + l.tone + '">' + l.text + '</div>').join('');
  const hand = c.hand.map((card, i) => {
    const data = cardData(card);
    const disabled = c.busy || c.energy < data.cost;
    return cardMarkup(card, {
      act: 'play-card',
      index: i,
      disabled,
      selected: c.selectedCard === i,
      ariaLabel: data.def.name + '，消耗 ' + data.cost + ' 行动力'
    });
  }).join('');
  const block = c.block > 0 ? '<span class="block-badge">' + icon('shield') + c.block + '</span>' : '';
  const typeLabel = c.type === 'elite' ? '精英战' : c.type === 'boss' ? '首领战' : '战斗';
  const turnLabel = c.busy ? '敌人行动中' : '你的回合';
  return '<div class="screen combat-screen">' +
    '<div class="battle-backdrop">' + battleScene() + '</div>' +
    '<div class="combat-head">' +
      '<div class="combat-head-left"><div><div class="eyebrow">' + typeLabel + ' · 深度 ' + (c.floor + 1) + '</div><h2>' + escapeHTML(c.name) + '</h2></div><span class="sub">观察意图，规划这一回合。</span></div>' +
      '<span class="turn-pill ' + (c.busy ? 'enemy' : '') + '"><i class="dot"></i>第 ' + c.turn + ' 回合 · ' + turnLabel + '</span>' +
    '</div>' +
    '<div class="battlefield">' +
      '<aside class="combat-player" data-float="player">' + block +
        '<div class="hero-card"><div class="hero-portrait"><span class="glyph">烬</span></div><div class="hero-meta"><h2>拾烬者</h2><p>ASHWALKER</p></div></div>' +
        '<div class="player-bars"><div class="hp-line"><span class="label">生命</span><span class="value"><b>' + G.run.hp + '</b> / ' + G.run.maxHp + '</span></div><div class="bar"><i style="width:' + pct(G.run.hp, G.run.maxHp) + '%"></i></div></div>' +
        '<div class="status-row">' + statusChips(c.status) + '</div>' +
      '</aside>' +
      '<div class="enemy-zone ' + (c.enemies.length === 1 ? 'single' : '') + (c.type === 'boss' ? ' boss' : '') + '">' + enemies + '</div>' +
      '<aside class="combat-log"><h3>战 斗 记 录</h3><div class="log-lines">' + logs + '</div></aside>' +
    '</div>' +
    '<div class="combat-footer"><div class="hand-row">' +
      '<div class="energy-orb" title="行动力"><span class="max">行动力</span><span class="num">' + c.energy + '</span><span class="slash">/ ' + c.maxEnergy + '</span></div>' +
      '<div class="hand">' + (hand || '<div class="hand-empty">没有手牌。</div>') + '</div>' +
      '<div class="combat-actions">' +
        '<button class="btn end-turn" data-act="end-turn"' + (c.busy ? ' disabled' : '') + '>' + (c.busy ? '敌人行动中' : '结束回合') + '<small>END TURN</small></button>' +
        '<div class="pile-buttons">' +
          '<button class="pile-btn" data-act="open-pile" data-pile="drawPile" title="抽牌堆">抽牌<b>' + c.drawPile.length + '</b></button>' +
          '<button class="pile-btn" data-act="open-pile" data-pile="discardPile" title="弃牌堆">弃牌<b>' + c.discardPile.length + '</b></button>' +
          '<button class="pile-btn" data-act="open-pile" data-pile="exhaustPile" title="消耗堆">消耗<b>' + c.exhaustPile.length + '</b></button>' +
        '</div>' +
      '</div>' +
    '</div></div>' +
    (selectedCard ? '<button class="target-hint" data-act="cancel-target">选择目标 · 点击敌人（Esc 取消）</button>' : '') +
  '</div>';
}

/* ---------------------------------------------------------
   Rewards
   --------------------------------------------------------- */
function rollCardChoices(count, elite) {
  const out = [];
  const used = new Set();
  const weights = elite
    ? [['common', 45], ['uncommon', 37], ['rare', 18]]
    : [['common', 62], ['uncommon', 30], ['rare', 8]];
  let guard = 0;
  while (out.length < count && guard++ < 50) {
    let roll = Math.random() * 100;
    let rarity = 'common';
    for (const pair of weights) {
      roll -= pair[1];
      if (roll <= 0) { rarity = pair[0]; break; }
    }
    let pool = REWARD_CARD_IDS.filter(id => CARD_DEFS[id].rarity === rarity && !used.has(id));
    if (!pool.length) pool = REWARD_CARD_IDS.filter(id => !used.has(id));
    if (!pool.length) break;
    const id = pick(pool);
    used.add(id);
    out.push(makeCard(id));
  }
  return out;
}

function cardPrice(card) {
  const base = { common: 50, uncommon: 78, rare: 120 }[CARD_DEFS[card.id].rarity] || 50;
  const discount = hasRelic('merchant_badge') ? 0.75 : 1;
  return Math.max(5, Math.round(base * discount / 5) * 5);
}

function relicPrice(def) {
  const base = { common: 145, uncommon: 190, rare: 250 }[def.rarity] || 150;
  const discount = hasRelic('merchant_badge') ? 0.75 : 1;
  return Math.max(5, Math.round(base * discount / 5) * 5);
}

function openCombatReward(c) {
  const elite = c.type === 'elite';
  let gold = (elite ? rand(35, 50) : rand(15, 23)) + c.floor * 2;
  if (elite && hasRelic('champion_belt')) gold += 30;
  const before = G.run.gold;
  addGold(gold);
  let relic = null;
  if (elite) {
    relic = grantRandomRelic(true);
    if (!relic) {
      addGold(50);
      gold += 50;
    }
    const extra = G.run.gold - before - gold;
    if (extra > 0) gold += extra;
  }
  const count = hasRelic('lucky_coin') ? 4 : 3;
  const cards = rollCardChoices(count, elite);
  G.reward = {
    source: c.type,
    title: elite ? '精英的战利品' : '战斗的余烬',
    subtitle: c.name + ' 已倒下。',
    gold,
    relic,
    cards,
    cardChosen: false,
    chosenCard: null,
    skipped: false
  };
  G.screen = 'reward';
  Sound.play('gold');
  render();
}

function openTreasure() {
  const before = G.run.gold;
  let gold = rand(35, 55);
  const relic = grantRandomRelic(true);
  if (!relic) gold += 50;
  addGold(gold);
  gold = G.run.gold - before;
  G.reward = {
    source: 'treasure',
    title: '灰烬中的宝箱',
    subtitle: '锁早已锈断，里面的东西还在等一个活人。',
    gold,
    relic,
    cards: [],
    cardChosen: true,
    chosenCard: null,
    skipped: true
  };
  G.screen = 'reward';
  Sound.play('gold');
}

function renderReward() {
  const r = G.reward;
  if (!r) return '';
  const relicBlock = r.relic ? '<div class="relic-reveal"><div class="relic-icon-lg">' + icon(r.relic.icon) + '</div><div><h3>' + escapeHTML(r.relic.name) + '</h3><p>' + escapeHTML(r.relic.desc) + '</p></div></div>' : '';
  const summary = '<div class="reward-summary">' +
    '<div class="reward-item">' + icon('coin') + '<div class="meta"><small>金币</small><b>+' + r.gold + '</b></div></div>' +
    (r.relic ? '<div class="reward-item">' + icon('spark') + '<div class="meta"><small>遗物</small><b>' + escapeHTML(r.relic.name) + '</b></div></div>' : '') +
    (r.chosenCard ? '<div class="reward-item">' + icon('deck') + '<div class="meta"><small>新卡牌</small><b>' + escapeHTML(cardName(r.chosenCard)) + '</b></div></div>' : '') +
  '</div>';
  let cardBlock = '';
  if (!r.cardChosen && r.cards.length) {
    cardBlock = '<div class="eyebrow" style="text-align:center;margin-bottom:4px">CHOOSE ONE CARD</div>' +
      '<div class="reward-cards">' + r.cards.map((card, i) =>
        '<div class="reward-card-wrap">' + cardMarkup(card, { act: 'reward-pick', index: i, ariaLabel: '选择 ' + cardName(card) }) + '<span class="take-label">点击收入牌组</span></div>'
      ).join('') + '</div>' +
      '<div class="reward-actions"><button class="btn btn-ghost" data-act="reward-skip">跳过卡牌奖励</button></div>';
  } else if (r.chosenCard) {
    cardBlock = '<div class="reward-cards"><div class="reward-card-wrap">' + cardMarkup(r.chosenCard) + '<span class="take-label">已加入牌组</span></div></div>' +
      '<div class="reward-actions"><button class="btn btn-primary" data-act="reward-continue">继续旅程</button></div>';
  } else {
    cardBlock = '<div class="reward-actions">' +
      (r.skipped && r.source !== 'treasure' ? '<span class="muted small" style="align-self:center">你跳过了卡牌奖励。</span>' : '') +
      '<button class="btn btn-primary" data-act="reward-continue">继续旅程</button></div>';
  }
  return '<div class="screen overlay-screen fade-up">' +
    '<div class="screen-head"><span class="eyebrow">SPOILS OF THE ASH</span><h1>' + escapeHTML(r.title) + '</h1><p>' + escapeHTML(r.subtitle) + '</p></div>' +
    '<div class="reward-panel">' + summary + relicBlock + cardBlock + '</div>' +
  '</div>';
}

/* ---------------------------------------------------------
   Rest
   --------------------------------------------------------- */
function renderRest() {
  const rest = G.restState;
  if (!rest) return '';
  const upgraded = G.run.deck.filter(c => c.upgraded).length;
  const canUpgrade = G.run.deck.some(upgradable);
  const canHeal = G.run.hp < G.run.maxHp;
  let body;
  if (rest.done) {
    body = '<div class="rest-result">' + rest.result + '</div><div class="reward-actions" style="margin-top:20px"><button class="btn btn-primary" data-act="rest-continue">继续旅程</button></div>';
  } else {
    body = '<div class="rest-options">' +
      '<button class="rest-card" data-act="' + (canHeal ? 'rest-heal' : 'noop') + '"' + (canHeal ? '' : ' disabled') + '><span class="hotkey">01</span>' + icon('campfire') + '<h3>休息</h3><p>' + (canHeal ? '回复最大生命值 30% 的生命' + (hasRelic('herb') ? '，治疗药草额外回复 15 点' : '') + '。' : '你的生命已经满了，不需要再休息。') + '</p></button>' +
      '<button class="rest-card" data-act="rest-upgrade"' + (canUpgrade ? '' : ' disabled') + '><span class="hotkey">02</span>' + icon('anvil') + '<h3>锻造</h3><p>选择一张牌进行永久升级。当前已有 ' + upgraded + ' 张牌完成升级。</p></button>' +
    '</div>';
  }
  return '<div class="screen overlay-screen fade-up">' +
    '<div class="screen-head"><span class="eyebrow">A MOMENT OF WARMTH</span><h1>营火</h1><p>火光照亮一小块地方。你可以在这里歇一会儿，或者把刀磨得更利。</p></div>' +
    '<div class="rest-layout"><div class="campfire-scene"><div class="stars"></div><div class="campfire"><div class="flame small"></div><div class="flame"></div><div class="logs"></div></div></div>' + body + '</div>' +
  '</div>';
}

function restHeal() {
  const r = G.restState;
  if (!r || r.done) return;
  if (G.run.hp >= G.run.maxHp) { showToast('生命已满，不需要休息。', 'danger'); return; }
  const amount = Math.ceil(G.run.maxHp * 0.3) + (hasRelic('herb') ? 15 : 0);
  const healed = healRun(amount);
  r.done = true;
  r.result = '你靠着火堆睡了一会儿。伤口在热气里发痒，<b>回复 ' + healed + ' 点生命</b>。<br>再次上路时，天还没有亮。';
  Sound.play('heal');
  render();
}

function restUpgrade() {
  const r = G.restState;
  if (!r || r.done) return;
  if (!G.run.deck.some(upgradable)) {
    showToast('牌组里没有可升级的牌。', 'danger');
    return;
  }
  openModal('upgrade');
}

/* ---------------------------------------------------------
   Shop
   --------------------------------------------------------- */
function generateShop() {
  const cardItems = rollCardChoices(4, false).map(card => ({ card, price: cardPrice(card), sold: false }));
  const owned = new Set(G.run.relics);
  const relicPool = Object.keys(RELIC_DEFS).filter(id => !owned.has(id) && !RELIC_DEFS[id].starter);
  const relicItems = shuffle(relicPool).slice(0, 2).map(id => ({ id, def: RELIC_DEFS[id], price: relicPrice(RELIC_DEFS[id]), sold: false }));
  const discount = hasRelic('merchant_badge') ? 0.75 : 1;
  return {
    cards: cardItems,
    relics: relicItems,
    removePrice: Math.max(5, Math.round(75 * discount / 5) * 5),
    healPrice: Math.max(5, Math.round(60 * discount / 5) * 5),
    removeUsed: false,
    healUsed: false
  };
}

function renderShop() {
  const shop = G.shop;
  if (!shop) return '';
  const cardItems = shop.cards.map((item, i) => {
    const canBuy = !item.sold && G.run.gold >= item.price;
    return '<button class="shop-card-item" type="button" data-act="' + (canBuy ? 'shop-buy-card' : 'noop') + '" data-index="' + i + '"' + (canBuy ? '' : ' disabled') + '>' +
      cardMarkup(item.card, { price: item.price, sold: item.sold }) + '</button>';
  }).join('');
  const relicItems = shop.relics.length ? shop.relics.map((item, i) => {
    const canBuy = !item.sold && G.run.gold >= item.price;
    return '<button class="shop-relic" data-act="' + (canBuy ? 'shop-buy-relic' : 'noop') + '" data-index="' + i + '"' + (canBuy ? '' : ' disabled') + '>' +
      '<span class="relic-chip">' + icon(item.def.icon) + '</span>' +
      '<span class="meta"><b>' + escapeHTML(item.def.name) + '</b><small>' + escapeHTML(item.def.desc) + '</small></span>' +
      '<span class="price">' + (item.sold ? '已售出' : item.price + ' 金币') + '</span></button>';
  }).join('') : '<p class="empty-note">商人摊开了空空的双手。</p>';
  const removeDisabled = shop.removeUsed || G.run.gold < shop.removePrice;
  const healDisabled = shop.healUsed || G.run.gold < shop.healPrice || G.run.hp >= G.run.maxHp;
  return '<div class="screen overlay-screen fade-up">' +
    '<div class="screen-head"><span class="eyebrow">A DEAL IN THE DARK</span><h1>灰烬商店</h1><p>商人从不问你来路，只问你带了多少金币。</p></div>' +
    '<div class="shop-layout">' +
      '<div class="merchant-line"><div class="merchant-sigil">商</div><p><b>“火会灭，债不会。”</b><br>随便看。买不起也可以摸一摸。</p><div class="shop-gold">' + icon('coin') + G.run.gold + '</div></div>' +
      '<div class="shop-section"><div class="shop-section-title"><h2>卡牌</h2><span>每张只有一份</span></div><div class="shop-grid">' + cardItems + '</div></div>' +
      '<div class="shop-section"><div class="shop-section-title"><h2>遗物</h2><span>带一件走吧</span></div><div class="shop-relics">' + relicItems + '</div></div>' +
      '<div class="shop-section"><div class="shop-section-title"><h2>服务</h2><span>有些东西可以买第二次</span></div><div class="services">' +
        '<button class="service-btn" data-act="' + (removeDisabled ? 'noop' : 'shop-remove') + '"' + (removeDisabled ? ' disabled' : '') + '>' + icon('trash') + '<span class="meta"><b>移除一张牌</b><small>' + (shop.removeUsed ? '本店已使用过' : '永久从牌组中移除') + '</small></span><span class="price">' + shop.removePrice + ' 金币</span></button>' +
        '<button class="service-btn" data-act="' + (healDisabled ? 'noop' : 'shop-heal') + '"' + (healDisabled ? ' disabled' : '') + '>' + icon('heart') + '<span class="meta"><b>喝一碗热汤</b><small>' + (shop.healUsed ? '本店已使用过' : '回复 30 点生命') + '</small></span><span class="price">' + shop.healPrice + ' 金币</span></button>' +
      '</div></div>' +
      '<div class="reward-actions" style="justify-content:flex-start"><button class="btn btn-ghost" data-act="shop-leave">离开商店</button></div>' +
    '</div>' +
  '</div>';
}

function buyShopCard(i) {
  const shop = G.shop;
  if (!shop) return;
  const item = shop.cards[i];
  if (!item || item.sold || G.run.gold < item.price) return;
  addGold(-item.price);
  item.sold = true;
  addCardToDeck(item.card.id);
  showToast('获得了 ' + cardName(item.card) + '。', 'good');
  Sound.play('gold');
  render();
}

function buyShopRelic(i) {
  const shop = G.shop;
  if (!shop) return;
  const item = shop.relics[i];
  if (!item || item.sold || G.run.gold < item.price) return;
  const before = G.run.gold;
  addGold(-item.price);
  const got = grantRelic(item.id);
  if (!got) {
    G.run.gold = before;
    showToast('这件遗物已经在你身上了。', 'danger');
    return;
  }
  item.sold = true;
  Sound.play('gold');
  render();
}

function buyShopHeal() {
  const shop = G.shop;
  if (!shop || shop.healUsed || G.run.gold < shop.healPrice || G.run.hp >= G.run.maxHp) return;
  addGold(-shop.healPrice);
  const healed = healRun(30);
  shop.healUsed = true;
  showToast('热汤下肚，回复 ' + healed + ' 点生命。', 'good');
  Sound.play('heal');
  render();
}

/* ---------------------------------------------------------
   Events
   --------------------------------------------------------- */
function startEvent() {
  const unseen = EVENTS.filter(e => !G.run.seenEvents.includes(e.id));
  const ev = pick(unseen.length ? unseen : EVENTS);
  if (!G.run.seenEvents.includes(ev.id)) G.run.seenEvents.push(ev.id);
  G.eventState = { id: ev.id, result: null };
  G.screen = 'event';
}

function renderEvent() {
  const state = G.eventState;
  if (!state) return '';
  const ev = EVENTS.find(e => e.id === state.id);
  if (!ev) return '';
  let body;
  if (state.result) {
    body = '<div class="event-result ' + (state.result.tone || '') + '">' + state.result.text + '</div>' +
      '<div class="reward-actions" style="margin-top:20px"><button class="btn btn-primary" data-act="event-continue">继续旅程</button></div>';
  } else {
    body = '<div class="event-options">' + ev.options.map((opt, i) => {
      const allowed = !opt.requires || opt.requires();
      return '<button class="event-option" data-act="' + (allowed ? 'event-option' : 'noop') + '" data-index="' + i + '"' + (allowed ? '' : ' disabled') + '>' +
        '<span class="num">' + (i + 1) + '</span><span class="meta"><b>' + opt.label + '</b><small>' + opt.hint + '</small></span>' +
        (allowed ? '<span class="tag">选择</span>' : '<span class="tag">条件不足</span>') + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="screen overlay-screen fade-up">' +
    '<div class="screen-head"><span class="eyebrow">' + escapeHTML(ev.kicker) + '</span><h1>' + escapeHTML(ev.title) + '</h1></div>' +
    '<div class="event-layout"><div class="event-illustration"><div class="event-glyph">' + escapeHTML(ev.glyph) + '</div></div>' +
    '<div class="event-body"><h2>' + escapeHTML(ev.title) + '</h2><p class="event-text">' + ev.text + '</p>' + body + '</div></div>' +
  '</div>';
}

function chooseEvent(index) {
  const state = G.eventState;
  if (!state || state.result) return;
  const ev = EVENTS.find(e => e.id === state.id);
  if (!ev) return;
  const opt = ev.options[index];
  if (!opt) return;
  if (opt.requires && !opt.requires()) { showToast('条件不足。', 'danger'); return; }
  const result = opt.effect();
  state.result = result || { text: '你继续赶路。', tone: '' };
  Sound.play('open');
  render();
}

/* ---------------------------------------------------------
   Run transitions and endings
   --------------------------------------------------------- */
function newRun() {
  clearFeedback();
  G.run = createRun();
  G.runToken++;
  G.screen = 'map';
  G.combat = null;
  G.reward = null;
  G.restState = null;
  G.shop = null;
  G.eventState = null;
  G.end = null;
  G.modal = null;
  Sound.init();
  Music.setScene('map');
  Music.onGesture();
  Sound.play('open');
  render();
  showToast('余烬在你掌中亮起。点击发光的「战斗」开始。', 'gold');
}

function backToTitle() {
  clearFeedback();
  G.screen = 'title';
  G.run = null;
  G.combat = null;
  G.reward = null;
  G.restState = null;
  G.shop = null;
  G.eventState = null;
  G.end = null;
  G.modal = null;
  render();
}

function startNode(id) {
  const accessible = accessibleNodeIds();
  if (!accessible.includes(id)) return;
  const node = nodeById(id);
  if (!node) return;
  clearFeedback();
  G.run.currentNode = id;
  G.run.path.push(id);
  node.visited = true;
  G.reward = null;
  G.restState = null;
  G.shop = null;
  G.eventState = null;
  Sound.play('open');
  if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
    startCombat(node);
    return;
  }
  if (node.type === 'treasure') openTreasure();
  else if (node.type === 'rest') {
    G.restState = { done: false, result: '' };
    G.screen = 'rest';
  } else if (node.type === 'shop') {
    G.shop = generateShop();
    G.screen = 'shop';
  } else if (node.type === 'event') {
    startEvent();
  }
  render();
}

function returnToMap() {
  G.screen = 'map';
  G.combat = null;
  G.reward = null;
  G.restState = null;
  G.shop = null;
  G.eventState = null;
  G.modal = null;
  render();
}

function finishRun(victory) {
  if (!G.run || G.screen === 'end') return;
  clearFeedback();
  const scoreInfo = saveBest(victory);
  G.end = {
    victory,
    score: scoreInfo.score,
    isNew: scoreInfo.isNew,
    depth: victory ? 11 : Math.max(1, runDepth()),
    stats: Object.assign({}, G.run.stats),
    gold: G.run.gold,
    maxHp: G.run.maxHp,
    deck: G.run.deck.length,
    relics: G.run.relics.length
  };
  G.screen = 'end';
  G.combat = null;
  G.reward = null;
  G.restState = null;
  G.shop = null;
  G.eventState = null;
  G.modal = null;
  render();
}

function renderEnd() {
  const e = G.end;
  if (!e) return '';
  const victory = e.victory;
  return '<div class="end-screen ' + (victory ? 'victory' : '') + '">' +
    '<div class="embers">' + emberParticles(victory ? 38 : 20) + '</div>' +
    '<div class="end-content">' +
      '<div class="end-glyph">' + (victory ? '王' : '烬') + '</div>' +
      '<div class="eyebrow">' + (victory ? 'THE THRONE IS COLD' : 'THE EMBER FADES') + '</div>' +
      '<h1 class="end-title">' + (victory ? '王座已熄' : '旅程终结') + '</h1>' +
      '<p class="end-sub">' + (victory
        ? '余烬之王倒下了。你坐在空荡荡的王座上，第一次听见没有火的安静。<br>灰烬之上，新的路正在长出来。'
        : '你的火在灰烬里熄灭了。但这条路上，还会有下一个拾烬者。') + '</p>' +
      '<div class="end-stats">' +
        '<div class="end-stat"><b>' + e.depth + '</b><small>抵达深度</small></div>' +
        '<div class="end-stat"><b>' + e.stats.kills + '</b><small>击败敌人</small></div>' +
        '<div class="end-stat"><b>' + e.stats.cardsPlayed + '</b><small>打出卡牌</small></div>' +
        '<div class="end-stat"><b>' + e.relics + '</b><small>收集遗物</small></div>' +
      '</div>' +
      '<div class="end-score">旅程评分 <b>' + e.score.toLocaleString('zh-CN') + '</b>' + (e.isNew ? '<span class="new-best">新纪录</span>' : '') + '</div>' +
      '<div class="end-actions"><button class="btn btn-primary" data-act="end-new-run">' + icon('flame') + '再次点燃</button><button class="btn btn-ghost" data-act="end-title">回到标题</button></div>' +
      '<div class="end-quote">“火会熄灭，路不会。”</div>' +
    '</div>' +
  '</div>';
}

/* ---------------------------------------------------------
   Actions
   --------------------------------------------------------- */
function upgradeCardByUid(uid) {
  const card = G.run ? G.run.deck.find(c => c.uid === uid) : null;
  if (!card || !upgradable(card)) return;
  card.upgraded = true;
  if (G.screen === 'rest' && G.restState) {
    G.restState.done = true;
    G.restState.result = '你在火边磨了很久。<b>' + cardName(card) + '</b> 被重新锻造，刃口映出火光。';
  }
  closeModal();
  Sound.play('block');
  render();
  showToast('已升级：' + cardName(card), 'good');
}

function removeCardByUid(uid) {
  const shop = G.shop;
  if (!shop || shop.removeUsed) return;
  if (G.run.gold < shop.removePrice) { showToast('金币不够。', 'danger'); return; }
  const idx = G.run.deck.findIndex(c => c.uid === uid);
  if (idx < 0) return;
  addGold(-shop.removePrice);
  const removed = G.run.deck.splice(idx, 1)[0];
  shop.removeUsed = true;
  closeModal();
  render();
  Sound.play('gold');
  showToast('已移除：' + cardName(removed), 'good');
}

function handleAction(act, el) {
  const index = el.dataset.index !== undefined ? parseInt(el.dataset.index, 10) : null;
  switch (act) {
    case 'new-run':
      newRun();
      break;
    case 'title':
    case 'end-title':
      backToTitle();
      break;
    case 'end-new-run':
      newRun();
      break;
    case 'help':
      openModal('help');
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'toggle-music':
      Music.toggle();
      render();
      break;
    case 'toggle-sound':
      Sound.toggle();
      render();
      break;
    case 'open-deck':
      if (G.run) openModal('deck');
      break;
    case 'open-pile':
      if (G.combat && el.dataset.pile) openModal('pile', { pile: el.dataset.pile });
      break;
    case 'node':
      if (el.dataset.node) startNode(el.dataset.node);
      break;
    case 'play-card':
      if (index !== null) playCard(index);
      break;
    case 'target-enemy': {
      const enemyIndex = el.dataset.enemy !== undefined ? parseInt(el.dataset.enemy, 10) : null;
      if (enemyIndex !== null && !Number.isNaN(enemyIndex)) targetEnemy(enemyIndex);
      break;
    }
    case 'cancel-target':
      cancelTargeting();
      break;
    case 'end-turn':
      endTurn();
      break;
    case 'reward-pick': {
      const r = G.reward;
      if (!r || r.cardChosen || !r.cards[index]) break;
      const card = r.cards[index];
      G.run.deck.push(card);
      r.cardChosen = true;
      r.chosenCard = card;
      r.cards = [];
      Sound.play('card');
      render();
      showToast('加入牌组：' + cardName(card), 'good');
      break;
    }
    case 'reward-skip': {
      const r = G.reward;
      if (!r || r.cardChosen) break;
      r.cardChosen = true;
      r.skipped = true;
      r.cards = [];
      render();
      break;
    }
    case 'reward-continue':
      returnToMap();
      break;
    case 'rest-heal':
      restHeal();
      break;
    case 'rest-upgrade':
      restUpgrade();
      break;
    case 'rest-continue':
      returnToMap();
      break;
    case 'shop-buy-card':
      if (index !== null) buyShopCard(index);
      break;
    case 'shop-buy-relic':
      if (index !== null) buyShopRelic(index);
      break;
    case 'shop-remove':
      if (G.shop && !G.shop.removeUsed && G.run.gold >= G.shop.removePrice) openModal('remove', { price: G.shop.removePrice });
      break;
    case 'shop-heal':
      buyShopHeal();
      break;
    case 'shop-leave':
      returnToMap();
      break;
    case 'upgrade-card':
      if (el.dataset.uid) upgradeCardByUid(el.dataset.uid);
      break;
    case 'remove-card':
      if (el.dataset.uid) removeCardByUid(el.dataset.uid);
      break;
    case 'event-option':
      if (index !== null) chooseEvent(index);
      break;
    case 'event-continue':
      returnToMap();
      break;
    case 'noop':
      break;
    default:
      break;
  }
}

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (!act || act === 'noop') return;
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
  if (act === 'close-modal' && el.classList.contains('modal-backdrop') && event.target !== el) return;
  Sound.init();
  if (act !== 'toggle-music' && act !== 'new-run' && act !== 'end-new-run') Music.onGesture();
  if (act !== 'play-card' && act !== 'target-enemy' && act !== 'end-turn' && act !== 'toggle-sound' && act !== 'toggle-music') {
    Sound.play('click');
  }
  handleAction(act, el);
});

document.addEventListener('keydown', (event) => {
  const tag = (event.target && event.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (event.key === 'Escape') {
    if (G.modal) { closeModal(); return; }
    if (G.screen === 'combat' && G.combat && G.combat.selectedCard !== null) cancelTargeting();
    return;
  }
  if (G.modal) return;
  if (G.screen === 'combat' && G.combat && !G.combat.busy && !G.combat.over) {
    const key = event.key.toLowerCase();
    if (key === 'e') {
      event.preventDefault();
      endTurn();
      return;
    }
    const n = parseInt(event.key, 10);
    if (n >= 1 && n <= 9) {
      const idx = n - 1;
      if (G.combat.hand[idx]) {
        event.preventDefault();
        playCard(idx);
      }
    }
  } else if (G.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    newRun();
  }
});

/* ---------------------------------------------------------
   Boot
   --------------------------------------------------------- */
render();

// A small debug/testing surface. Handy for poking at a run from the console.
window.Emberpath = {
  G,
  Music,
  Sound,
  CARD_DEFS,
  RELIC_DEFS,
  ENEMY_DEFS,
  EVENTS,
  grantRelic,
  newRun,
  startNode,
  startCombat,
  playCard,
  targetEnemy,
  endTurn,
  render,
  openTreasure,
  generateShop,
  startEvent,
  chooseEvent,
  finishRun,
  finishCombat,
  checkVictory,
  dealDamageToEnemy,
  openModal,
  closeModal,
  get state() { return G; },
  get combat() { return G.combat; },
  get run() { return G.run; }
};

})();

