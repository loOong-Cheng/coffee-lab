/**
 * Tiny Web Audio synthesis kit shared by SFX and music. Everything is procedural:
 * oscillators, filtered noise and a generated reverb impulse — no audio files.
 */

export interface Kit {
  ctx: AudioContext;
  /** 2 s of mono white noise, looped by noise sources. */
  noise: AudioBuffer;
  /** Shared reverb send input. */
  reverb: AudioNode;
}

export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const EPS = 0.0001;

/** Attack → exponential decay envelope on a gain AudioParam. */
export function envelope(p: AudioParam, t: number, attack: number, peak: number, decay: number, floor = EPS): void {
  p.cancelScheduledValues(t);
  p.setValueAtTime(EPS, t);
  p.linearRampToValueAtTime(Math.max(peak, EPS), t + Math.max(attack, 0.001));
  p.exponentialRampToValueAtTime(Math.max(floor, EPS), t + Math.max(attack, 0.001) + Math.max(decay, 0.005));
}

export interface ToneOpts {
  type?: OscillatorType;
  freq: number;
  /** Optional glide target reached at the end of attack+decay. */
  freqEnd?: number;
  t: number;
  attack?: number;
  decay?: number;
  peak?: number;
  detune?: number;
}

export function tone(k: Kit, dest: AudioNode, o: ToneOpts): void {
  const { ctx } = k;
  const attack = o.attack ?? 0.005;
  const decay = o.decay ?? 0.2;
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, o.t);
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, o.t + attack + decay);
  if (o.detune) osc.detune.setValueAtTime(o.detune, o.t);
  const g = ctx.createGain();
  envelope(g.gain, o.t, attack, o.peak ?? 0.2, decay);
  osc.connect(g);
  g.connect(dest);
  osc.start(o.t);
  osc.stop(o.t + attack + decay + 0.05);
}

export interface NoiseOpts {
  t: number;
  dur: number;
  type?: BiquadFilterType;
  freq: number;
  freqEnd?: number;
  q?: number;
  peak?: number;
  attack?: number;
}

/** Filtered noise burst. Returns the envelope gain so callers can add modulation. */
export function noise(k: Kit, dest: AudioNode, o: NoiseOpts): GainNode {
  const { ctx } = k;
  const src = ctx.createBufferSource();
  src.buffer = k.noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = o.type ?? 'bandpass';
  f.frequency.setValueAtTime(o.freq, o.t);
  if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, o.t + o.dur);
  f.Q.setValueAtTime(o.q ?? 1, o.t);
  const g = ctx.createGain();
  const attack = o.attack ?? 0.005;
  envelope(g.gain, o.t, attack, o.peak ?? 0.1, Math.max(0.01, o.dur - attack));
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(o.t, Math.random() * 1.5);
  src.stop(o.t + o.dur + 0.05);
  return g;
}

/** Soft glassy bell (a few sine partials); `send` adds reverb. */
export function bell(k: Kit, dest: AudioNode, freq: number, t: number, peak = 0.14, decay = 0.6, send = 0.25): void {
  const partials: Array<[number, number, number]> = [
    [1, 1, 1],
    [2, 0.35, 0.55],
    [3.01, 0.12, 0.35],
  ];
  for (const [ratio, amp, dk] of partials) {
    tone(k, dest, { freq: freq * ratio, t, attack: 0.003, decay: decay * dk, peak: peak * amp });
    if (send > 0) tone(k, k.reverb, { freq: freq * ratio, t, attack: 0.003, decay: decay * dk, peak: peak * amp * send });
  }
}

export function makeNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Warm room impulse response: decaying stereo noise with high frequencies dying faster. */
export function makeImpulse(ctx: AudioContext, seconds = 2.2): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const tNorm = i / len;
      const white = Math.random() * 2 - 1;
      const smooth = 0.25 + 0.6 * tNorm; // darker tail
      lp = lp + (white - lp) * (1 - smooth);
      d[i] = lp * Math.pow(1 - tNorm, 2.6);
    }
  }
  return buf;
}
