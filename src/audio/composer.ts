/**
 * Generative score — PURE and seeded (no Web Audio here, so it is unit-testable).
 *
 * Musical design for long, fatigue-free listening:
 * - Song form per cycle (intro → A A B A, with a sparse "breather" section every few cycles),
 *   several progression variants per section, light reharmonisation (tritone subs, 6/9 ↔ maj9),
 *   occasional key changes at cycle boundaries and a tiny tempo/swing drift.
 * - Smooth voice-leading (each chord voiced to move as little as possible from the last).
 * - Melodies built from short motifs that repeat with variation (call → rest → varied call → resolve),
 *   snapped to chord tones on strong beats and avoiding minor-9th clashes.
 * - Gentle dynamics: section energy + 8-bar phrase swell + small humanised timing/velocity.
 */
import { seededRandom } from './kit';
import type { MusicMoodId } from './moods';

export type Instrument =
  | 'keys'
  | 'pad'
  | 'pluck'
  | 'lead'
  | 'bass'
  | 'brush'
  | 'sweep'
  | 'ride'
  | 'kick'
  | 'rim'
  | 'shaker'
  | 'clink'
  | 'crackle';

export type Section = 'intro' | 'A' | 'B' | 'break';

export interface NoteEvent {
  inst: Instrument;
  /** Position in beats from the bar start (straight grid; swing is applied by the synth). */
  beat: number;
  /** Length in beats. */
  dur: number;
  /** MIDI note (0 for unpitched). */
  midi: number;
  /** 0..1 (already includes section energy). */
  vel: number;
}

export interface BarPlan {
  index: number;
  cycle: number;
  section: Section;
  barInSection: number;
  sectionLength: number;
  /** Chord symbols in this bar (concert pitch). */
  chords: string[];
  key: number;
  bpm: number;
  swing: number;
  beats: number;
  energy: number;
  events: NoteEvent[];
}

type CompStyle = 'swing' | 'pad' | 'stabs' | 'bossa' | 'ballad' | 'bright';
type BassStyle = 'walk' | 'pedal' | 'groove' | 'bossa' | 'two' | 'ballad';
type DrumStyle = 'brushes' | 'none' | 'groove' | 'bossa' | 'ballad' | 'bright';

export interface MoodSpec {
  bpm: number;
  swing: number;
  /** Home key as a pitch-class offset from C (progressions are written in C). */
  home: number;
  keyShifts: number[];
  progressions: Record<Section, string[][]>;
  form: Section[];
  breakEvery: number;
  comp: CompStyle;
  bass: BassStyle;
  drums: DrumStyle;
  melodyDensity: number;
  melodyRegister: [number, number];
  energy: Record<Section, number>;
  clinkChance: number;
  crackle: boolean;
}

export const MOOD_SPECS: Record<MusicMoodId, MoodSpec> = {
  cafe: {
    bpm: 80,
    swing: 0.62,
    home: 5,
    keyShifts: [0, 0, 5, -2, 3],
    progressions: {
      intro: [['Cmaj9', 'A7b9', 'Dm9', 'G13']],
      A: [
        ['Dm9', 'G13', 'Cmaj9', 'A7b9', 'Dm9', 'G13', 'Em7', 'A7b9'],
        ['Dm9', 'G9', 'Em7', 'A7b9', 'Dm9', 'G13', 'Cmaj9', 'C6/9'],
        ['Fmaj9', 'Bb13', 'Em7', 'A7b9', 'Dm9', 'G13', 'Cmaj9', 'G13sus'],
      ],
      B: [
        ['Gm9', 'C13', 'Fmaj9', 'Fmaj9', 'Fm9', 'Bb13', 'Em7', 'A7b9'],
        ['Bm7b5', 'E7b9', 'Am9', 'Am9', 'Dm9', 'G13', 'Em7', 'A7b9'],
        ['Fmaj9', 'E7alt', 'Am9', 'D9', 'Dm9', 'G13', 'Cmaj9', 'G13sus'],
      ],
      break: [['Fmaj9', 'Em7', 'Dm9', 'G13sus']],
    },
    form: ['A', 'A', 'B', 'A'],
    breakEvery: 2,
    comp: 'swing',
    bass: 'walk',
    drums: 'brushes',
    melodyDensity: 0.5,
    melodyRegister: [65, 84],
    energy: { intro: 0.55, A: 0.8, B: 0.92, break: 0.5 },
    clinkChance: 0.03,
    crackle: false,
  },
  focus: {
    bpm: 60,
    swing: 0.5,
    home: 2,
    keyShifts: [0, 0, -3, 5],
    progressions: {
      intro: [['Cmaj9', 'Cmaj9', 'Fmaj7#11', 'Fmaj7#11']],
      A: [
        ['Cmaj9', 'Cmaj9', 'Am11', 'Am11', 'Fmaj9', 'Fmaj9', 'G13sus', 'G13sus'],
        ['Cmaj9', 'Cmaj9', 'Em7', 'Em7', 'Fmaj7#11', 'Fmaj7#11', 'Dm9', 'G13sus'],
        ['Fmaj9', 'Fmaj9', 'Cmaj9', 'Cmaj9', 'Am11', 'Am11', 'G13sus', 'G13sus'],
      ],
      B: [
        ['Am9', 'Am9', 'Fmaj9', 'Fmaj9', 'Dm9', 'Dm9', 'Em7', 'Em7'],
        ['Dm9', 'Dm9', 'Em7', 'Em7', 'Fmaj9', 'Fmaj9', 'G13sus', 'G13sus'],
      ],
      break: [['Fmaj9', 'Fmaj9', 'Cmaj9', 'Cmaj9']],
    },
    form: ['A', 'B', 'A', 'A'],
    breakEvery: 2,
    comp: 'pad',
    bass: 'pedal',
    drums: 'none',
    melodyDensity: 0.22,
    melodyRegister: [62, 81],
    energy: { intro: 0.5, A: 0.66, B: 0.72, break: 0.45 },
    clinkChance: 0,
    crackle: false,
  },
  lab: {
    bpm: 90,
    swing: 0.56,
    home: 0,
    keyShifts: [0, 0, 2, -2],
    progressions: {
      intro: [['Am9', 'Am9', 'Fmaj9', 'E7sus']],
      A: [
        ['Am9', 'D9', 'Gmaj9', 'Cmaj9', 'Fmaj7', 'Bm7b5', 'E7sus', 'E7b9'],
        ['Am9', 'Am9', 'D9', 'D9', 'Fmaj9', 'Fmaj9', 'E7sus', 'E7alt'],
        ['Dm9', 'G13', 'Cmaj9', 'Fmaj9', 'Bm7b5', 'E7b9', 'Am9', 'Am9'],
      ],
      B: [
        ['Fmaj9', 'G13sus', 'Em7', 'Am9', 'Dm9', 'G13', 'Cmaj9', 'E7b9'],
        ['Dm9', 'Em7', 'Fmaj9', 'G13sus', 'Fmaj9', 'Em7', 'Dm9', 'E7alt'],
      ],
      break: [['Am9', 'Fmaj9', 'Dm9', 'E7sus']],
    },
    form: ['A', 'A', 'B', 'A'],
    breakEvery: 2,
    comp: 'stabs',
    bass: 'groove',
    drums: 'groove',
    melodyDensity: 0.55,
    melodyRegister: [64, 84],
    energy: { intro: 0.6, A: 0.82, B: 0.9, break: 0.55 },
    clinkChance: 0,
    crackle: false,
  },
  bossa: {
    bpm: 128,
    swing: 0.5,
    home: 2,
    keyShifts: [0, 0, 5, -2],
    progressions: {
      intro: [['Cmaj9', 'Cmaj9', 'Fmaj7#11', 'Fmaj7#11']],
      A: [
        ['Cmaj9', 'Cmaj9', 'Am9', 'Am9', 'Dm9', 'G13', 'Cmaj9', 'A7b9'],
        ['Cmaj9', 'Fmaj7#11', 'Em7', 'A7b9', 'Dm9', 'G13', 'Cmaj9', 'C6/9'],
        ['Fmaj9', 'Fm6', 'Em7', 'A7b9', 'Dm9', 'Db7#11', 'Cmaj9', 'Cmaj9'],
      ],
      B: [
        ['Gm9', 'C13', 'Fmaj9', 'Fmaj9', 'Fm9', 'Bb13', 'Em7', 'A7b9'],
        ['Em7', 'A7b9', 'Dm9', 'G13', 'Em7', 'A7b9', 'Dm9', 'G13sus'],
      ],
      break: [['Cmaj9', 'Fmaj7#11', 'Cmaj9', 'Fmaj7#11']],
    },
    form: ['A', 'A', 'B', 'A'],
    breakEvery: 2,
    comp: 'bossa',
    bass: 'bossa',
    drums: 'bossa',
    melodyDensity: 0.34,
    melodyRegister: [67, 86],
    energy: { intro: 0.55, A: 0.78, B: 0.86, break: 0.5 },
    clinkChance: 0,
    crackle: false,
  },
  kissa: {
    bpm: 66,
    swing: 0.62,
    home: 3,
    keyShifts: [0, 0, -2, 5],
    progressions: {
      intro: [['Fmaj9', 'Em7 A7b9', 'Dm9', 'G13sus']],
      A: [
        ['Cmaj9', 'Bm7b5 E7b9', 'Am9', 'Gm9 C13', 'Fmaj9', 'Fm9 Bb13', 'Em7 A7b9', 'Dm9 G13'],
        ['Cmaj9', 'Am9 D9', 'Dm9 G13', 'Em7 A7b9', 'Dm9', 'G13sus G13', 'Cmaj9', 'Dm9 G13'],
        ['Em7', 'A7b9', 'Dm9', 'G13', 'Cmaj9 Am9', 'Dm9 G13', 'Cmaj9', 'C6/9'],
      ],
      B: [
        ['Fmaj9', 'Em7 A7b9', 'Dm9', 'Gm9 C13', 'Fmaj9', 'Fm9 Bb13', 'Em7 A7b9', 'Dm9 G13'],
        ['Am9', 'D9', 'Dm9', 'G13', 'Em7', 'A7b9', 'Dm9', 'G13sus'],
      ],
      break: [['Cmaj9', 'Fmaj7#11', 'Cmaj9', 'Fmaj7#11']],
    },
    form: ['A', 'A', 'B', 'A'],
    breakEvery: 2,
    comp: 'ballad',
    bass: 'ballad',
    drums: 'ballad',
    melodyDensity: 0.42,
    melodyRegister: [64, 84],
    energy: { intro: 0.5, A: 0.7, B: 0.78, break: 0.45 },
    clinkChance: 0,
    crackle: true,
  },
  bar: {
    bpm: 104,
    swing: 0.5,
    home: 7,
    keyShifts: [0, 0, 5, -2],
    progressions: {
      intro: [['Cmaj9', 'Fmaj9', 'Cmaj9', 'G13sus']],
      A: [
        ['Cmaj7', 'Am7', 'Dm7', 'G9', 'Cmaj7', 'Am7', 'Dm9', 'G13'],
        ['Cmaj9', 'Em7', 'Fmaj9', 'Fm6', 'Em7', 'A7b9', 'Dm9', 'G13'],
        ['Cmaj9', 'C9', 'Fmaj9', 'Fm6', 'Cmaj9', 'A7b9', 'Dm9', 'G13'],
      ],
      B: [
        ['Fmaj9', 'G13', 'Em7', 'Am9', 'Dm9', 'G13', 'Cmaj9', 'C6/9'],
        ['Am9', 'Em7', 'Fmaj9', 'Cmaj9', 'Dm9', 'Em7', 'Fmaj9', 'G13sus'],
      ],
      break: [['Fmaj9', 'Em7', 'Dm9', 'G13sus']],
    },
    form: ['A', 'A', 'B', 'A'],
    breakEvery: 2,
    comp: 'bright',
    bass: 'two',
    drums: 'bright',
    melodyDensity: 0.5,
    melodyRegister: [67, 86],
    energy: { intro: 0.6, A: 0.82, B: 0.9, break: 0.55 },
    clinkChance: 0.04,
    crackle: false,
  },
};

// ───────────────────────────── harmony ─────────────────────────────

/** Chord qualities → intervals above the root (rootless jazz voicings where idiomatic). */
const QUALITY: Record<string, number[]> = {
  maj7: [0, 4, 7, 11],
  maj9: [4, 7, 11, 14],
  '6/9': [4, 7, 9, 14],
  'maj7#11': [4, 7, 11, 18],
  m7: [0, 3, 7, 10],
  m9: [3, 7, 10, 14],
  m11: [3, 10, 14, 17],
  m6: [0, 3, 7, 9],
  m7b5: [0, 3, 6, 10],
  '7': [0, 4, 7, 10],
  '9': [4, 7, 10, 14],
  '13': [4, 10, 14, 21],
  '7b9': [4, 7, 10, 13],
  '7alt': [4, 10, 13, 15],
  '7#11': [4, 10, 14, 18],
  '7sus': [0, 5, 7, 10],
  '9sus': [5, 7, 10, 14],
  '13sus': [5, 10, 14, 21],
};

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const DOMINANT = new Set(['7', '9', '13', '7b9']);

export interface ParsedChord {
  root: number; // pitch class 0..11
  quality: string;
  /** Pitch classes of the voicing tones (rootless where idiomatic). */
  tones: number[];
  /** Pitch classes including the root (for melody snapping). */
  chordTones: number[];
}

export function parseChord(sym: string, transpose = 0): ParsedChord {
  const m = /^([A-G])([b#]?)(.*)$/.exec(sym.trim());
  if (!m) throw new Error(`Bad chord symbol: ${sym}`);
  const acc = m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0;
  const quality = m[3] || 'maj7';
  const iv = QUALITY[quality];
  if (!iv) throw new Error(`Unknown chord quality: ${quality}`);
  const root = (((LETTER[m[1]!]! + acc + transpose) % 12) + 12) % 12;
  const tones = [...new Set(iv.map((i) => (root + i) % 12))];
  const chordTones = [...new Set([root, ...tones])];
  return { root, quality, tones, chordTones };
}

const pcName = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function transposeSymbol(sym: string, semis: number): string {
  const c = parseChord(sym, semis);
  return `${pcName[c.root]}${c.quality}`;
}

/** Choose a voicing (MIDI notes) for pitch classes, moving minimally from `prev`. */
export function voiceLead(tones: number[], prev: number[] | null, lo = 50, hi = 76, random = Math.random): number[] {
  const candidates: number[][] = [];
  const n = tones.length;
  for (let r = 0; r < n; r++) {
    const rot = [...tones.slice(r), ...tones.slice(0, r)];
    for (let base = lo; base < lo + 12; base++) {
      if (base % 12 !== rot[0]) continue;
      const close: number[] = [base];
      for (let i = 1; i < n; i++) {
        let p = close[i - 1]! + 1;
        while (p % 12 !== rot[i]) p++;
        close.push(p);
      }
      if (close[n - 1]! <= hi) candidates.push(close);
      // drop-2 (second voice from top down an octave) for a more open sound
      if (n >= 4) {
        const d2 = [...close];
        d2[n - 2] = d2[n - 2]! - 12;
        d2.sort((a, b) => a - b);
        if (d2[0]! >= lo - 4 && d2[n - 1]! <= hi) candidates.push(d2);
      }
    }
  }
  if (candidates.length === 0) return tones.map((t) => 60 + t);
  const score = (c: number[]) => {
    const centre = c.reduce((a, b) => a + b, 0) / c.length;
    if (!prev) return Math.abs(centre - 62);
    const p = [...prev].sort((a, b) => a - b);
    let moved = 0;
    for (let i = 0; i < c.length; i++) moved += Math.abs(c[i]! - (p[Math.min(i, p.length - 1)] ?? 62));
    return moved + Math.abs(centre - 62) * 0.35 + random() * 0.8;
  };
  return candidates.reduce((best, c) => (score(c) < score(best) ? c : best));
}

function nearestPc(pc: number, near: number, lo: number, hi: number): number {
  let best = lo;
  let bestD = Infinity;
  for (let m = lo; m <= hi; m++) {
    if (((m % 12) + 12) % 12 !== pc) continue;
    const d = Math.abs(m - near);
    if (d < bestD) {
      bestD = d;
      best = m;
    }
  }
  return best;
}

// ───────────────────────────── composer ─────────────────────────────

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

interface QueuedBar {
  section: Section;
  chords: string[]; // concert pitch
  barInSection: number;
  sectionLength: number;
  cycle: number;
  key: number;
  sectionOrdinal: number; // how many times this section kind already appeared this cycle
}

interface Motif {
  notes: Array<{ beat: number; dur: number; step: number }>;
}

export class Composer {
  readonly mood: MusicMoodId;
  private spec: MoodSpec;
  private r: () => number;
  private queue: QueuedBar[] = [];
  private cycle = 0;
  private index = 0;
  private bpm: number;
  private swing: number;
  private lastVariant: Partial<Record<Section, number>> = {};
  private motifs: Partial<Record<Section, Motif>> = {};
  private prevVoicing: number[] | null = null;
  private prevBass = 43;
  private melodyPitch: number;
  private lastChordSym = '';
  private padAge = 0;

  constructor(mood: MusicMoodId, seed: number = Math.floor(Math.random() * 2 ** 31)) {
    this.mood = mood;
    this.spec = MOOD_SPECS[mood];
    this.r = seededRandom(seed);
    this.bpm = this.spec.bpm;
    this.swing = this.spec.swing;
    this.melodyPitch = Math.round((this.spec.melodyRegister[0] + this.spec.melodyRegister[1]) / 2);
  }

  private pick<T>(xs: readonly T[]): T {
    return xs[Math.floor(this.r() * xs.length)]!;
  }

  private buildCycle(): void {
    const s = this.spec;
    const sections: Section[] = [];
    if (this.cycle === 0) sections.push('intro');
    else if (this.cycle % s.breakEvery === 0) sections.push('break');
    sections.push(...s.form);

    // Key: mostly home, sometimes a related key for a whole cycle.
    const shift = this.cycle === 0 ? 0 : this.r() < 0.45 ? this.pick(s.keyShifts) : 0;
    const key = (((s.home + shift) % 12) + 12) % 12;
    // Tiny drift keeps the groove from feeling mechanical across cycles.
    this.bpm = s.bpm * (1 + (this.r() - 0.5) * 0.05);
    this.swing = s.swing > 0.5 ? Math.min(0.67, Math.max(0.55, s.swing + (this.r() - 0.5) * 0.04)) : 0.5;

    // Motifs: A's motif usually survives a cycle (recognisable tune), B gets a fresh one.
    if (!this.motifs.A || this.r() < 0.4) this.motifs.A = this.genMotif();
    this.motifs.B = this.genMotif();

    const seen: Partial<Record<Section, number>> = {};
    for (const sec of sections) {
      const variants = s.progressions[sec];
      let vi = Math.floor(this.r() * variants.length);
      if (variants.length > 1 && vi === this.lastVariant[sec]) vi = (vi + 1) % variants.length;
      this.lastVariant[sec] = vi;
      const prog = this.reharm(variants[vi]!);
      const ordinal = seen[sec] ?? 0;
      seen[sec] = ordinal + 1;
      prog.forEach((bar, i) => {
        this.queue.push({
          section: sec,
          chords: bar.split(' ').map((c) => transposeSymbol(c, key)),
          barInSection: i,
          sectionLength: prog.length,
          cycle: this.cycle,
          key,
          sectionOrdinal: ordinal,
        });
      });
    }
    this.cycle += 1;
  }

  /** Light reharmonisation: tritone substitutions and colour swaps. */
  private reharm(prog: string[]): string[] {
    return prog.map((bar) =>
      bar
        .split(' ')
        .map((sym) => {
          const c = parseChord(sym);
          if (DOMINANT.has(c.quality) && this.r() < 0.18) return `${pcName[(c.root + 6) % 12]}7#11`;
          if (c.quality === 'maj9' && this.r() < 0.15) return `${pcName[c.root]}6/9`;
          if (c.quality === '6/9' && this.r() < 0.3) return `${pcName[c.root]}maj9`;
          return sym;
        })
        .join(' '),
    );
  }

  private genMotif(): Motif {
    const count = Math.max(2, Math.min(7, Math.round(this.spec.melodyDensity * 7 + this.r() * 2)));
    const grid = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
    const weight = (b: number) => (b % 2 === 0 ? 3 : b % 1 === 0 ? 2 : 1.2);
    const chosen = new Set<number>();
    let guard = 0;
    while (chosen.size < count && guard++ < 100) {
      const total = grid.reduce((a, b) => a + weight(b), 0);
      let x = this.r() * total;
      for (const b of grid) {
        x -= weight(b);
        if (x <= 0) {
          chosen.add(b);
          break;
        }
      }
    }
    const beats = [...chosen].sort((a, b) => a - b);
    const steps = [-2, -1, -1, 1, 1, 2];
    let height = 0;
    return {
      notes: beats.map((beat, i) => {
        const next = beats[i + 1] ?? beat + 1.5;
        let step = i === 0 ? 0 : this.pick(steps);
        if (i > 0 && this.r() < 0.1) step = this.r() < 0.5 ? 3 : -3;
        if (Math.abs(height + step) > 4) step = -step; // stay near home
        height += step;
        return { beat, dur: Math.min(1.5, Math.max(0.4, next - beat - 0.1)), step };
      }),
    };
  }

  private ensureQueue(n: number): void {
    while (this.queue.length < n) this.buildCycle();
  }

  /** Compose the next bar. */
  nextBar(): BarPlan {
    this.ensureQueue(2);
    const q = this.queue.shift()!;
    const next = this.queue[0]!;
    const s = this.spec;
    const r = this.r;
    const events: NoteEvent[] = [];
    const L = q.sectionLength;

    // Dynamics: section energy × phrase swell × small randomness.
    const phase = L > 1 ? q.barInSection / (L - 1) : 0;
    let energy = s.energy[q.section] * (0.93 + 0.07 * Math.sin(Math.PI * phase)) * (0.97 + r() * 0.06);
    if (q.section === 'intro') energy *= 0.85 + 0.15 * phase;
    energy = Math.min(1, energy);
    const hum = () => (r() - 0.5) * 0.02;
    const vel = (v: number) => Math.min(1, Math.max(0.05, v * energy * (0.9 + r() * 0.2)));
    const sparse = q.section === 'intro' || q.section === 'break';

    const chordSpans = q.chords.map((sym, i) => ({ sym, start: i * (4 / q.chords.length), len: 4 / q.chords.length }));
    const parsed = chordSpans.map((c) => ({ ...c, chord: parseChord(c.sym) }));
    const voicings = parsed.map((p) => {
      const v = voiceLead(p.chord.tones, this.prevVoicing, 50, 76, r);
      this.prevVoicing = v;
      return v;
    });
    const nextRoot = parseChord(next.chords[0]!).root;

    // ── comping ──
    const keysInst: Instrument = s.comp === 'bossa' ? 'pluck' : s.comp === 'pad' ? 'pad' : 'keys';
    const hitChord = (vi: number, beat: number, dur: number, v: number, strum = 0.012) =>
      voicings[vi]!.forEach((m, i) =>
        events.push({ inst: keysInst, beat: Math.max(0, beat + i * strum + hum()), dur, midi: m, vel: vel(v * (i === 0 ? 1 : 0.88)) }),
      );

    parsed.forEach((p, vi) => {
      const { start, len } = p;
      if (s.comp === 'pad') {
        const changed = p.sym !== this.lastChordSym || this.padAge >= 2;
        this.padAge = changed ? 1 : this.padAge + 1;
        if (changed) {
          const sustain = next.chords[0] === p.sym && q.chords.length === 1 ? len + 4.5 : len + 0.5;
          hitChord(vi, start, sustain, 0.9, 0.05);
        }
        if (!sparse && r() < 0.25) {
          const top = voicings[vi]![voicings[vi]!.length - 1]! + 12;
          events.push({ inst: 'keys', beat: start + 2 + hum(), dur: 1.5, midi: top, vel: vel(0.45) });
        }
      } else if (q.chords.length > 1 || sparse) {
        // Split bars and sparse sections (intro/breather): vary the gesture so no two are identical.
        const roll = r();
        if ((s.comp === 'ballad' || sparse) && roll < 0.45) {
          const step = len >= 4 ? 0.5 : 0.33;
          voicings[vi]!.forEach((m, i) =>
            events.push({ inst: keysInst, beat: start + i * step + hum(), dur: len - i * step, midi: m, vel: vel(0.75) }),
          );
        } else if (sparse && roll < 0.75) {
          hitChord(vi, start, len * 0.45, 0.85);
          hitChord(vi, start + len * (r() < 0.5 ? 0.5 : 0.625), len * 0.35, 0.6);
        } else hitChord(vi, start, len * 0.85, 0.9);
      } else {
        const pools: Record<Exclude<CompStyle, 'pad'>, Array<Array<[number, number, number]>>> = {
          swing: [
            [[0, 2.5, 1]],
            [
              [0, 1.4, 1],
              [1.5, 1.8, 0.75],
            ],
            [
              [0, 0.9, 0.95],
              [2.5, 1.2, 0.8],
            ],
            [
              [1.5, 1.4, 0.85],
              [3.5, 0.5, 0.65],
            ],
          ],
          stabs: [
            [
              [0, 0.6, 1],
              [1.5, 0.4, 0.8],
              [3, 0.4, 0.75],
            ],
            [
              [0, 0.5, 1],
              [2.5, 0.5, 0.8],
            ],
            [
              [0.5, 0.4, 0.85],
              [2, 0.6, 0.9],
              [3.5, 0.4, 0.7],
            ],
          ],
          bossa:
            q.barInSection % 2 === 0
              ? [
                  [
                    [0, 0.9, 1],
                    [1.5, 0.8, 0.85],
                    [2.5, 0.9, 0.8],
                  ],
                ]
              : [
                  [
                    [0.5, 0.8, 0.85],
                    [1.5, 0.9, 0.8],
                    [3, 0.9, 0.85],
                  ],
                ],
          ballad: [
            [[0, 3.5, 1]],
            [
              [0, 1.8, 1],
              [2.5, 1.4, 0.7],
            ],
          ],
          bright: [
            [
              [0, 1.5, 1],
              [2, 1, 0.8],
              [3.5, 0.5, 0.7],
            ],
            [
              [0, 0.5, 0.9],
              [1.5, 1, 0.85],
              [3, 1, 0.8],
            ],
            [
              [0, 2, 1],
              [2.5, 1.5, 0.8],
            ],
          ],
        };
        const style = s.comp as Exclude<CompStyle, 'pad'>;
        const pattern = this.pick(pools[style]);
        if (style === 'ballad' && r() < 0.5) {
          voicings[vi]!.forEach((m, i) =>
            events.push({ inst: 'keys', beat: i * 0.4 + hum(), dur: 4 - i * 0.4, midi: m, vel: vel(0.72) }),
          );
        } else {
          for (const [b, d, v] of pattern) hitChord(vi, b, d, v, style === 'bossa' ? 0.03 : 0.012);
        }
      }
      this.lastChordSym = p.sym;
    });

    // ── bass ──
    const bassNote = (pc: number) => {
      const m = nearestPc(pc, this.prevBass, 36, 52);
      this.prevBass = m;
      return m;
    };
    const fifth = (root: number) => nearestPc((root + 7) % 12, this.prevBass, 36, 52);
    const pushBass = (beat: number, dur: number, midi: number, v: number) =>
      events.push({ inst: 'bass', beat: Math.max(0, beat + hum() * 0.5), dur, midi, vel: vel(v) });

    if (s.bass === 'pedal') {
      parsed.forEach((p) => {
        if (p.start === 0 && (q.barInSection % 2 === 0 || q.chords.length > 1)) pushBass(p.start, 7, bassNote(p.chord.root), 0.8);
      });
    } else if (s.bass === 'walk' && !sparse) {
      if (parsed.length === 1) {
        const c = parsed[0]!.chord;
        const root = bassNote(c.root);
        const third = c.chordTones.includes((c.root + 3) % 12) ? 3 : 4;
        const n2 = nearestPc((c.root + third) % 12, root + 3, 36, 55);
        const n3 = nearestPc((c.root + 7) % 12, n2 + 2, 36, 55);
        const target = nearestPc(nextRoot, n3, 36, 52);
        const approach = target + (r() < 0.5 ? 1 : -1);
        [root, n2, n3, approach].forEach((m, i) => pushBass(i, 0.95, m, i === 0 ? 0.9 : 0.75));
        this.prevBass = approach;
      } else {
        parsed.forEach((p) => {
          const root = bassNote(p.chord.root);
          pushBass(p.start, 0.95, root, 0.9);
          pushBass(p.start + 1, 0.95, fifth(p.chord.root), 0.75);
        });
      }
    } else if (s.bass === 'two' || s.bass === 'ballad' || (s.bass === 'walk' && sparse)) {
      parsed.forEach((p) => {
        const root = bassNote(p.chord.root);
        pushBass(p.start, 1.8, root, 0.85);
        if (p.len >= 4) pushBass(2, 1.8, r() < 0.6 ? fifth(p.chord.root) : root, 0.7);
      });
      if (s.bass === 'two' && !sparse && r() < 0.3) pushBass(3.5, 0.45, nearestPc(nextRoot, this.prevBass, 36, 52) + 1, 0.55);
    } else if (s.bass === 'groove') {
      const c = parsed[0]!.chord;
      const root = bassNote(c.root);
      pushBass(0, 0.9, root, 0.9);
      if (!sparse) {
        pushBass(1.5, 0.4, root, 0.6);
        pushBass(2, 0.9, fifth(c.root), 0.75);
        if (r() < 0.6) pushBass(3.5, 0.4, nearestPc(nextRoot, root, 36, 52) - 1, 0.6);
      }
    } else if (s.bass === 'bossa') {
      const c = parsed[0]!.chord;
      const root = bassNote(c.root);
      const f = fifth(c.root);
      pushBass(0, 1.4, root, 0.85);
      pushBass(1.5, 0.45, f, 0.6);
      pushBass(2, 1.4, f, 0.75);
      pushBass(3.5, 0.45, nearestPc(nextRoot, root, 36, 52), 0.6);
    }

    // ── drums ──
    const lastBar = q.barInSection === L - 1;
    const drum = (inst: Instrument, beat: number, v: number, dur = 0.25) =>
      events.push({ inst, beat: Math.max(0, beat + hum() * 0.5), dur, midi: 0, vel: vel(v) });
    switch (s.drums) {
      case 'brushes':
        drum('brush', 1, 0.8);
        drum('brush', 3, 0.85);
        if (!sparse) {
          for (const b of [0, 1, 1.5, 2, 3, 3.5]) drum('ride', b, b % 1 === 0 ? 0.7 : 0.5);
          if (lastBar) drum('brush', 3.5, 0.6);
        }
        break;
      case 'ballad':
        drum('sweep', 0, 0.7, 2);
        drum('sweep', 2, 0.75, 2);
        if (!sparse) {
          drum('brush', 1, 0.45);
          drum('brush', 3, 0.5);
          if (r() < 0.5) drum('ride', 0, 0.35);
        }
        break;
      case 'groove':
        drum('kick', 0, 0.9);
        if (!sparse) {
          if (r() < 0.65) drum('kick', 2, 0.75);
          if (r() < 0.3) drum('kick', 2.5, 0.55);
          drum('rim', 1, 0.75);
          drum('rim', 3, 0.8);
          for (let b = 0; b < 4; b += 0.5) drum('shaker', b, b % 1 === 0 ? 0.4 : 0.6);
          if (lastBar) {
            drum('rim', 3.5, 0.55);
            drum('rim', 3.75, 0.45);
          }
        }
        break;
      case 'bossa': {
        drum('kick', 0, 0.6);
        drum('kick', 2, 0.7);
        const clave = q.barInSection % 2 === 0 ? [0, 1.5, 3] : [1, 2.5];
        if (!sparse) for (const b of clave) drum('rim', b, 0.65);
        for (let b = 0; b < 4; b += 0.5) drum('shaker', b, sparse ? 0.3 : b % 1 === 0 ? 0.35 : 0.55);
        break;
      }
      case 'bright':
        for (let b = 0; b < 4; b += 0.5) drum('shaker', b, b % 1 === 0 ? 0.35 : 0.55);
        if (!sparse) {
          drum('kick', 0, 0.55);
          drum('kick', 2, 0.5);
          drum('rim', 1, 0.5);
          drum('rim', 3, 0.55);
          if (lastBar) drum('rim', 3.5, 0.45);
        }
        break;
      default:
    }

    // ── melody (A/B only): call → (rest/echo) → varied call → resolution ──
    if (!sparse && (q.section === 'A' || q.section === 'B')) {
      const motif = this.motifs[q.section];
      const pairIdx = Math.floor(q.barInSection / 2); // 0..3 in an 8-bar section
      const play = pairIdx !== 1 || r() < 0.3;
      if (motif && play) {
        const half = (q.barInSection % 2) * 4;
        const offset = pairIdx === 2 ? 2 : q.sectionOrdinal === 1 ? 1 : 0;
        const [lo, hi] = s.melodyRegister;
        const density = Math.min(1, 0.55 + energy * 0.5);
        const notes = motif.notes.filter((n) => n.beat >= half && n.beat < half + 4);
        notes.forEach((n, i) => {
          if (r() > density) return;
          const beat = n.beat - half;
          const chord = parsed.find((p) => beat >= p.start && beat < p.start + p.len)?.chord ?? parsed[0]!.chord;
          let p = this.scaleStep(this.melodyPitch, n.step + (i === 0 && half === 0 ? offset : 0), q.key);
          if (beat % 2 === 0 || (pairIdx === 3 && i === notes.length - 1)) p = nearestPc(this.closestChordTone(p, chord), p, lo - 2, hi + 2);
          p = this.avoidClash(p, chord, q.key);
          while (p > hi) p -= 12;
          while (p < lo) p += 12;
          this.melodyPitch = p;
          const isLast = pairIdx === 3 && q.barInSection % 2 === 1 && i === notes.length - 1;
          events.push({ inst: 'lead', beat: Math.max(0, beat + hum()), dur: isLast ? 4 - beat : n.dur, midi: p, vel: vel(0.8) });
        });
      }
    }

    // ── ambience ──
    if (s.clinkChance > 0 && r() < s.clinkChance) events.push({ inst: 'clink', beat: r() * 3.5, dur: 0.5, midi: 0, vel: 0.5 + r() * 0.4 });
    if (s.crackle) {
      const n = 1 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) events.push({ inst: 'crackle', beat: r() * 4, dur: 0.01, midi: 0, vel: 0.3 + r() * 0.7 });
    }

    for (const e of events) if (e.beat < 0) e.beat = 0; // humanising never pushes before the bar line

    const plan: BarPlan = {
      index: this.index++,
      cycle: q.cycle,
      section: q.section,
      barInSection: q.barInSection,
      sectionLength: L,
      chords: q.chords,
      key: q.key,
      bpm: this.bpm,
      swing: this.swing,
      beats: 4,
      energy,
      events,
    };
    return plan;
  }

  private scaleStep(from: number, steps: number, key: number): number {
    const inScale = (m: number) => MAJOR.includes((((m - key) % 12) + 12) % 12);
    let p = from;
    while (!inScale(p)) p += 1;
    const dir = steps >= 0 ? 1 : -1;
    for (let k = 0; k < Math.abs(steps); k++) {
      p += dir;
      while (!inScale(p)) p += dir;
    }
    return p;
  }

  private closestChordTone(p: number, chord: ParsedChord): number {
    let best = chord.chordTones[0]!;
    let bestD = 99;
    for (const pc of chord.chordTones) {
      const d = Math.min(((p - pc) % 12 + 12) % 12, ((pc - p) % 12 + 12) % 12);
      if (d < bestD) {
        bestD = d;
        best = pc;
      }
    }
    return best;
  }

  /** Avoid a minor ninth above any chord tone (the classic "avoid note"). */
  private avoidClash(p: number, chord: ParsedChord, key: number): number {
    const clashes = (m: number) => chord.chordTones.some((c) => ((((m - c) % 12) + 12) % 12) === 1);
    if (!clashes(p)) return p;
    const down = this.scaleStep(p, -1, key);
    if (!clashes(down)) return down;
    const up = this.scaleStep(p, 1, key);
    return clashes(up) ? nearestPc(chord.chordTones[0]!, p, p - 6, p + 6) : up;
  }
}

/** Convenience for tests/QA: compose N bars. */
export function composeBars(mood: MusicMoodId, seed: number, bars: number): BarPlan[] {
  const c = new Composer(mood, seed);
  return Array.from({ length: bars }, () => c.nextBar());
}

/** Bar length in seconds. */
export function barSeconds(plan: Pick<BarPlan, 'beats' | 'bpm'>): number {
  return (plan.beats * 60) / plan.bpm;
}

/** Straight beat → seconds with swing applied to off-beat eighths. */
export function beatToSeconds(beat: number, bpm: number, swing: number): number {
  const i = Math.floor(beat);
  const f = beat - i;
  const sw = f < 0.5 ? f * (2 * swing) : swing + (f - 0.5) * (2 * (1 - swing));
  return ((i + sw) * 60) / bpm;
}
