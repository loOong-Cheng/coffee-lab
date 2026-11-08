import { describe, expect, it } from 'vitest';
import { companionGroupForStep, parseSecondsRange, shotSlot } from './companion';
import { resolvePlan } from './catalog';
import type { PracticePlan } from './plan';

function plan(id: string): PracticePlan {
  const r = resolvePlan(id);
  if (!r.ok) throw new Error(`no plan ${id}`);
  return r.plan;
}

describe('brew companions are attached from the real content', () => {
  it('espresso first-shot guide: one shot timer across brew → stop, recipe target + reference', () => {
    const c = plan('esp-first-real-shot-guide').companion;
    expect(c).toMatchObject({ kind: 'shot-timer', groups: [['brew', 'stop']], doseG: 18, targetOutG: 36, referenceSec: [25, 35], referenceFrom: 'recipe' });
    expect(companionGroupForStep(c, 'stop')).toEqual(['brew', 'stop']);
    expect(companionGroupForStep(c, 'tamp')).toBeNull();
  });

  it('three-shot dial-in session gets three separate shot timers', () => {
    const c = plan('exp-dialing-in-session').companion;
    expect(c?.kind).toBe('shot-timer');
    expect(c && c.kind === 'shot-timer' ? c.groups : []).toEqual([['shot-1'], ['shot-2'], ['shot-3']]);
    expect(shotSlot(['shot-2'])).toBe('shot:shot-2');
  });

  it('atlas espresso drinks: the extraction step(s), with the drink’s own time note when it has one', () => {
    expect(plan('drink:espresso-shot').companion).toMatchObject({ kind: 'shot-timer', groups: [['s4', 's5']], targetOutG: 36, referenceSec: [25, 35], referenceFrom: 'recipe' });
    expect(plan('drink:ristretto').companion).toMatchObject({ groups: [['s3']], targetOutG: 24, referenceSec: [20, 30] });
    expect(plan('drink:lungo').companion).toMatchObject({ targetOutG: 54, referenceSec: [30, 45] });
    expect(plan('drink:caffe-latte').companion).toMatchObject({ kind: 'shot-timer', groups: [['s2']], referenceSec: [25, 35], referenceFrom: 'common' });
    for (const id of ['americano', 'long-black', 'affogato', 'espresso-macchiato', 'cortado', 'cappuccino', 'flat-white', 'mocha']) {
      expect(plan(`drink:${id}`).companion?.kind, id).toBe('shot-timer');
    }
  });

  it('pour-over: first-cup guide and atlas pour-overs get the schedule from bloom to drain', () => {
    expect(plan('po-first-real-cup-guide').companion).toEqual({ kind: 'pour-schedule', templateId: 'cone', stepIds: ['bloom', 'pour-1', 'pour-2', 'drawdown'], doseG: 15 });
    expect(plan('drink:pourover-cone').companion).toEqual({ kind: 'pour-schedule', templateId: 'cone', stepIds: ['s3', 's4', 's5'], doseG: 15 });
    expect(plan('drink:chemex-brew').companion).toEqual({ kind: 'pour-schedule', templateId: 'chemex', stepIds: ['s3', 's4', 's5'], doseG: 30 });
  });

  it('no companion where it would not fit (steaming, immersion, cleaning)', () => {
    expect(plan('esp-milk-basics-steam').companion).toBeUndefined();
    expect(plan('drink:french-press-coffee').companion).toBeUndefined();
    expect(plan('exp-cleaning-care-routine').companion).toBeUndefined();
  });

  it('a companion step drops the generic step timer only in the UI — plan steps keep their reference', () => {
    const p = plan('esp-first-real-shot-guide');
    expect(p.steps.find((s) => s.id === 'brew')).toMatchObject({ timerSec: 30, timerMode: 'reference' });
  });
});

describe('parseSecondsRange', () => {
  it('reads "25–30 s" style ranges only', () => {
    expect(parseSecondsRange({ zh: '', en: 'About 25–30 s from pump start' })).toEqual([25, 30]);
    expect(parseSecondsRange({ zh: '', en: 'Commonly 20-30 s; let taste decide.' })).toEqual([20, 30]);
    expect(parseSecondsRange({ zh: '', en: 'Total time commonly about 2:30–3:30' })).toBeNull();
    expect(parseSecondsRange({ zh: '', en: '45–30 s' })).toBeNull();
    expect(parseSecondsRange(undefined)).toBeNull();
  });
});
