/**
 * Procedural sound effects. Design rules: short, soft, warm. Success sounds are gentle
 * bells; "incorrect" is a quiet two-note "hmm" (never a buzzer). Coffee sounds are shaped
 * noise and resonances modelled on what you actually hear: a burr grinder dips in pitch
 * under load and rises when the beans run out; a pour rises in pitch as the cup fills;
 * steaming milk goes from hissy "tss-tss" stretching to a lower rolling roar.
 */
import type { SfxName } from './index';
import { bell, ceramic, envelope, midiToHz, noise, tone } from './kit';
import type { Kit } from './kit';

type Recipe = (k: Kit, out: AudioNode, t: number) => void;

const between = (k: Kit, a: number, b: number) => a + k.random() * (b - a);

function lowpass(k: Kit, out: AudioNode, t: number, freq: number): BiquadFilterNode {
  const f = k.ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(freq, t);
  f.connect(out);
  return f;
}

/** Amplitude-modulate a gain param with one or more LFOs (chatter, flutter). */
function modulate(k: Kit, target: AudioParam, t: number, end: number, rates: number[], depth: number, type: OscillatorType = 'sine'): void {
  const d = k.ctx.createGain();
  d.gain.setValueAtTime(depth, t);
  d.connect(target);
  for (const r of rates) {
    const o = k.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(r, t);
    o.connect(d);
    o.start(t);
    o.stop(end + 0.05);
  }
}

/** Liquid stream into a vessel: resonant band-passed noise whose pitch rises as it fills. */
function stream(k: Kit, out: AudioNode, t: number, dur: number, from: number, to: number, peak: number, q = 5): void {
  for (const [mult, amp] of [
    [1, 1],
    [2.1, 0.45],
  ] as const) {
    const src = k.ctx.createBufferSource();
    src.buffer = k.noise;
    src.loop = true;
    const bp = k.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(q, t);
    bp.frequency.setValueAtTime(from * mult, t);
    bp.frequency.exponentialRampToValueAtTime(to * mult, t + dur);
    const g = k.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak * amp, t + 0.08);
    g.gain.setValueAtTime(peak * amp, t + dur - 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(out);
    src.start(t, k.random());
    src.stop(t + dur + 0.05);
  }
}

function bubbles(k: Kit, out: AudioNode, t: number, dur: number, count: number, lo: number, hi: number, peak: number): void {
  const lp = lowpass(k, out, t, 3000);
  for (let i = 0; i < count; i++) {
    const at = t + between(k, 0.05, dur - 0.05);
    const f = between(k, lo, hi);
    tone(k, lp, { freq: f, freqEnd: f * between(k, 1.7, 2.5), t: at, attack: 0.003, decay: between(k, 0.025, 0.05), peak: between(k, peak * 0.5, peak) });
  }
}

function steamCore(k: Kit, out: AudioNode, t: number, dur: number, stretch: number): void {
  // Valve opening "pssh".
  noise(k, out, { t, dur: 0.16, type: 'highpass', freq: 1500, q: 0.7, peak: 0.12, attack: 0.01 });
  // Steady hiss.
  noise(k, out, { t, dur, type: 'highpass', freq: 3200, q: 0.5, peak: 0.07, attack: 0.15 });
  // Stretching: tearing-paper "tss-tss" (air drawn into the milk).
  const s = noise(k, out, { t: t + 0.12, dur: stretch, freq: 2600, q: 1.4, peak: 0.07, attack: 0.08 });
  modulate(k, s.gain, t + 0.12, t + 0.12 + stretch, [7.5], 0.05, 'square');
  // Texturing: lower rolling roar as the whirlpool forms.
  noise(k, out, { t: t + stretch * 0.8, dur: dur - stretch * 0.8, freq: 680, q: 0.8, peak: 0.08, attack: 0.3 });
  noise(k, out, { t: t + stretch * 0.8, dur: dur - stretch * 0.8, type: 'lowpass', freq: 260, q: 0.7, peak: 0.06, attack: 0.3 });
}

function glassTink(k: Kit, out: AudioNode, t: number, base: number, peak: number): void {
  ceramic(k, out, base, t, peak, 0.22);
  noise(k, out, { t, dur: 0.015, type: 'highpass', freq: 4000, q: 0.7, peak: peak * 0.4 });
}

export const SFX: Record<SfxName, Recipe> = {
  tap(k, out, t) {
    tone(k, out, { type: 'sine', freq: 880, freqEnd: 560, t, attack: 0.002, decay: 0.05, peak: 0.22 });
    noise(k, out, { t, dur: 0.02, freq: 3200, q: 2, peak: 0.05 });
  },

  select(k, out, t) {
    tone(k, out, { type: 'triangle', freq: midiToHz(79), t, attack: 0.003, decay: 0.12, peak: 0.16 });
    tone(k, out, { type: 'triangle', freq: midiToHz(86), t: t + 0.06, attack: 0.003, decay: 0.14, peak: 0.13 });
  },

  correct(k, out, t) {
    [84, 88, 91].forEach((m, i) => bell(k, out, midiToHz(m), t + i * 0.08, 0.13, 0.55));
  },

  incorrect(k, out, t) {
    // Soft descending "hmm": low triangle, heavily rounded. Encouraging, not punishing.
    const lp = lowpass(k, out, t, 1100);
    tone(k, lp, { type: 'triangle', freq: midiToHz(67), t, attack: 0.012, decay: 0.2, peak: 0.16 });
    tone(k, lp, { type: 'triangle', freq: midiToHz(64), freqEnd: midiToHz(63.6), t: t + 0.14, attack: 0.012, decay: 0.3, peak: 0.14 });
  },

  complete(k, out, t) {
    [72, 76, 79, 84].forEach((m, i) => bell(k, out, midiToHz(m), t + i * 0.075, 0.12, 0.7));
    tone(k, out, { freq: midiToHz(84), t: t + 0.3, attack: 0.08, decay: 1.2, peak: 0.04, detune: -6 });
    tone(k, out, { freq: midiToHz(88), t: t + 0.3, attack: 0.08, decay: 1.2, peak: 0.035, detune: 6 });
  },

  levelUp(k, out, t) {
    [77, 81, 84, 88, 91].forEach((m, i) => bell(k, out, midiToHz(m), t + i * 0.065, 0.11, 0.8, 0.35));
    tone(k, out, { freq: midiToHz(53), t, attack: 0.15, decay: 1.4, peak: 0.07 });
    tone(k, out, { freq: midiToHz(60), t, attack: 0.15, decay: 1.4, peak: 0.05 });
    noise(k, out, { t: t + 0.25, dur: 0.7, type: 'highpass', freq: 6500, q: 0.5, peak: 0.025, attack: 0.1 });
  },

  grind(k, out, t) {
    const { ctx } = k;
    const dur = 1.6;
    const load = dur - 0.35; // beans run out here: motor speeds up, crunch stops
    // Motor: spin-up, pitch sags under load, rises when empty, spins down.
    const motorOut = lowpass(k, out, t, 900);
    const motor = ctx.createGain();
    motor.gain.setValueAtTime(0.0001, t);
    motor.gain.linearRampToValueAtTime(0.07, t + 0.1);
    motor.gain.setValueAtTime(0.07, t + dur - 0.12);
    motor.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    motor.connect(motorOut);
    for (const [mult, type] of [
      [1, 'sawtooth'],
      [2, 'triangle'],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      const f = o.frequency;
      f.setValueAtTime(70 * mult, t);
      f.exponentialRampToValueAtTime(150 * mult, t + 0.12);
      f.exponentialRampToValueAtTime(128 * mult, t + 0.3);
      f.setValueAtTime(128 * mult, t + load);
      f.exponentialRampToValueAtTime(158 * mult, t + load + 0.15);
      f.setValueAtTime(158 * mult, t + dur - 0.1);
      f.exponentialRampToValueAtTime(60 * mult, t + dur + 0.15);
      o.connect(motor);
      o.start(t);
      o.stop(t + dur + 0.2);
    }
    // Burr crunch: band-passed noise with irregular chatter.
    const crunch = noise(k, out, { t: t + 0.08, dur: load, freq: 1700, q: 0.8, peak: 0.12, attack: 0.08 });
    modulate(k, crunch.gain, t, t + load, [23, 31.5], 0.045, 'square');
    noise(k, out, { t: t + 0.08, dur: load, type: 'highpass', freq: 4200, q: 0.6, peak: 0.03, attack: 0.1 });
    // Individual bean cracks, thinning out as the hopper empties.
    for (let i = 0; i < 34; i++) {
      const at = t + 0.1 + Math.pow(k.random(), 1.4) * (load - 0.1);
      noise(k, out, { t: at, dur: 0.01, freq: between(k, 1800, 4200), q: 2.5, peak: between(k, 0.04, 0.1) });
    }
  },

  pour(k, out, t) {
    const dur = 1.6;
    stream(k, out, t, dur, 520, 1350, 0.13, 6);
    noise(k, out, { t, dur, type: 'lowpass', freq: 1400, q: 0.5, peak: 0.035, attack: 0.1 }); // splash
    bubbles(k, out, t, dur, 10, 380, 700, 0.045);
  },

  milkPour(k, out, t) {
    const dur = 1.4;
    stream(k, out, t, dur, 380, 820, 0.12, 3.5);
    noise(k, out, { t, dur, type: 'lowpass', freq: 700, q: 0.5, peak: 0.04, attack: 0.12 });
    bubbles(k, out, t, dur, 5, 260, 480, 0.035);
  },

  steam(k, out, t) {
    steamCore(k, out, t, 1.5, 0.6);
  },

  milkSteam(k, out, t) {
    steamCore(k, out, t, 2.6, 1.1);
  },

  drip(k, out, t) {
    let at = t;
    for (let i = 0; i < 3; i++) {
      const f = between(k, 650, 1000);
      tone(k, out, { freq: f, freqEnd: f * 2.1, glide: 0.025, t: at, attack: 0.002, decay: 0.09, peak: i === 0 ? 0.17 : 0.1 });
      tone(k, k.reverb, { freq: f, freqEnd: f * 2.1, glide: 0.025, t: at, attack: 0.002, decay: 0.09, peak: 0.05 });
      noise(k, out, { t: at, dur: 0.012, freq: 3000, q: 1.5, peak: 0.025 });
      at += between(k, 0.16, 0.28);
    }
  },

  bloom(k, out, t) {
    // Fizzing coffee bed: many tiny bubbles over a soft hiss.
    noise(k, out, { t, dur: 1.4, freq: 5200, q: 1.2, peak: 0.03, attack: 0.3 });
    bubbles(k, out, t, 1.4, 28, 900, 2200, 0.03);
  },

  espresso(k, out, t) {
    const { ctx } = k;
    const dur = 2.2;
    // Vibratory pump buzz.
    const pump = ctx.createGain();
    envelope(pump.gain, t, 0.05, 0.05, dur);
    const pumpLp = lowpass(k, out, t, 380);
    pump.connect(pumpLp);
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(50, t);
    o.connect(pump);
    o.start(t);
    o.stop(t + dur + 0.1);
    // Thin, syrupy stream after pre-infusion.
    stream(k, out, t + 0.45, dur - 0.45, 900, 1100, 0.06, 2.5);
    bubbles(k, out, t + 0.5, dur - 0.6, 6, 500, 900, 0.025);
    // Pump stops: solenoid click.
    noise(k, out, { t: t + dur, dur: 0.03, freq: 1800, q: 3, peak: 0.1 });
  },

  serve(k, out, t) {
    // Cup set down on its saucer, on a wooden counter.
    tone(k, out, { freq: 190, freqEnd: 95, t, attack: 0.003, decay: 0.09, peak: 0.16 });
    noise(k, out, { t, dur: 0.05, type: 'lowpass', freq: 500, q: 0.7, peak: 0.08 });
    ceramic(k, out, 1650, t + 0.012, 0.09, 0.3);
    tone(k, k.reverb, { freq: 1650, t: t + 0.012, attack: 0.001, decay: 0.3, peak: 0.03 });
  },

  ice(k, out, t) {
    let at = t;
    for (let i = 0; i < 4; i++) {
      glassTink(k, out, at, between(k, 2300, 3400), i === 0 ? 0.08 : 0.06);
      tone(k, out, { freq: 240, freqEnd: 140, t: at, attack: 0.002, decay: 0.05, peak: 0.05 });
      at += between(k, 0.07, 0.13);
    }
  },

  tamp(k, out, t) {
    tone(k, out, { freq: 150, freqEnd: 80, t, attack: 0.004, decay: 0.12, peak: 0.22 });
    noise(k, out, { t, dur: 0.06, type: 'lowpass', freq: 650, q: 0.8, peak: 0.1 });
    noise(k, out, { t: t + 0.14, dur: 0.02, freq: 2600, q: 3, peak: 0.06 }); // tamper lifted
  },

  knock(k, out, t) {
    tone(k, out, { freq: 95, freqEnd: 50, t, attack: 0.003, decay: 0.18, peak: 0.26 });
    noise(k, out, { t, dur: 0.07, type: 'lowpass', freq: 380, q: 0.8, peak: 0.12 });
    noise(k, out, { t, dur: 0.02, freq: 1400, q: 2, peak: 0.07 });
    noise(k, out, { t: t + 0.06, dur: 0.12, freq: 900, q: 0.8, peak: 0.03 }); // puck crumbles
  },

  orderBell(k, out, t) {
    // Counter service bell: inharmonic partials, long ring.
    const f = 2050;
    for (const [r, a, d] of [
      [1, 1, 1.4],
      [2.76, 0.4, 0.8],
      [5.4, 0.15, 0.5],
    ] as const) {
      tone(k, out, { freq: f * r, t, attack: 0.002, decay: d, peak: 0.1 * a });
      tone(k, k.reverb, { freq: f * r, t, attack: 0.002, decay: d, peak: 0.03 * a });
    }
    noise(k, out, { t, dur: 0.01, type: 'highpass', freq: 5000, q: 0.7, peak: 0.05 });
  },

  timer(k, out, t) {
    bell(k, out, midiToHz(91), t, 0.12, 0.9, 0.2);
    bell(k, out, midiToHz(91), t + 0.3, 0.1, 1.1, 0.2);
  },

  snap(k, out, t) {
    noise(k, out, { t, dur: 0.035, freq: 2300, q: 3, peak: 0.22 });
    tone(k, out, { freq: 150, freqEnd: 70, t, attack: 0.002, decay: 0.08, peak: 0.28 });
    noise(k, out, { t: t + 0.05, dur: 0.025, freq: 3400, q: 4, peak: 0.1 });
  },

  whoosh(k, out, t) {
    noise(k, out, { t, dur: 0.38, freq: 380, freqEnd: 2800, q: 1.4, peak: 0.1, attack: 0.16 });
  },

  reset(k, out, t) {
    noise(k, out, { t, dur: 0.3, freq: 2400, freqEnd: 480, q: 1.4, peak: 0.08, attack: 0.08 });
    tone(k, out, { freq: 660, freqEnd: 440, t: t + 0.27, attack: 0.002, decay: 0.06, peak: 0.14 });
  },
};

/**
 * Per-effect loudness trim (linear), calibrated from the offline QA renders
 * (reports/AUDIO_QA.md) so UI sounds sit at a consistent level and coffee sounds
 * slightly below them. Re-run the QA script after changing any recipe.
 */
const TRIM_DB: Partial<Record<SfxName, number>> = {
  // UI micro-sounds → ≈ −22 LUFS (subtle)
  tap: 5.8,
  select: 1.2,
  snap: 3.0,
  reset: 4.0,
  whoosh: 10.4,
  // Feedback → ≈ −19 LUFS ("incorrect" a little softer, "levelUp" a little prouder)
  correct: -4.9,
  incorrect: -0.5,
  complete: -4.1,
  levelUp: -5.2,
  timer: -3.9,
  orderBell: -3.1,
  // Coffee sounds → ≈ −20 LUFS
  grind: -4.0,
  pour: 10.3,
  steam: -2.3,
  drip: 6.6,
  espresso: 4.8,
  serve: 1.1,
  ice: 1.7,
  milkSteam: -2.9,
  milkPour: 11.8,
  tamp: 4.2,
  knock: 2.3,
  bloom: 7.2,
};

export const SFX_TRIM: Partial<Record<SfxName, number>> = Object.fromEntries(
  Object.entries(TRIM_DB).map(([k, db]) => [k, Math.pow(10, (db ?? 0) / 20)]),
) as Partial<Record<SfxName, number>>;

/** Minimum seconds between repeats of the same effect (prevents machine-gun spam). */
export const MIN_GAP: Partial<Record<SfxName, number>> = {
  tap: 0.04,
  select: 0.05,
  grind: 1.2,
  pour: 1.0,
  milkPour: 1.0,
  steam: 1.2,
  milkSteam: 2.0,
  espresso: 1.8,
  bloom: 1.0,
  drip: 0.2,
  ice: 0.3,
  timer: 0.6,
  orderBell: 0.5,
};

/** Approximate length of each effect in seconds (for UI pacing and offline renders). */
export const SFX_DURATION: Record<SfxName, number> = {
  tap: 0.1,
  select: 0.25,
  correct: 0.8,
  incorrect: 0.55,
  complete: 1.6,
  levelUp: 1.8,
  grind: 1.8,
  pour: 1.7,
  milkPour: 1.5,
  steam: 1.6,
  milkSteam: 2.7,
  drip: 0.8,
  bloom: 1.5,
  espresso: 2.3,
  serve: 0.4,
  ice: 0.7,
  tamp: 0.25,
  knock: 0.3,
  orderBell: 1.5,
  timer: 1.5,
  snap: 0.15,
  whoosh: 0.4,
  reset: 0.4,
};
