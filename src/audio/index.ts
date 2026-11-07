/**
 * Coffee Lab audio — procedural Web Audio only (no audio files, no licensing risk).
 * The exported API/types below are the contract other modules code against (CONTRACTS.md §6).
 *
 * Behaviour:
 * - Never throws. Without Web Audio (jsdom, very old browsers) `available` is false and every call is a no-op.
 * - The AudioContext is created lazily inside `unlock()` (call it from a user gesture).
 * - SFX are on by default (the shell syncs prefs); music is OFF until `setMusicEnabled(true)`.
 * - Music fades in/out, follows master volume, pauses with the tab (visibilitychange) to save battery.
 */
import { makeImpulse, makeNoiseBuffer } from './kit';
import type { Kit } from './kit';
import { MusicGenerator } from './music';
import { MIN_GAP, SFX } from './sfx';

export type SfxName =
  | 'tap' | 'select' | 'correct' | 'incorrect' | 'complete' | 'levelUp'
  | 'grind' | 'pour' | 'steam' | 'drip' | 'timer' | 'snap' | 'whoosh' | 'reset';

export type MusicMood = 'cafe' | 'focus' | 'lab';

export interface AudioEngine {
  /** Call from a user gesture; safe to call repeatedly. */
  unlock(): Promise<void>;
  /** No-op when SFX disabled or audio unavailable. pan: -1..1 */
  play(name: SfxName, opts?: { volume?: number; pan?: number }): void;
  setSfxEnabled(on: boolean): void;
  /** Starts/stops generative music (only audible after unlock). */
  setMusicEnabled(on: boolean): void;
  setMusicMood(mood: MusicMood): void;
  /** Master volume 0..1 */
  setVolume(v: number): void;
  readonly available: boolean;
}

export const SFX_NAMES: readonly SfxName[] = [
  'tap', 'select', 'correct', 'incorrect', 'complete', 'levelUp',
  'grind', 'pour', 'steam', 'drip', 'timer', 'snap', 'whoosh', 'reset',
];

/** Relative bus levels: music sits well under SFX and speech. */
const MUSIC_LEVEL = 0.32;
const SFX_LEVEL = 0.9;
const REVERB_LEVEL = 0.22;

type ContextFactory = () => AudioContext;

export interface AudioEngineOptions {
  /** Inject a context factory (tests). Default: window.AudioContext / webkitAudioContext. */
  createContext?: ContextFactory | null;
}

function defaultFactory(): ContextFactory | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  return Ctor ? () => new Ctor({ latencyHint: 'interactive' }) : null;
}

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
/** Perceptual taper so the slider feels even. */
const volumeToGain = (v: number) => Math.pow(clamp(v, 0, 1), 1.6);

class WebAudioEngine implements AudioEngine {
  private factory: ContextFactory | null;
  private ctx: AudioContext | null = null;
  private kit: Kit | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private music: MusicGenerator | null = null;
  private broken = false;
  private sfxOn = true;
  private musicOn = false;
  private mood: MusicMood = 'cafe';
  private volume = 0.7;
  private lastPlayed = new Map<SfxName, number>();
  private stopMusicTimer: ReturnType<typeof setTimeout> | null = null;
  private suspendedForHidden = false;

  constructor(opts: AudioEngineOptions = {}) {
    this.factory = opts.createContext === undefined ? defaultFactory() : opts.createContext;
  }

  get available(): boolean {
    return this.factory !== null && !this.broken;
  }

  async unlock(): Promise<void> {
    if (!this.available) return;
    try {
      if (!this.ctx) this.build();
      const ctx = this.ctx;
      if (ctx && ctx.state === 'suspended' && !this.suspendedForHidden) await ctx.resume();
      this.syncMusic();
    } catch {
      // Autoplay policy or a broken audio stack: stay silent, never break the app.
    }
  }

  play(name: SfxName, opts?: { volume?: number; pan?: number }): void {
    if (!this.sfxOn || !this.ctx || !this.kit || !this.sfxBus) return;
    try {
      const ctx = this.ctx;
      if (ctx.state !== 'running') return;
      const recipe = SFX[name];
      if (!recipe) return;
      const now = ctx.currentTime;
      const gap = MIN_GAP[name] ?? 0.03;
      const last = this.lastPlayed.get(name);
      if (last !== undefined && now - last < gap) return;
      this.lastPlayed.set(name, now);

      const g = ctx.createGain();
      g.gain.value = clamp(opts?.volume ?? 1, 0, 1);
      let tail: AudioNode = g;
      if (opts?.pan && typeof ctx.createStereoPanner === 'function') {
        const p = ctx.createStereoPanner();
        p.pan.value = clamp(opts.pan, -1, 1);
        g.connect(p);
        tail = p;
      }
      tail.connect(this.sfxBus);
      recipe(this.kit, g, now + 0.005);
      // Detach the per-play nodes once the longest effect has finished.
      setTimeout(() => {
        try {
          tail.disconnect();
          if (tail !== g) g.disconnect();
        } catch {
          /* already gone */
        }
      }, 3000);
    } catch {
      /* never throw from a sound */
    }
  }

  setSfxEnabled(on: boolean): void {
    this.sfxOn = Boolean(on);
  }

  setMusicEnabled(on: boolean): void {
    this.musicOn = Boolean(on);
    this.syncMusic();
  }

  setMusicMood(mood: MusicMood): void {
    if (mood !== 'cafe' && mood !== 'focus' && mood !== 'lab') return;
    this.mood = mood;
    try {
      this.music?.setMood(mood);
    } catch {
      /* ignore */
    }
  }

  setVolume(v: number): void {
    this.volume = clamp(v, 0, 1);
    if (!this.ctx || !this.master) return;
    try {
      this.master.gain.setTargetAtTime(volumeToGain(this.volume), this.ctx.currentTime, 0.05);
    } catch {
      /* ignore */
    }
  }

  // ───────────────────────── internals ─────────────────────────

  private build(): void {
    if (!this.factory) return;
    let ctx: AudioContext;
    try {
      ctx = this.factory();
    } catch {
      this.broken = true;
      return;
    }
    const master = ctx.createGain();
    master.gain.value = volumeToGain(this.volume);
    let out: AudioNode = ctx.destination;
    if (typeof ctx.createDynamicsCompressor === 'function') {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 12;
      comp.ratio.value = 3;
      comp.attack.value = 0.005;
      comp.release.value = 0.2;
      comp.connect(ctx.destination);
      out = comp;
    }
    master.connect(out);

    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = REVERB_LEVEL;
    reverb.connect(reverbReturn);
    reverbReturn.connect(master);

    const sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_LEVEL;
    sfxBus.connect(master);

    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.0001;
    musicBus.connect(master);

    this.ctx = ctx;
    this.master = master;
    this.sfxBus = sfxBus;
    this.musicBus = musicBus;
    this.kit = { ctx, noise: makeNoiseBuffer(ctx), reverb };
    this.music = new MusicGenerator(this.kit, musicBus);
    this.music.setMood(this.mood);

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => this.onVisibility());
    }
  }

  private onVisibility(): void {
    const ctx = this.ctx;
    if (!ctx || typeof document === 'undefined') return;
    try {
      if (document.hidden && ctx.state === 'running') {
        this.suspendedForHidden = true;
        void ctx.suspend();
      } else if (!document.hidden && this.suspendedForHidden) {
        this.suspendedForHidden = false;
        void ctx.resume();
      }
    } catch {
      /* ignore */
    }
  }

  private syncMusic(): void {
    const ctx = this.ctx;
    if (!ctx || !this.music || !this.musicBus) return;
    try {
      const now = ctx.currentTime;
      if (this.stopMusicTimer) {
        clearTimeout(this.stopMusicTimer);
        this.stopMusicTimer = null;
      }
      if (this.musicOn) {
        this.music.setMood(this.mood);
        this.music.start();
        this.musicBus.gain.cancelScheduledValues(now);
        this.musicBus.gain.setTargetAtTime(MUSIC_LEVEL, now, 0.9); // ~3 s fade in
      } else if (this.music.running) {
        this.musicBus.gain.cancelScheduledValues(now);
        this.musicBus.gain.setTargetAtTime(0.0001, now, 0.35); // ~1 s fade out
        this.stopMusicTimer = setTimeout(() => {
          this.stopMusicTimer = null;
          if (!this.musicOn) this.music?.stop();
        }, 2000);
      }
    } catch {
      /* ignore */
    }
  }
}

/** Factory (tests inject a fake context). */
export function createAudioEngine(opts?: AudioEngineOptions): AudioEngine {
  return new WebAudioEngine(opts);
}

/** The app-wide engine. */
export const audio: AudioEngine = createAudioEngine();
