/**
 * Generative café music — original, procedural, endless, low-CPU.
 * A soft FM electric-piano comps through jazz progressions, a round bass walks,
 * brushes swish on 2 & 4, and (in the café mood) a distant murmur + rare cup clink.
 * Scheduling uses the classic look-ahead pattern (setInterval + AudioContext clock).
 */
import type { MusicMood } from './index';
import { bell, envelope, midiToHz, noise, tone } from './kit';
import type { Kit } from './kit';

interface Chord {
  root: number; // MIDI
  voicing: number[]; // MIDI, rootless
}

interface MoodSpec {
  bpm: number;
  swing: number; // 0.5 = straight, 0.66 = triplet swing
  barsPerChord: number;
  chords: Chord[];
  scale: number[]; // melody pitch pool (MIDI)
  melodyChance: number;
  drums: 'none' | 'brush' | 'brush-kick';
  bass: 'walk' | 'pedal' | 'groove';
  comp: 'swing' | 'pad' | 'stabs';
  murmur: boolean;
  epLevel: number;
}

const MOODS: Record<MusicMood, MoodSpec> = {
  // Warm F-major café jazz.
  cafe: {
    bpm: 78,
    swing: 0.64,
    barsPerChord: 1,
    chords: [
      { root: 43, voicing: [58, 62, 65, 69] }, // Gm9
      { root: 48, voicing: [58, 62, 64, 69] }, // C13
      { root: 41, voicing: [57, 60, 64, 67] }, // Fmaj9
      { root: 38, voicing: [53, 57, 60, 64] }, // Dm9
      { root: 46, voicing: [57, 60, 62, 65] }, // Bbmaj9
      { root: 45, voicing: [55, 60, 64, 67] }, // Am7
      { root: 43, voicing: [58, 62, 65, 69] }, // Gm9
      { root: 48, voicing: [58, 62, 65, 69] }, // C9sus
    ],
    scale: [65, 67, 69, 72, 74, 77, 79, 81],
    melodyChance: 0.16,
    drums: 'brush',
    bass: 'walk',
    comp: 'swing',
    murmur: true,
    epLevel: 0.11,
  },
  // Slow, spacious D-major pads for reading and quizzes.
  focus: {
    bpm: 62,
    swing: 0.5,
    barsPerChord: 2,
    chords: [
      { root: 38, voicing: [54, 57, 61, 64] }, // Dmaj9
      { root: 47, voicing: [54, 57, 62, 64] }, // Bm11
      { root: 43, voicing: [54, 57, 59, 62] }, // Gmaj9
      { root: 45, voicing: [55, 59, 62, 66] }, // A13sus
    ],
    scale: [66, 69, 71, 73, 74, 76, 78],
    melodyChance: 0.07,
    drums: 'none',
    bass: 'pedal',
    comp: 'pad',
    murmur: false,
    epLevel: 0.09,
  },
  // Playful A-minor groove for labs and simulations.
  lab: {
    bpm: 88,
    swing: 0.58,
    barsPerChord: 1,
    chords: [
      { root: 45, voicing: [55, 59, 60, 64] }, // Am9
      { root: 50, voicing: [54, 60, 64, 69] }, // D9
      { root: 43, voicing: [54, 57, 59, 62] }, // Gmaj9
      { root: 48, voicing: [52, 55, 59, 62] }, // Cmaj9
      { root: 41, voicing: [52, 57, 60, 64] }, // Fmaj7
      { root: 47, voicing: [50, 53, 57, 59] }, // Bm7b5
      { root: 40, voicing: [50, 57, 59, 64] }, // E7sus
      { root: 40, voicing: [50, 56, 59, 64] }, // E7
    ],
    scale: [69, 72, 74, 76, 79, 81, 84],
    melodyChance: 0.22,
    drums: 'brush-kick',
    bass: 'groove',
    comp: 'stabs',
    murmur: false,
    epLevel: 0.1,
  },
};

const LOOKAHEAD = 0.35; // seconds scheduled ahead
const TICK_MS = 100;

export class MusicGenerator {
  private kit: Kit;
  private out: AudioNode;
  private ep: GainNode;
  private timer: ReturnType<typeof setInterval> | null = null;
  private mood: MusicMood = 'cafe';
  private pendingMood: MusicMood | null = null;
  private step = 0; // eighth notes since start
  private nextTime = 0;
  private melodyNote = 0;
  private murmur: { stop(): void } | null = null;

  constructor(kit: Kit, out: AudioNode) {
    this.kit = kit;
    this.out = out;
    const { ctx } = kit;
    // EP bus: gentle low-pass + slow auto-pan for a Rhodes-like shimmer.
    this.ep = ctx.createGain();
    this.ep.gain.value = 1;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    lp.Q.value = 0.3;
    this.ep.connect(lp);
    if (typeof ctx.createStereoPanner === 'function') {
      const pan = ctx.createStereoPanner();
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 0.18;
      depth.gain.value = 0.35;
      lfo.connect(depth);
      depth.connect(pan.pan);
      lfo.start();
      lp.connect(pan);
      pan.connect(out);
    } else {
      lp.connect(out);
    }
    lp.connect(kit.reverb);
  }

  get running(): boolean {
    return this.timer !== null;
  }

  setMood(m: MusicMood): void {
    if (!MOODS[m] || m === this.mood) return;
    if (!this.running) {
      this.mood = m;
      return;
    }
    this.pendingMood = m; // switch on the next bar line
  }

  start(): void {
    if (this.timer) return;
    this.step = 0;
    this.nextTime = this.kit.ctx.currentTime + 0.12;
    this.melodyNote = MOODS[this.mood].scale[2] ?? 72;
    this.updateMurmur();
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.murmur?.stop();
    this.murmur = null;
  }

  private tick(): void {
    const { ctx } = this.kit;
    if (ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (this.nextTime < now) this.nextTime = now + 0.05; // recovered from a stall
    let guard = 0;
    while (this.nextTime < now + LOOKAHEAD && guard++ < 16) {
      this.schedule(this.step, this.nextTime);
      this.nextTime += this.eighthDuration(this.step);
      this.step += 1;
    }
  }

  private spec(): MoodSpec {
    return MOODS[this.mood];
  }

  private eighthDuration(step: number): number {
    const s = this.spec();
    const beat = 60 / s.bpm;
    // A pair of eighths fills one beat; swing lengthens the on-beat eighth.
    return (step % 2 === 0 ? s.swing : 1 - s.swing) * beat;
  }

  private schedule(step: number, t: number): void {
    const inBar = step % 8;
    if (inBar === 0 && this.pendingMood) {
      this.mood = this.pendingMood;
      this.pendingMood = null;
      this.updateMurmur();
    }
    const s = this.spec();
    const bar = Math.floor(step / 8);
    const chordIdx = Math.floor(bar / s.barsPerChord) % s.chords.length;
    const chord = s.chords[chordIdx]!;
    const next = s.chords[(chordIdx + 1) % s.chords.length]!;
    const beat = 60 / s.bpm;
    const firstBarOfChord = bar % s.barsPerChord === 0;

    // ── comping ──
    if (s.comp === 'pad') {
      if (inBar === 0 && firstBarOfChord) this.chord(chord.voicing, t, beat * 8 * s.barsPerChord, s.epLevel, 0.25);
    } else if (s.comp === 'swing') {
      if (inBar === 0) this.chord(chord.voicing, t, beat * 2.5, s.epLevel);
      else if (inBar === 3 && Math.random() < 0.55) this.chord(chord.voicing, t, beat * 0.9, s.epLevel * 0.7);
      else if (inBar === 6 && Math.random() < 0.3) this.chord(chord.voicing.slice(1), t, beat * 0.8, s.epLevel * 0.6);
    } else {
      if (inBar === 0) this.chord(chord.voicing, t, beat * 1.2, s.epLevel);
      else if ((inBar === 3 || inBar === 5) && Math.random() < 0.5) this.chord(chord.voicing, t, beat * 0.45, s.epLevel * 0.75);
    }

    // ── bass ──
    if (s.bass === 'pedal') {
      if (inBar === 0 && firstBarOfChord) this.bass(chord.root, t, beat * 6, 0.16);
    } else if (s.bass === 'walk') {
      if (inBar % 2 === 0) {
        const q = inBar / 2;
        const third = chord.voicing.some((v) => (((v - chord.root) % 12) + 12) % 12 === 3) ? 3 : 4;
        const pool = [chord.root, chord.root + third, chord.root + 7, next.root + (Math.random() < 0.5 ? 1 : -1)];
        const n = q === 0 ? chord.root : pool[q] ?? chord.root;
        this.bass(n, t, beat * 0.9, 0.17);
      }
    } else if (inBar === 0 || inBar === 3 || (inBar === 4 && Math.random() < 0.6) || (inBar === 7 && Math.random() < 0.35)) {
      this.bass(inBar === 7 ? next.root : inBar === 4 ? chord.root + 7 : chord.root, t, beat * 0.7, 0.16);
    }

    // ── drums ──
    if (s.drums !== 'none') {
      if (inBar === 2 || inBar === 6) this.brush(t, beat);
      if (inBar % 2 === 0 || Math.random() < 0.35) this.ride(t, inBar % 2 === 0 ? 0.012 : 0.007);
      if (s.drums === 'brush-kick' && (inBar === 0 || inBar === 4 || (inBar === 7 && Math.random() < 0.25))) this.kick(t);
    }

    // ── melody: sparse pentatonic random walk ──
    if (Math.random() < s.melodyChance && inBar !== 7) {
      const pool = s.scale;
      const i = pool.indexOf(this.melodyNote);
      const j = Math.min(pool.length - 1, Math.max(0, (i < 0 ? 2 : i) + Math.round((Math.random() - 0.5) * 3)));
      this.melodyNote = pool[j]!;
      this.note(this.melodyNote, t + (Math.random() * 0.015), beat * (Math.random() < 0.3 ? 1.5 : 0.7), s.epLevel * 0.85, 0.35);
    }

    // ── café texture: very rare cup clink ──
    if (s.murmur && inBar === 5 && Math.random() < 0.035) {
      const f = 2300 + Math.random() * 700;
      bell(this.kit, this.out, f, t, 0.018, 0.5, 0.5);
    }
  }

  private chord(voicing: number[], t: number, dur: number, level: number, attack = 0.006): void {
    voicing.forEach((m, i) => this.note(m, t + i * 0.008 + Math.random() * 0.01, dur, level * (i === 0 ? 0.9 : 0.8), attack));
  }

  /** FM electric-piano voice: carrier + 1:1 modulator with a decaying index, plus a quiet tine. */
  private note(midi: number, t: number, dur: number, level: number, attack = 0.006): void {
    const { ctx } = this.kit;
    const f = midiToHz(midi);
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const amp = ctx.createGain();
    car.frequency.setValueAtTime(f, t);
    mod.frequency.setValueAtTime(f, t);
    modGain.gain.setValueAtTime(f * 1.4, t);
    modGain.gain.exponentialRampToValueAtTime(f * 0.18, t + 0.45);
    mod.connect(modGain);
    modGain.connect(car.frequency);
    const release = Math.min(1.2, 0.35 + dur * 0.25);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(level, t + attack);
    const decayEnd = t + Math.max(attack + 0.02, Math.min(dur, attack + 1.1));
    amp.gain.exponentialRampToValueAtTime(level * 0.35, decayEnd);
    amp.gain.setTargetAtTime(0.0001, decayEnd, release / 4);
    car.connect(amp);
    amp.connect(this.ep);
    const end = decayEnd + release + 0.1;
    car.start(t);
    mod.start(t);
    car.stop(end);
    mod.stop(end);
    if (attack < 0.05) tone(this.kit, this.ep, { freq: f * 4, t, attack: 0.002, decay: 0.12, peak: level * 0.08 });
  }

  private bass(midi: number, t: number, dur: number, level: number): void {
    const { ctx } = this.kit;
    const f = midiToHz(midi);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(520, t);
    const g = ctx.createGain();
    envelope(g.gain, t, 0.012, level, dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.1);
    tone(this.kit, this.out, { freq: f, t, attack: 0.01, decay: dur, peak: level * 0.6 });
  }

  private brush(t: number, beat: number): void {
    noise(this.kit, this.out, { t, dur: beat * 0.55, freq: 3200, q: 0.6, peak: 0.028, attack: 0.03 });
  }

  private ride(t: number, peak: number): void {
    noise(this.kit, this.out, { t, dur: 0.07, type: 'highpass', freq: 7200, q: 0.4, peak });
  }

  private kick(t: number): void {
    tone(this.kit, this.out, { freq: 110, freqEnd: 48, t, attack: 0.004, decay: 0.22, peak: 0.13 });
  }

  /** Distant café murmur: band-limited noise with slow, irregular swells. */
  private updateMurmur(): void {
    const want = this.spec().murmur;
    if (!want) {
      this.murmur?.stop();
      this.murmur = null;
      return;
    }
    if (this.murmur) return;
    const { ctx } = this.kit;
    const src = ctx.createBufferSource();
    src.buffer = this.kit.noise;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 520;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0.012;
    const swell = ctx.createGain();
    swell.gain.value = 0.006;
    const l1 = ctx.createOscillator();
    const l2 = ctx.createOscillator();
    l1.frequency.value = 0.13;
    l2.frequency.value = 0.37;
    l1.connect(swell);
    l2.connect(swell);
    swell.connect(g.gain);
    src.connect(lp);
    lp.connect(bp);
    bp.connect(g);
    g.connect(this.out);
    const t = ctx.currentTime;
    src.start(t);
    l1.start(t);
    l2.start(t);
    this.murmur = {
      stop: () => {
        const s = ctx.currentTime;
        try {
          g.gain.setTargetAtTime(0.0001, s, 0.4);
          src.stop(s + 2);
          l1.stop(s + 2);
          l2.stop(s + 2);
        } catch {
          /* already stopped */
        }
      },
    };
  }
}
