/** Objective "will this get boring?" metrics for the generative score (pure). */
import { barSeconds, Composer } from './composer';
import type { BarPlan } from './composer';
import type { MusicMoodId } from './moods';

export interface VarietyReport {
  mood: MusicMoodId;
  minutes: number;
  bars: number;
  cycles: number;
  sections: Record<string, number>;
  /** Distinct chord sequences among section instances (A/B/intro/break). */
  distinctProgressions: number;
  /** Section instances whose full note content is an exact repeat of an earlier one. */
  exactSectionRepeats: number;
  sectionInstances: number;
  distinctChords: number;
  keys: number[];
  tempoRange: [number, number];
  meanEventsPerBar: number;
  maxEventsPerBar: number;
  melodyNotesPerMinute: number;
  energyRange: [number, number];
}

export function composeMinutes(mood: MusicMoodId, seed: number, minutes: number): BarPlan[] {
  const c = new Composer(mood, seed);
  const bars: BarPlan[] = [];
  let t = 0;
  while (t < minutes * 60) {
    const b = c.nextBar();
    bars.push(b);
    t += barSeconds(b);
  }
  return bars;
}

export function varietyReport(mood: MusicMoodId, seed: number, minutes = 10): VarietyReport {
  const bars = composeMinutes(mood, seed, minutes);
  const sections: Record<string, number> = {};
  const progressions = new Set<string>();
  const fingerprints = new Set<string>();
  let repeats = 0;
  let instances = 0;
  let current: BarPlan[] = [];
  const flush = () => {
    if (!current.length) return;
    instances++;
    const first = current[0]!;
    sections[first.section] = (sections[first.section] ?? 0) + 1;
    progressions.add(current.map((b) => b.chords.join(' ')).join(' | '));
    const fp = current
      .map((b) => b.events.map((e) => `${e.inst}${e.midi}@${e.beat.toFixed(1)}`).join(','))
      .join('/');
    if (fingerprints.has(fp)) repeats++;
    fingerprints.add(fp);
    current = [];
  };
  for (const b of bars) {
    if (b.barInSection === 0) flush();
    current.push(b);
  }
  flush();
  const events = bars.map((b) => b.events.length);
  const melody = bars.reduce((n, b) => n + b.events.filter((e) => e.inst === 'lead').length, 0);
  const bpms = bars.map((b) => b.bpm);
  const energies = bars.map((b) => b.energy);
  return {
    mood,
    minutes,
    bars: bars.length,
    cycles: (bars[bars.length - 1]?.cycle ?? 0) + 1,
    sections,
    distinctProgressions: progressions.size,
    exactSectionRepeats: repeats,
    sectionInstances: instances,
    distinctChords: new Set(bars.flatMap((b) => b.chords)).size,
    keys: [...new Set(bars.map((b) => b.key))].sort((a, b) => a - b),
    tempoRange: [Math.min(...bpms), Math.max(...bpms)],
    meanEventsPerBar: events.reduce((a, b) => a + b, 0) / Math.max(1, events.length),
    maxEventsPerBar: Math.max(...events),
    melodyNotesPerMinute: melody / minutes,
    energyRange: [Math.min(...energies), Math.max(...energies)],
  };
}
