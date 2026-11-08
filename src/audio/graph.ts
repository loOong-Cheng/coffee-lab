/**
 * The one mixing graph used both live and by the offline QA renders, so the
 * numbers in reports/AUDIO_QA.md describe exactly what the learner hears.
 *
 *   sfx bus ─┐
 *   music bus ┼─► master (volume) ─► gentle compressor ─► safety limiter ─► destination
 *   reverb ───┘
 */
import { makeImpulse, makeNoiseBuffer } from './kit';
import type { Kit } from './kit';

/** Relative bus levels: music sits well under SFX and speech. */
export const MUSIC_LEVEL = 0.27;
export const SFX_LEVEL = 0.9;
export const REVERB_LEVEL = 0.22;

export interface AudioGraph {
  kit: Kit;
  master: GainNode;
  sfxBus: GainNode;
  musicBus: GainNode;
}

/** Perceptual taper so the volume slider feels even. */
export const volumeToGain = (v: number) => Math.pow(Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0, 1.6);

export function buildGraph(ctx: BaseAudioContext, opts: { volume: number; musicLevel?: number; random?: () => number }): AudioGraph {
  const random = opts.random ?? Math.random;
  const master = ctx.createGain();
  master.gain.value = volumeToGain(opts.volume);
  let out: AudioNode = ctx.destination;
  if (typeof ctx.createDynamicsCompressor === 'function') {
    // Fast, high-threshold limiter last: guarantees no clipping even with many overlapping sounds.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;
    limiter.connect(ctx.destination);
    // Gentle glue compressor before it.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    comp.connect(limiter);
    out = comp;
  }
  master.connect(out);

  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(ctx, 2.2, random);
  const reverbReturn = ctx.createGain();
  reverbReturn.gain.value = REVERB_LEVEL;
  reverb.connect(reverbReturn);
  reverbReturn.connect(master);

  const sfxBus = ctx.createGain();
  sfxBus.gain.value = SFX_LEVEL;
  sfxBus.connect(master);

  const musicBus = ctx.createGain();
  musicBus.gain.value = opts.musicLevel ?? 0.0001;
  musicBus.connect(master);

  return { kit: { ctx, noise: makeNoiseBuffer(ctx, 2, random), reverb, random }, master, sfxBus, musicBus };
}
