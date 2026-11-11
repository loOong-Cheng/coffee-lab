/**
 * Music mood switching (user report 2026-11-11: "the music does not switch correctly").
 * Drives MusicGenerator on a fake AudioContext and checks what is actually SCHEDULED, not just the remembered mood.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildGraph } from './graph';
import { MOOD_SOUND, MusicGenerator } from './music';
import type { MusicMoodId } from './moods';

class FakeParam {
  value = 1;
  setValueAtTime = vi.fn(() => this);
  linearRampToValueAtTime = vi.fn(() => this);
  exponentialRampToValueAtTime = vi.fn(() => this);
  setTargetAtTime = vi.fn(() => this);
  cancelScheduledValues = vi.fn(() => this);
}
class FakeNode {
  connect = vi.fn((d: unknown) => d);
  disconnect = vi.fn();
}
class FakeSource extends FakeNode {
  frequency = new FakeParam();
  detune = new FakeParam();
  type = 'sine';
  buffer: unknown = null;
  loop = false;
  startedAt: number | null = null;
  start = vi.fn((t?: number) => {
    this.startedAt = t ?? 0;
  });
  stop = vi.fn();
}
class FakeContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 8000;
  destination = new FakeNode();
  sources: FakeSource[] = [];
  gains: Array<FakeNode & { gain: FakeParam }> = [];
  createGain = () => {
    const g = Object.assign(new FakeNode(), { gain: new FakeParam() });
    this.gains.push(g);
    return g;
  };
  createOscillator = () => this.track(new FakeSource());
  createBufferSource = () => this.track(new FakeSource());
  createBiquadFilter = () => Object.assign(new FakeNode(), { type: 'lowpass', frequency: new FakeParam(), Q: new FakeParam() });
  createStereoPanner = () => Object.assign(new FakeNode(), { pan: new FakeParam() });
  createConvolver = () => Object.assign(new FakeNode(), { buffer: null as unknown });
  createDynamicsCompressor = () =>
    Object.assign(new FakeNode(), { threshold: new FakeParam(), knee: new FakeParam(), ratio: new FakeParam(), attack: new FakeParam(), release: new FakeParam() });
  createBuffer = (channels: number, length: number) => ({ getChannelData: () => new Float32Array(length), numberOfChannels: channels, length });
  private track(s: FakeSource) {
    this.sources.push(s);
    return s;
  }
}

let ctx: FakeContext;
let gen: MusicGenerator;
/** The keys low-pass cutoff the generator last applied: each mood has a distinct one (MOOD_SOUND.keysCutoff). */
let cutoffCalls: () => number[];

function advance(seconds: number) {
  for (let t = 0; t < seconds; t += 0.15) {
    ctx.currentTime += 0.15;
    vi.advanceTimersByTime(150);
  }
}
const lastCutoff = () => cutoffCalls().at(-1);

beforeEach(() => {
  vi.useFakeTimers();
  ctx = new FakeContext();
  const g = buildGraph(ctx as unknown as AudioContext, { volume: 0.7 });
  gen = new MusicGenerator(g.kit, g.musicBus, { seed: 7 });
  const lp = (gen as unknown as { keysLp: { frequency: FakeParam } }).keysLp;
  cutoffCalls = () => lp.frequency.setTargetAtTime.mock.calls.map((c) => (c as unknown as [number])[0]);
});
afterEach(() => {
  gen.stop();
  vi.useRealTimers();
});

describe('music mood switching', () => {
  it('switching away and straight back keeps the mood chosen last', () => {
    gen.setMood('cafe');
    gen.start();
    advance(2);
    gen.setMood('bossa');
    gen.setMood('cafe'); // user changes their mind before the next bar line
    advance(12);
    expect(gen.mood).toBe('cafe');
    expect(lastCutoff()).toBe(MOOD_SOUND.cafe.keysCutoff);
  });

  it('a mood picked while stopped is not overridden by an earlier pending switch', () => {
    gen.setMood('cafe');
    gen.start();
    advance(2);
    gen.setMood('bossa'); // switch requested…
    gen.stop(); // …but music is turned off before it happened
    gen.setMood('kissa'); // user then picks kissa and turns music back on
    gen.start();
    advance(12);
    expect(gen.mood).toBe('kissa');
    expect(lastCutoff()).toBe(MOOD_SOUND.kissa.keysCutoff);
  });

  it.each(['focus', 'kissa', 'bar'] as MusicMoodId[])('new-mood notes start within 0.5 s of switching to %s (no multi-second wait for the bar line)', (to) => {
    gen.setMood('cafe');
    gen.start();
    advance(3.1); // part-way through a bar, a second of music already scheduled ahead
    const switchAt = ctx.currentTime;
    const before = ctx.sources.length;
    gen.setMood(to);
    advance(1.5);
    const newStarts = ctx.sources.slice(before).map((s) => s.startedAt ?? Infinity);
    expect(newStarts.length).toBeGreaterThan(0);
    expect(Math.min(...newStarts) - switchAt).toBeLessThan(0.5);
    expect(lastCutoff()).toBe(MOOD_SOUND[to].keysCutoff);
  });

  it('notes already scheduled for the old mood fade out and are disconnected', () => {
    gen.setMood('cafe');
    gen.start();
    advance(3);
    // The voice gains (keys, lead, bass, drums, ambience) every old-mood note is routed through.
    const old = Object.values((gen as unknown as { v: Record<string, FakeNode & { gain: FakeParam }> }).v);
    expect(old).toHaveLength(5);
    gen.setMood('lab');
    // they fade towards silence right away…
    for (const g of old) expect(g.gain.setTargetAtTime.mock.calls.some((c) => (c as unknown as [number])[0] <= 0.001)).toBe(true);
    expect(old.some((g) => g.disconnect.mock.calls.length > 0)).toBe(false); // not cut off abruptly
    // …and are detached from the instrument buses shortly after.
    advance(3);
    for (const g of old) expect(g.disconnect).toHaveBeenCalled();
    // the new mood plays through fresh voice gains
    const fresh = Object.values((gen as unknown as { v: Record<string, unknown> }).v);
    expect(fresh.some((g) => old.includes(g as never))).toBe(false);
  });

  it('rapid switching through every mood ends on the last one and keeps scheduling', () => {
    gen.start();
    for (const m of ['focus', 'lab', 'bossa', 'kissa', 'bar', 'cafe', 'kissa'] as MusicMoodId[]) {
      gen.setMood(m);
      advance(0.3);
    }
    const before = ctx.sources.length;
    advance(6);
    expect(gen.mood).toBe('kissa');
    expect(lastCutoff()).toBe(MOOD_SOUND.kissa.keysCutoff);
    expect(ctx.sources.length).toBeGreaterThan(before);
  });
});
