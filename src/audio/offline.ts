/**
 * Offline renders for objective audio QA (browser only: needs OfflineAudioContext).
 * Uses the same graph, instruments and composer as live playback.
 */
import { buildGraph, MUSIC_LEVEL } from './graph';
import type { SfxName } from './index';
import { seededRandom } from './kit';
import type { MusicMoodId } from './moods';
import { MusicGenerator } from './music';
import { SFX, SFX_DURATION, SFX_TRIM } from './sfx';
import type { BarPlan } from './composer';

export interface OfflineOptions {
  sampleRate?: number;
  /** Master volume 0..1 (QA uses 1 = worst case for clipping). */
  volume?: number;
  seed?: number;
}

type OfflineCtor = new (channels: number, length: number, sampleRate: number) => OfflineAudioContext;

function offlineCtor(): OfflineCtor {
  const w = globalThis as unknown as { OfflineAudioContext?: OfflineCtor; webkitOfflineAudioContext?: OfflineCtor };
  const C = w.OfflineAudioContext ?? w.webkitOfflineAudioContext;
  if (!C) throw new Error('OfflineAudioContext unavailable');
  return C;
}

export async function renderMusic(
  mood: MusicMoodId,
  seconds: number,
  opts: OfflineOptions = {},
): Promise<{ buffer: AudioBuffer; bars: BarPlan[] }> {
  const sr = opts.sampleRate ?? 44100;
  const seed = opts.seed ?? 1234;
  const ctx = new (offlineCtor())(2, Math.ceil((seconds + 2.5) * sr), sr);
  const g = buildGraph(ctx, { volume: opts.volume ?? 1, musicLevel: MUSIC_LEVEL, random: seededRandom(seed) });
  const gen = new MusicGenerator(g.kit, g.musicBus, { seed });
  gen.setMood(mood);
  const bars = gen.renderSpan(0.05, seconds);
  const buffer = await ctx.startRendering();
  return { buffer, bars };
}

export async function renderSfx(name: SfxName, opts: OfflineOptions = {}): Promise<AudioBuffer> {
  const sr = opts.sampleRate ?? 44100;
  const seconds = (SFX_DURATION[name] ?? 1.5) + 1.8; // include reverb tail
  const ctx = new (offlineCtor())(2, Math.ceil(seconds * sr), sr);
  const g = buildGraph(ctx, { volume: opts.volume ?? 1, random: seededRandom(opts.seed ?? 99) });
  const trim = ctx.createGain();
  trim.gain.value = SFX_TRIM[name] ?? 1;
  trim.connect(g.sfxBus);
  SFX[name](g.kit, trim, 0.05);
  return ctx.startRendering();
}
