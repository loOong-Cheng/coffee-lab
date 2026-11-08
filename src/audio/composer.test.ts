import { describe, expect, it } from 'vitest';
import { analyze, bandShares, encodeWavMono } from './analysis';
import { beatToSeconds, composeBars, MOOD_SPECS, parseChord, voiceLead } from './composer';
import { MUSIC_MOOD_IDS, MUSIC_MOODS } from './moods';
import { composeMinutes, varietyReport } from './variety';

describe('composer', () => {
  it('is deterministic for a seed', () => {
    const a = composeBars('cafe', 42, 24);
    const b = composeBars('cafe', 42, 24);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(composeBars('cafe', 43, 24))).not.toBe(JSON.stringify(a));
  });

  it.each(MUSIC_MOOD_IDS)('%s: 10 minutes of well-formed, varied music', (mood) => {
    const bars = composeMinutes(mood, 5, 10);
    for (const b of bars) {
      expect(b.bpm).toBeGreaterThan(40);
      expect(b.energy).toBeGreaterThan(0);
      expect(b.energy).toBeLessThanOrEqual(1);
      for (const e of b.events) {
        expect(Number.isFinite(e.beat) && Number.isFinite(e.dur) && Number.isFinite(e.vel)).toBe(true);
        expect(e.beat).toBeGreaterThanOrEqual(0);
        expect(e.beat).toBeLessThan(4.1);
        expect(e.vel).toBeGreaterThan(0);
        expect(e.vel).toBeLessThanOrEqual(1);
        if (e.midi) {
          expect(e.midi).toBeGreaterThanOrEqual(28);
          expect(e.midi).toBeLessThanOrEqual(96);
        }
      }
    }
    const v = varietyReport(mood, 5, 10);
    expect(v.distinctProgressions).toBeGreaterThanOrEqual(6);
    expect(v.exactSectionRepeats).toBe(0);
    expect(v.maxEventsPerBar).toBeLessThanOrEqual(140);
    expect(Object.keys(v.sections)).toEqual(expect.arrayContaining(['A', 'B', 'break']));
    expect(v.energyRange[1] - v.energyRange[0]).toBeGreaterThan(0.2); // dynamics, not a flat line
  });

  it('melody notes never sit a minor ninth above a chord tone (no harsh clashes)', () => {
    for (const mood of MUSIC_MOOD_IDS) {
      for (const b of composeMinutes(mood, 9, 5)) {
        const spans = b.chords.map((sym, i) => ({ c: parseChord(sym), start: (i * 4) / b.chords.length, len: 4 / b.chords.length }));
        for (const e of b.events.filter((x) => x.inst === 'lead')) {
          const span = spans.find((s) => e.beat >= s.start - 0.02 && e.beat < s.start + s.len) ?? spans[0]!;
          const clash = span.c.chordTones.some((t) => (((e.midi - t) % 12) + 12) % 12 === 1);
          expect(clash, `${mood} ${b.chords.join(' ')} lead ${e.midi}`).toBe(false);
        }
      }
    }
  });

  it('voice-leads chords smoothly (small average movement)', () => {
    let prev: number[] | null = null;
    let moved = 0;
    let n = 0;
    for (const sym of ['Dm9', 'G13', 'Cmaj9', 'A7b9', 'Dm9', 'G13', 'Em7', 'A7b9', 'Fmaj9', 'Bb13']) {
      const v = voiceLead(parseChord(sym).tones, prev, 50, 76, () => 0.5);
      if (prev) {
        const p = [...prev].sort((a, b) => a - b);
        v.forEach((m, i) => (moved += Math.abs(m - (p[i] ?? m))));
        n += v.length;
      }
      expect(Math.min(...v)).toBeGreaterThanOrEqual(46);
      expect(Math.max(...v)).toBeLessThanOrEqual(76);
      prev = v;
    }
    expect(moved / n).toBeLessThan(3); // semitones per voice per change
  });

  it('parses chord symbols and applies swing only to off-beats', () => {
    expect(parseChord('Bb13').root).toBe(10);
    expect(parseChord('F#m7b5').chordTones).toEqual(expect.arrayContaining([6, 9, 0, 4]));
    expect(() => parseChord('Cwhatever')).toThrow();
    expect(beatToSeconds(1, 60, 0.66)).toBeCloseTo(1);
    expect(beatToSeconds(0.5, 60, 0.66)).toBeCloseTo(0.66);
    expect(beatToSeconds(0.5, 60, 0.5)).toBeCloseTo(0.5);
  });

  it('every mood has bilingual metadata and a spec; culture moods explain their inspiration', () => {
    for (const id of MUSIC_MOOD_IDS) {
      const m = MUSIC_MOODS[id];
      expect(m.label.zh && m.label.en && m.description.zh && m.description.en).toBeTruthy();
      expect(MOOD_SPECS[id]).toBeTruthy();
      if (m.culture) expect(m.inspiration?.en && m.inspiration?.zh).toBeTruthy();
    }
  });
});

describe('analysis', () => {
  const sr = 48000;
  const sine = (amp: number, f = 997, seconds = 4) => {
    const x = new Float32Array(sr * seconds);
    for (let i = 0; i < x.length; i++) x[i] = amp * Math.sin((2 * Math.PI * f * i) / sr);
    return x;
  };

  it('measures peak and BS.1770 loudness of a reference sine', () => {
    const amp = Math.pow(10, -20 / 20);
    const s = analyze([sine(amp), sine(amp)], sr);
    expect(s.peakDbfs).toBeCloseTo(-20, 1);
    // Stereo 997 Hz sine at −20 dBFS peak ≈ −20 LUFS (BS.1770 reference behaviour).
    expect(s.integratedLufs).toBeGreaterThan(-20.6);
    expect(s.integratedLufs).toBeLessThan(-19.4);
    expect(s.loudnessRangeLu).toBeLessThan(0.5);
    expect(s.nanSamples).toBe(0);
    expect(s.clippedSamples).toBe(0);
  });

  it('flags silence, NaN and clipping', () => {
    const silent = analyze([new Float32Array(sr)], sr);
    expect(silent.integratedLufs).toBe(-Infinity);
    expect(silent.silentShare).toBe(1);
    const bad = new Float32Array(sr).fill(1);
    bad[10] = Number.NaN;
    const s = analyze([bad], sr);
    expect(s.nanSamples).toBe(1);
    expect(s.clippedSamples).toBeGreaterThan(0);
  });

  it('splits energy into bands and encodes a valid WAV', () => {
    const lowShare = bandShares([sine(0.5, 60, 1)], sr).low;
    const highShare = bandShares([sine(0.5, 9000, 1)], sr).high;
    expect(lowShare).toBeGreaterThan(0.8);
    expect(highShare).toBeGreaterThan(0.8);
    const wav = encodeWavMono([sine(0.5, 440, 1)], sr, 2);
    expect(String.fromCharCode(...wav.subarray(0, 4))).toBe('RIFF');
    expect(wav.length).toBe(44 + (sr / 2) * 2);
  });
});
