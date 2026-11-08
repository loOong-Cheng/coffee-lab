import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio, createAudioEngine, MUSIC_MOOD_IDS, SFX_NAMES } from './index';

/** Minimal fake Web Audio graph: records node creation and accepts every scheduling call. */
class FakeParam {
  value = 0;
  setValueAtTime = vi.fn(() => this);
  linearRampToValueAtTime = vi.fn(() => this);
  exponentialRampToValueAtTime = vi.fn((v: number) => {
    if (!(v > 0)) throw new RangeError('exponential ramp target must be > 0');
    return this;
  });
  setTargetAtTime = vi.fn(() => this);
  cancelScheduledValues = vi.fn(() => this);
}

class FakeNode {
  connect = vi.fn((dest: unknown) => dest);
  disconnect = vi.fn();
}

class FakeSource extends FakeNode {
  frequency = new FakeParam();
  detune = new FakeParam();
  type = 'sine';
  buffer: unknown = null;
  loop = false;
  start = vi.fn();
  stop = vi.fn();
}

class FakeContext {
  static created = 0;
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 0;
  sampleRate = 8000;
  destination = new FakeNode();
  nodes = 0;
  constructor() {
    FakeContext.created += 1;
  }
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  private count<T>(n: T): T {
    this.nodes += 1;
    return n;
  }
  createGain = () => this.count(Object.assign(new FakeNode(), { gain: new FakeParam() }));
  createOscillator = () => this.count(new FakeSource());
  createBufferSource = () => this.count(new FakeSource());
  createBiquadFilter = () =>
    this.count(Object.assign(new FakeNode(), { type: 'lowpass', frequency: new FakeParam(), Q: new FakeParam() }));
  createStereoPanner = () => this.count(Object.assign(new FakeNode(), { pan: new FakeParam() }));
  createConvolver = () => this.count(Object.assign(new FakeNode(), { buffer: null as unknown }));
  createDynamicsCompressor = () =>
    this.count(
      Object.assign(new FakeNode(), {
        threshold: new FakeParam(),
        knee: new FakeParam(),
        ratio: new FakeParam(),
        attack: new FakeParam(),
        release: new FakeParam(),
      }),
    );
  createBuffer = (channels: number, length: number) => ({
    getChannelData: () => new Float32Array(length),
    numberOfChannels: channels,
    length,
  });
}

const fakeFactory = () => new FakeContext() as unknown as AudioContext;

afterEach(() => {
  vi.useRealTimers();
});

describe('audio engine without Web Audio (jsdom)', () => {
  it('reports unavailable and never throws', async () => {
    expect('AudioContext' in window).toBe(false);
    expect(audio.available).toBe(false);
    await expect(audio.unlock()).resolves.toBeUndefined();
    expect(() => {
      for (const n of SFX_NAMES) audio.play(n, { volume: 0.5, pan: -1 });
      audio.setSfxEnabled(false);
      audio.setMusicEnabled(true);
      audio.setMusicMood('focus');
      audio.setVolume(2);
      audio.setVolume(Number.NaN);
      audio.setMusicEnabled(false);
    }).not.toThrow();
  });

  it('is a no-op when the context factory itself throws', async () => {
    const engine = createAudioEngine({
      createContext: () => {
        throw new Error('blocked');
      },
    });
    await expect(engine.unlock()).resolves.toBeUndefined();
    expect(engine.available).toBe(false);
    expect(() => engine.play('tap')).not.toThrow();
  });
});

describe('audio engine with a (fake) AudioContext', () => {
  it('creates the context lazily, only on unlock', async () => {
    const before = FakeContext.created;
    const engine = createAudioEngine({ createContext: fakeFactory });
    expect(engine.available).toBe(true);
    engine.play('tap'); // before unlock: silent no-op
    expect(FakeContext.created).toBe(before);
    await engine.unlock();
    expect(FakeContext.created).toBe(before + 1);
    await engine.unlock();
    expect(FakeContext.created).toBe(before + 1);
  });

  it('synthesises every SFX without throwing (all exponential ramps target > 0)', async () => {
    const engine = createAudioEngine({ createContext: fakeFactory });
    await engine.unlock();
    for (const n of SFX_NAMES) {
      expect(() => engine.play(n, { volume: 0.8, pan: 0.3 }), n).not.toThrow();
    }
  });

  it('respects SFX toggle', async () => {
    let ctx: FakeContext | null = null;
    const engine = createAudioEngine({
      createContext: () => {
        ctx = new FakeContext();
        return ctx as unknown as AudioContext;
      },
    });
    await engine.unlock();
    const c = ctx as unknown as FakeContext;
    engine.setSfxEnabled(false);
    const n0 = c.nodes;
    engine.play('correct');
    expect(c.nodes).toBe(n0);
    engine.setSfxEnabled(true);
    engine.play('correct');
    expect(c.nodes).toBeGreaterThan(n0);
  });

  it('music is off by default and schedules notes only when enabled, in every mood', async () => {
    vi.useFakeTimers();
    let ctx: FakeContext | null = null;
    const engine = createAudioEngine({
      createContext: () => {
        ctx = new FakeContext();
        return ctx as unknown as AudioContext;
      },
    });
    await engine.unlock();
    const c = ctx as unknown as FakeContext;
    const idle = c.nodes;
    vi.advanceTimersByTime(1000);
    expect(c.nodes).toBe(idle); // no music unless asked

    engine.setMusicEnabled(true);
    for (const mood of MUSIC_MOOD_IDS) {
      engine.setMusicMood(mood);
      for (let i = 0; i < 40; i++) {
        c.currentTime += 0.25;
        vi.advanceTimersByTime(100);
      }
    }
    expect(c.nodes).toBeGreaterThan(idle);
    expect(engine.getMusicMood?.()).toBe(MUSIC_MOOD_IDS[MUSIC_MOOD_IDS.length - 1]);
    expect(engine.isMusicPlaying?.()).toBe(true);
    engine.setMusicMood('nonsense' as never);
    expect(engine.getMusicMood?.()).toBe(MUSIC_MOOD_IDS[MUSIC_MOOD_IDS.length - 1]);

    engine.setMusicEnabled(false);
    vi.advanceTimersByTime(2500); // fade-out then scheduler stops
    const stopped = c.nodes;
    c.currentTime += 5;
    vi.advanceTimersByTime(1000);
    expect(c.nodes).toBe(stopped);
    expect(engine.isMusicPlaying?.()).toBe(false);
  });
});
