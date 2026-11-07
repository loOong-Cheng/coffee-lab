/**
 * Procedural sound effects. Design rules: short, soft, warm; success sounds are
 * gentle bells, "incorrect" is a quiet two-note "hmm" (never a buzzer), and the
 * coffee sounds (grind / pour / steam / drip) are shaped noise that evokes the real thing.
 */
import type { SfxName } from './index';
import { bell, midiToHz, noise, tone } from './kit';
import type { Kit } from './kit';

type Recipe = (k: Kit, out: AudioNode, t: number) => void;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

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
    const lp = k.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1100, t);
    lp.connect(out);
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
    const dur = 1.1;
    // Motor hum.
    const hum = ctx.createBiquadFilter();
    hum.type = 'lowpass';
    hum.frequency.setValueAtTime(420, t);
    hum.connect(out);
    const motor = ctx.createGain();
    motor.gain.setValueAtTime(0.0001, t);
    motor.gain.linearRampToValueAtTime(0.07, t + 0.08);
    motor.gain.setValueAtTime(0.07, t + dur - 0.2);
    motor.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    motor.connect(hum);
    for (const f of [96, 192]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f * 0.85, t);
      o.frequency.linearRampToValueAtTime(f, t + 0.12);
      o.connect(motor);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    // Burr crunch: band-passed noise chopped by a fast LFO.
    const crunch = noise(k, out, { t, dur, freq: 1900, q: 0.9, peak: 0.13, attack: 0.06 });
    const am = ctx.createGain();
    am.gain.setValueAtTime(0.5, t);
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(27, t);
    lfo.connect(am);
    am.connect(crunch.gain);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
    // Bean cracks.
    for (let i = 0; i < 14; i++) {
      noise(k, out, { t: t + rand(0.05, dur - 0.15), dur: 0.012, type: 'highpass', freq: 2600, q: 0.7, peak: rand(0.04, 0.09) });
    }
  },

  pour(k, out, t) {
    const { ctx } = k;
    const dur = 1.3;
    const g = noise(k, out, { t, dur, type: 'bandpass', freq: 1300, q: 1.1, peak: 0.11, attack: 0.12 });
    void g;
    // Low body of the stream.
    noise(k, out, { t, dur, type: 'lowpass', freq: 520, q: 0.6, peak: 0.08, attack: 0.15 });
    // Bubbles: quick upward chirps.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, t);
    lp.connect(out);
    for (let i = 0; i < 12; i++) {
      const at = t + rand(0.1, dur - 0.1);
      const f = rand(320, 620);
      tone(k, lp, { freq: f, freqEnd: f * rand(1.8, 2.6), t: at, attack: 0.004, decay: 0.035, peak: rand(0.025, 0.05) });
    }
  },

  steam(k, out, t) {
    const dur = 1.4;
    const hiss = noise(k, out, { t, dur, type: 'highpass', freq: 2600, q: 0.6, peak: 0.09, attack: 0.18 });
    // Milk-stretching "tss-tss": gentle 5 Hz flutter on the hiss.
    const { ctx } = k;
    const am = ctx.createGain();
    am.gain.setValueAtTime(0.025, t);
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(5.2, t);
    lfo.connect(am);
    am.connect(hiss.gain);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
    noise(k, out, { t, dur, type: 'bandpass', freq: 4800, q: 2.5, peak: 0.04, attack: 0.3 });
    noise(k, out, { t, dur: 0.9, type: 'lowpass', freq: 300, q: 0.7, peak: 0.05, attack: 0.25 });
  },

  drip(k, out, t) {
    tone(k, out, { freq: 720, freqEnd: 1500, t, attack: 0.002, decay: 0.08, peak: 0.18 });
    tone(k, out, { freq: 640, freqEnd: 1320, t: t + 0.2, attack: 0.002, decay: 0.07, peak: 0.1 });
    tone(k, k.reverb, { freq: 720, freqEnd: 1500, t, attack: 0.002, decay: 0.08, peak: 0.06 });
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

/** Minimum seconds between repeats of the same effect (prevents machine-gun spam). */
export const MIN_GAP: Partial<Record<SfxName, number>> = {
  tap: 0.04,
  select: 0.05,
  grind: 0.8,
  pour: 0.9,
  steam: 1.0,
  drip: 0.15,
  timer: 0.6,
};
