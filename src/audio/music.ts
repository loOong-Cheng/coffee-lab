/**
 * Music synth: performs Composer bars with procedural instruments (FM electric piano,
 * warm pad, nylon-style pluck, vibes/flute leads, round bass, brushes & light percussion)
 * plus quiet ambience beds (café murmur, vinyl surface). Low CPU: notes are short-lived
 * nodes; scheduling is bar-by-bar with a look-ahead (live) or all-at-once (offline QA).
 */
import { Composer, barSeconds, beatToSeconds } from './composer';
import type { BarPlan, Instrument, NoteEvent } from './composer';
import { ceramic, envelope, midiToHz, noise, tone } from './kit';
import type { Kit } from './kit';
import type { MusicMoodId } from './moods';

type LeadTimbre = 'ep' | 'vibes' | 'flute';
type Bed = 'murmur' | 'vinyl' | 'none';

interface MoodSound {
  levels: Partial<Record<Instrument, number>>;
  lead: LeadTimbre;
  bed: Bed;
  /** Keys bus low-pass (warmth). */
  keysCutoff: number;
}

const BASE_LEVELS: Record<Instrument, number> = {
  keys: 0.1,
  pad: 0.05,
  pluck: 0.1,
  lead: 0.07,
  bass: 0.16,
  brush: 0.028,
  sweep: 0.016,
  ride: 0.011,
  kick: 0.11,
  rim: 0.045,
  shaker: 0.018,
  clink: 0.02,
  crackle: 0.018,
};

export const MOOD_SOUND: Record<MusicMoodId, MoodSound> = {
  cafe: { levels: { bass: 0.145 }, lead: 'ep', bed: 'murmur', keysCutoff: 2600 },
  focus: { levels: { keys: 0.06, pad: 0.06, bass: 0.12, lead: 0.06 }, lead: 'vibes', bed: 'none', keysCutoff: 1800 },
  lab: { levels: { keys: 0.11, lead: 0.075, bass: 0.12, kick: 0.08 }, lead: 'ep', bed: 'none', keysCutoff: 2900 },
  bossa: { levels: { lead: 0.05, rim: 0.04, kick: 0.09 }, lead: 'flute', bed: 'none', keysCutoff: 2400 },
  kissa: { levels: { keys: 0.1, lead: 0.06, bass: 0.15 }, lead: 'vibes', bed: 'vinyl', keysCutoff: 2000 },
  bar: { levels: { keys: 0.085, lead: 0.06, kick: 0.09 }, lead: 'vibes', bed: 'murmur', keysCutoff: 3200 },
};

const LOOKAHEAD = 1.0; // seconds of music scheduled ahead (bars are scheduled whole)
const TICK_MS = 150;
/** A mood switch starts the new mood this soon (s) instead of waiting for already-scheduled bars to run out. */
const SWITCH_GAP = 0.12;
/** Old-mood notes fade with this time constant (s): ~95 % quieter after ~0.4 s… */
const FADE_TC = 0.12;
/** …and their voice gains are detached from the instrument buses after this long (ms). */
const RETIRE_MS = 2500;

/**
 * Per-mood-segment voice gains, one per instrument bus. Notes connect here (not to the shared buses), so a mood
 * switch can fade out everything the old mood already scheduled ahead without touching the new mood's notes.
 */
interface Voices {
  keys: GainNode;
  lead: GainNode;
  bass: GainNode;
  drum: GainNode;
  amb: GainNode;
}

export class MusicGenerator {
  private kit: Kit;
  private keysBus: GainNode;
  private keysLp: BiquadFilterNode;
  private leadBus: GainNode;
  private bassBus: GainNode;
  private drumBus: GainNode;
  private ambBus: GainNode;
  private timer: ReturnType<typeof setInterval> | null = null;
  private moodId: MusicMoodId = 'cafe';
  private v: Voices;
  private composer: Composer | null = null;
  private nextBarTime = 0;
  private bed: { stop(at?: number): void } | null = null;
  private seed: number | undefined;

  constructor(kit: Kit, out: AudioNode, opts: { seed?: number } = {}) {
    this.kit = kit;
    this.seed = opts.seed;
    const { ctx } = kit;
    const send = (from: AudioNode, amount: number) => {
      const g = ctx.createGain();
      g.gain.value = amount;
      from.connect(g);
      g.connect(kit.reverb);
    };

    // Keys: warm low-pass + very slow auto-pan for a Rhodes-like shimmer.
    this.keysBus = ctx.createGain();
    this.keysLp = ctx.createBiquadFilter();
    this.keysLp.type = 'lowpass';
    this.keysLp.frequency.value = 2600;
    this.keysLp.Q.value = 0.3;
    this.keysBus.connect(this.keysLp);
    if (typeof ctx.createStereoPanner === 'function') {
      const pan = ctx.createStereoPanner();
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 0.15;
      depth.gain.value = 0.3;
      lfo.connect(depth);
      depth.connect(pan.pan);
      lfo.start();
      this.keysLp.connect(pan);
      pan.connect(out);
    } else {
      this.keysLp.connect(out);
    }
    send(this.keysLp, 0.6);

    this.leadBus = ctx.createGain();
    this.leadBus.connect(out);
    send(this.leadBus, 0.8);

    this.bassBus = ctx.createGain();
    const bassLp = ctx.createBiquadFilter();
    bassLp.type = 'lowpass';
    bassLp.frequency.value = 900;
    this.bassBus.connect(bassLp);
    bassLp.connect(out);

    this.drumBus = ctx.createGain();
    this.drumBus.connect(out);
    send(this.drumBus, 0.25);

    this.ambBus = ctx.createGain();
    this.ambBus.connect(out);
    send(this.ambBus, 0.5);

    this.v = this.newVoices();
  }

  get running(): boolean {
    return this.timer !== null;
  }

  /** The mood being played (or that will play on start). */
  get mood(): MusicMoodId {
    return this.moodId;
  }

  /**
   * Switch mood. While playing, the change is immediate: notes the old mood already scheduled ahead (up to a
   * second plus a whole bar, i.e. several seconds) fade out over ~0.4 s and the new mood starts ~0.1 s later.
   * The last call always wins, so switching away and straight back, or switching while stopped, plays the mood
   * chosen last. (Previously a deferred "pending" switch could survive both and play the wrong mood.)
   */
  setMood(m: MusicMoodId): void {
    if (!MOOD_SOUND[m]) return;
    if (!this.running) {
      this.moodId = m;
      this.composer = null;
      return;
    }
    if (m === this.moodId) return;
    const now = this.kit.ctx.currentTime;
    this.retire(this.v, now);
    this.v = this.newVoices();
    this.moodId = m;
    this.composer = new Composer(m, this.seed);
    this.nextBarTime = now + SWITCH_GAP;
    this.applyMoodSound(this.nextBarTime);
    this.tick();
  }

  private newVoices(): Voices {
    const { ctx } = this.kit;
    const voice = (to: AudioNode) => {
      const g = ctx.createGain();
      g.gain.value = 1;
      g.connect(to);
      return g;
    };
    return { keys: voice(this.keysBus), lead: voice(this.leadBus), bass: voice(this.bassBus), drum: voice(this.drumBus), amb: voice(this.ambBus) };
  }

  /** Fade a voice set to silence from `at`, then detach it (its already-scheduled notes end up going nowhere). */
  private retire(v: Voices, at: number): void {
    const gains = [v.keys, v.lead, v.bass, v.drum, v.amb];
    for (const g of gains) {
      try {
        g.gain.cancelScheduledValues(at);
        g.gain.setValueAtTime(1, at);
        g.gain.setTargetAtTime(0.0001, at, FADE_TC);
      } catch {
        /* never throw from music */
      }
    }
    setTimeout(() => {
      for (const g of gains) {
        try {
          g.disconnect();
        } catch {
          /* already gone */
        }
      }
    }, RETIRE_MS);
  }

  start(): void {
    if (this.timer) return;
    this.composer = new Composer(this.moodId, this.seed);
    this.applyMoodSound(this.kit.ctx.currentTime);
    this.nextBarTime = this.kit.ctx.currentTime + 0.12;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.bed?.stop();
    this.bed = null;
  }

  /** Offline / QA: schedule `seconds` of music starting at `t0` (no timers). Returns the bars played. */
  renderSpan(t0: number, seconds: number): BarPlan[] {
    this.composer = new Composer(this.moodId, this.seed);
    this.applyMoodSound(t0, t0 + seconds);
    const bars: BarPlan[] = [];
    let t = t0;
    while (t < t0 + seconds) {
      const plan = this.composer.nextBar();
      this.scheduleBar(plan, t, t0 + seconds);
      bars.push(plan);
      t += barSeconds(plan);
    }
    return bars;
  }

  private tick(): void {
    const { ctx } = this.kit;
    if (ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (this.nextBarTime < now) this.nextBarTime = now + 0.05; // recovered from a stall
    let guard = 0;
    while (this.nextBarTime < now + LOOKAHEAD && guard++ < 4) {
      if (!this.composer) this.composer = new Composer(this.moodId, this.seed);
      const plan = this.composer.nextBar();
      this.scheduleBar(plan, this.nextBarTime);
      this.nextBarTime += barSeconds(plan);
    }
  }

  private applyMoodSound(t: number, stopAt?: number): void {
    const ms = MOOD_SOUND[this.moodId];
    try {
      this.keysLp.frequency.setTargetAtTime(ms.keysCutoff, t, 0.5);
    } catch {
      this.keysLp.frequency.value = ms.keysCutoff;
    }
    this.bed?.stop(t);
    this.bed = ms.bed === 'none' ? null : this.startBed(ms.bed, t);
    if (this.bed && stopAt !== undefined) this.bed.stop(stopAt);
  }

  private level(inst: Instrument): number {
    return MOOD_SOUND[this.moodId].levels[inst] ?? BASE_LEVELS[inst];
  }

  private scheduleBar(plan: BarPlan, t: number, cutoff = Infinity): void {
    const spb = 60 / plan.bpm;
    for (const ev of plan.events) {
      const at = t + beatToSeconds(ev.beat, plan.bpm, plan.swing);
      if (at >= cutoff) continue;
      this.play(ev, at, ev.dur * spb);
    }
  }

  private play(ev: NoteEvent, t: number, durSec: number): void {
    const v = ev.vel * this.level(ev.inst);
    if (v <= 0) return;
    switch (ev.inst) {
      case 'keys':
        return this.ep(this.v.keys, ev.midi, t, durSec, v, 1.4);
      case 'pad':
        return this.pad(ev.midi, t, durSec, v);
      case 'pluck':
        return this.pluck(ev.midi, t, durSec, v);
      case 'lead':
        return this.lead(ev.midi, t, durSec, v);
      case 'bass':
        return this.bass(ev.midi, t, durSec, v);
      case 'brush':
        noise(this.kit, this.v.drum, { t, dur: 0.22, freq: 3200, q: 0.6, peak: v, attack: 0.025 });
        return;
      case 'sweep':
        noise(this.kit, this.v.drum, { t, dur: Math.max(0.3, durSec), freq: 2400, q: 0.5, peak: v, attack: durSec * 0.45 });
        return;
      case 'ride':
        noise(this.kit, this.v.drum, { t, dur: 0.09, type: 'highpass', freq: 7500, q: 0.4, peak: v });
        return;
      case 'kick':
        tone(this.kit, this.v.drum, { freq: 100, freqEnd: 45, t, attack: 0.004, decay: 0.24, peak: v });
        return;
      case 'rim':
        noise(this.kit, this.v.drum, { t, dur: 0.03, freq: 1900, q: 5, peak: v });
        tone(this.kit, this.v.drum, { freq: 820, t, attack: 0.001, decay: 0.02, peak: v * 0.5 });
        return;
      case 'shaker':
        noise(this.kit, this.v.drum, { t, dur: 0.07, type: 'highpass', freq: 5600, q: 0.6, peak: v, attack: 0.012 });
        return;
      case 'clink':
        ceramic(this.kit, this.v.amb, 2000 + this.kit.random() * 900, t, v, 0.3);
        return;
      case 'crackle':
        noise(this.kit, this.v.amb, { t, dur: 0.004, type: 'highpass', freq: 2200, q: 0.5, peak: v });
        return;
      default:
    }
  }

  /** FM electric piano: carrier + 1:1 modulator with a decaying index, plus a quiet tine. */
  private ep(dest: AudioNode, midi: number, t: number, dur: number, level: number, index: number): void {
    const { ctx } = this.kit;
    const f = midiToHz(midi);
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const amp = ctx.createGain();
    car.frequency.setValueAtTime(f, t);
    mod.frequency.setValueAtTime(f, t);
    modGain.gain.setValueAtTime(f * index, t);
    modGain.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.45);
    mod.connect(modGain);
    modGain.connect(car.frequency);
    const attack = 0.006;
    const release = Math.min(1.0, 0.3 + dur * 0.2);
    const decayEnd = t + Math.max(attack + 0.02, Math.min(dur, attack + 1.2));
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(level, t + attack);
    amp.gain.exponentialRampToValueAtTime(level * 0.35, decayEnd);
    amp.gain.setTargetAtTime(0.0001, decayEnd, release / 4);
    car.connect(amp);
    amp.connect(dest);
    const end = decayEnd + release + 0.1;
    car.start(t);
    mod.start(t);
    car.stop(end);
    mod.stop(end);
    tone(this.kit, dest, { freq: f * 4, t, attack: 0.002, decay: 0.1, peak: level * 0.07 });
  }

  private pad(midi: number, t: number, dur: number, level: number): void {
    const { ctx } = this.kit;
    const f = midiToHz(midi);
    const amp = ctx.createGain();
    const attack = Math.min(1.4, dur * 0.4);
    const release = 1.8;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(level, t + attack);
    amp.gain.setValueAtTime(level, t + Math.max(attack, dur - 0.05));
    amp.gain.setTargetAtTime(0.0001, t + Math.max(attack, dur), release / 4);
    amp.connect(this.v.keys);
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      o.detune.setValueAtTime(det, t);
      o.connect(amp);
      o.start(t);
      o.stop(t + Math.max(attack, dur) + release + 0.2);
    }
  }

  /** Nylon-string style pluck: bright attack that darkens quickly. */
  private pluck(midi: number, t: number, dur: number, level: number): void {
    const { ctx } = this.kit;
    const f = midiToHz(midi);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(Math.min(5000, f * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), t + 0.35);
    const amp = ctx.createGain();
    const decay = Math.min(1.8, Math.max(0.5, dur + 0.4));
    envelope(amp.gain, t, 0.003, level, decay);
    lp.connect(amp);
    amp.connect(this.v.keys);
    const a = ctx.createOscillator();
    a.type = 'sawtooth';
    a.frequency.setValueAtTime(f, t);
    const b = ctx.createOscillator();
    b.type = 'triangle';
    b.frequency.setValueAtTime(f, t);
    b.detune.setValueAtTime(4, t);
    const bg = ctx.createGain();
    bg.gain.value = 0.6;
    a.connect(lp);
    b.connect(bg);
    bg.connect(lp);
    const end = t + 0.003 + decay + 0.05;
    a.start(t);
    b.start(t);
    a.stop(end);
    b.stop(end);
  }

  private lead(midi: number, t: number, dur: number, level: number): void {
    const timbre = MOOD_SOUND[this.moodId].lead;
    if (timbre === 'ep') return this.ep(this.v.lead, midi, t, dur, level, 0.9);
    const { ctx } = this.kit;
    const f = midiToHz(midi);
    if (timbre === 'vibes') {
      // Soft mallet: fundamental + quiet 4th partial, long decay, gentle motor tremolo.
      const amp = ctx.createGain();
      envelope(amp.gain, t, 0.004, level, Math.max(1.2, dur + 0.8));
      const trem = ctx.createGain();
      trem.gain.value = 1;
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 4.8;
      depth.gain.value = 0.18;
      lfo.connect(depth);
      depth.connect(trem.gain);
      amp.connect(trem);
      trem.connect(this.v.lead);
      const end = t + Math.max(1.2, dur + 0.8) + 0.1;
      for (const [ratio, a] of [
        [1, 1],
        [4, 0.12],
      ] as const) {
        const o = ctx.createOscillator();
        o.frequency.setValueAtTime(f * ratio, t);
        const g = ctx.createGain();
        g.gain.value = a;
        o.connect(g);
        g.connect(amp);
        o.start(t);
        o.stop(end);
      }
      lfo.start(t);
      lfo.stop(end);
      return;
    }
    // Flute-like: soft attack, delayed vibrato, a breath of noise at the onset.
    const amp = ctx.createGain();
    const attack = 0.07;
    const hold = Math.max(0.15, dur - 0.05);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(level, t + attack);
    amp.gain.setValueAtTime(level * 0.9, t + hold);
    amp.gain.setTargetAtTime(0.0001, t + hold, 0.06);
    amp.connect(this.v.lead);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f, t);
    const lfo = ctx.createOscillator();
    const vib = ctx.createGain();
    lfo.frequency.value = 5.2;
    vib.gain.setValueAtTime(0, t);
    vib.gain.linearRampToValueAtTime(9, t + Math.min(0.5, hold)); // cents
    lfo.connect(vib);
    vib.connect(o.detune);
    const tri = ctx.createOscillator();
    tri.type = 'triangle';
    tri.frequency.setValueAtTime(f * 2, t);
    const tg = ctx.createGain();
    tg.gain.value = 0.08;
    tri.connect(tg);
    tg.connect(amp);
    o.connect(amp);
    const end = t + hold + 0.5;
    for (const x of [o, lfo, tri]) {
      x.start(t);
      x.stop(end);
    }
    noise(this.kit, this.v.lead, { t, dur: 0.09, freq: Math.min(8000, f * 3), q: 2, peak: level * 0.12, attack: 0.02 });
  }

  private bass(midi: number, t: number, dur: number, level: number): void {
    const { ctx } = this.kit;
    const f = midiToHz(midi);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1100, t);
    lp.frequency.exponentialRampToValueAtTime(420, t + 0.18);
    const amp = ctx.createGain();
    const hold = Math.max(0.12, dur * 0.92);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(level, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(level * 0.55, t + Math.min(hold, 0.6));
    amp.gain.setTargetAtTime(0.0001, t + hold, 0.06);
    lp.connect(amp);
    amp.connect(this.v.bass);
    const a = ctx.createOscillator();
    a.type = 'triangle';
    a.frequency.setValueAtTime(f, t);
    const b = ctx.createOscillator();
    b.frequency.setValueAtTime(f, t);
    a.connect(lp);
    b.connect(lp);
    const end = t + hold + 0.4;
    a.start(t);
    b.start(t);
    a.stop(end);
    b.stop(end);
  }

  /** Ambience beds: distant café murmur, or vinyl surface hiss for the listening-room mood. */
  private startBed(kind: Exclude<Bed, 'none'>, t: number): { stop(at?: number): void } {
    const { ctx } = this.kit;
    const src = ctx.createBufferSource();
    src.buffer = this.kit.noise;
    src.loop = true;
    const f1 = ctx.createBiquadFilter();
    const f2 = ctx.createBiquadFilter();
    const g = ctx.createGain();
    const swell = ctx.createGain();
    const l1 = ctx.createOscillator();
    const l2 = ctx.createOscillator();
    if (kind === 'murmur') {
      f1.type = 'lowpass';
      f1.frequency.value = 900;
      f2.type = 'bandpass';
      f2.frequency.value = 520;
      f2.Q.value = 0.8;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.setTargetAtTime(0.011, t, 1.5);
      swell.gain.value = 0.005;
      l1.frequency.value = 0.13;
      l2.frequency.value = 0.37;
    } else {
      f1.type = 'highpass';
      f1.frequency.value = 2500;
      f2.type = 'lowpass';
      f2.frequency.value = 9000;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.setTargetAtTime(0.0035, t, 1);
      swell.gain.value = 0.001;
      l1.frequency.value = 0.55; // record rotation (33⅓ rpm)
      l2.frequency.value = 0.2;
    }
    l1.connect(swell);
    l2.connect(swell);
    swell.connect(g.gain);
    src.connect(f1);
    f1.connect(f2);
    f2.connect(g);
    g.connect(this.v.amb);
    src.start(t, this.kit.random());
    l1.start(t);
    l2.start(t);
    let stopped = false;
    return {
      stop: (at?: number) => {
        if (stopped) return;
        stopped = true;
        const s = Math.max(at ?? ctx.currentTime, ctx.currentTime);
        try {
          g.gain.cancelScheduledValues(s);
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
