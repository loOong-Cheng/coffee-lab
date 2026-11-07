import { describe, expect, it } from 'vitest';
import { GUIDANCE_ORDER, TIERS, cueVisibility, evaluateSnap, mostSupportive } from './tiers';
import { MODEL, RECIPE, scoreStop, timeForYield, yieldAt } from './extraction';
import { createMissionStore } from './store';
import { availableActions } from './actions';
import { buildCompletionEvent, buildSummary, eventModeFor, XR_ACTIVITY_ID } from './summary';
import { NOT_TRAINED, PRACTICED, STEPS, STEP_ORDER, TOOL_INFO } from './content';
import { solve } from './testkit';

describe('guidance tier params (data)', () => {
  it('support fades from guided → assisted → independent', () => {
    const [g, a, i] = GUIDANCE_ORDER.map((k) => TIERS[k]);
    expect(g!.snapRadiusM).toBeGreaterThan(a!.snapRadiusM);
    expect(a!.snapRadiusM).toBeGreaterThan(i!.snapRadiusM);
    expect(g!.snapAngleDeg).toBeGreaterThan(a!.snapAngleDeg);
    expect(a!.snapAngleDeg).toBeGreaterThan(i!.snapAngleDeg);
    for (const t of Object.values(TIERS)) {
      expect(t.nearRadiusM).toBeGreaterThan(t.snapRadiusM);
      expect(t.hintDurationSec).toBeGreaterThan(0); // hints exist in every tier (accessibility)
    }
    expect(g!.cues).toBe('always');
    expect(a!.cues).toBe('idle-or-hint');
    expect(i!.cues).toBe('hint-only');
    expect(i!.stepLabels).toBe('hint-only');
    expect([g!.zoneRings, a!.zoneRings, i!.zoneRings]).toEqual(['all-compatible', 'near', 'snap-only']);
  });

  it('evaluateSnap: snap / near / none, with optional angle', () => {
    const t = TIERS.assisted;
    expect(evaluateSnap(t, 0.05).result).toBe('snap');
    expect(evaluateSnap(t, 0.1).result).toBe('near');
    expect(evaluateSnap(t, 0.5).result).toBe('none');
    expect(evaluateSnap(t, undefined).result).toBe('none');
    expect(evaluateSnap(t, 0.01, 50)).toEqual({ result: 'near', angleOk: false });
    expect(evaluateSnap(t, 0.01, -20)).toEqual({ result: 'snap', angleOk: true });
  });

  it('cueVisibility: guided always; assisted after idle or hint; independent only on hint', () => {
    const base = { elapsedSec: 20, hintUntilSec: null };
    expect(cueVisibility('guided', { ...base, idleSec: 0 })).toMatchObject({ cues: true, stepLabel: true, nextStepText: true, toolTags: true, reason: 'tier' });
    expect(cueVisibility('assisted', { ...base, idleSec: 3 })).toMatchObject({ cues: false, stepLabel: true, nextStepText: false });
    expect(cueVisibility('assisted', { ...base, idleSec: 12 })).toMatchObject({ cues: true, nextStepText: true, reason: 'idle' });
    expect(cueVisibility('independent', { ...base, idleSec: 999 })).toMatchObject({ cues: false, stepLabel: false, nextStepText: false });
    expect(cueVisibility('independent', { elapsedSec: 20, hintUntilSec: 25, idleSec: 0 })).toMatchObject({
      cues: true,
      stepLabel: true,
      reason: 'hint',
    });
    expect(cueVisibility('independent', { elapsedSec: 26, hintUntilSec: 25, idleSec: 0 }).cues).toBe(false);
  });

  it('mostSupportive picks the lowest-autonomy tier used', () => {
    expect(mostSupportive(['independent', 'assisted'])).toBe('assisted');
    expect(mostSupportive(['assisted', 'guided', 'independent'])).toBe('guided');
  });
});

describe('illustrative extraction model + stop accuracy', () => {
  it('yield curve is monotonic, starts after first drops, and reaches 36 g in a plausible window', () => {
    expect(yieldAt(0)).toBe(0);
    expect(yieldAt(MODEL.firstDropsSec)).toBe(0);
    let prev = 0;
    for (let t = 0; t < 45; t += 0.25) {
      const y = yieldAt(t);
      expect(y).toBeGreaterThanOrEqual(prev);
      prev = y;
    }
    const t36 = timeForYield(RECIPE.targetYieldG);
    expect(yieldAt(t36)).toBeCloseTo(RECIPE.targetYieldG, 5);
    expect(t36).toBeGreaterThan(22);
    expect(t36).toBeLessThan(34);
    expect(timeForYield(1)).toBeCloseTo(MODEL.firstDropsSec + Math.sqrt((2 * MODEL.rampSec) / MODEL.flowGPerSec), 5);
  });

  it('scores stop accuracy by grams from target', () => {
    expect(scoreStop(36)).toMatchObject({ band: 'on-target', direction: 'on', score: 1, ratio: 2 });
    expect(scoreStop(36.9)).toMatchObject({ band: 'on-target', score: 1 });
    expect(scoreStop(34)).toMatchObject({ band: 'close', direction: 'under', errorG: 2, score: 0.89 });
    expect(scoreStop(40)).toMatchObject({ band: 'close', direction: 'over', score: 0.67 });
    expect(scoreStop(46)).toMatchObject({ band: 'far', direction: 'over', score: 0 });
    expect(scoreStop(20)).toMatchObject({ band: 'far', direction: 'under', score: 0, ratio: 1.11 });
  });
});

describe('summary honesty + learning event', () => {
  function completed(source: 'xr' | 'pointer' | 'panel' | 'test' = 'test') {
    const store = createMissionStore('guided');
    // Stamp every learner action with the given source.
    const raw = store.dispatch;
    store.dispatch = (a) => raw('type' in a && a.type !== 'TICK' ? ({ ...a, source } as typeof a) : a);
    solve(store);
    return buildSummary(store.getState());
  }

  it('is always simulated, illustrative, and claims no real skill, taste, grip force or haptics', () => {
    const sum = completed();
    expect(sum.evidence).toBe('simulated');
    expect(sum.illustrativeModel).toBe(true);
    expect(sum.claims).toEqual({ realSkill: false, taste: false, gripForce: false, haptics: false });
    expect(sum.notTrained).toBe(NOT_TRAINED);
    const notTrainedEn = sum.notTrained.map((t) => t.en).join(' ');
    expect(notTrainedEn).toMatch(/force/i);
    expect(notTrainedEn).toMatch(/taste/i);
    expect(notTrainedEn).toMatch(/grind size/i);
  });

  it('reports spatial placement only when it was actually practised spatially', () => {
    expect(completed('pointer').practiced).toContain(PRACTICED.placement);
    const panel = completed('panel');
    expect(panel.spatialPractice).toBe(false);
    expect(panel.practiced).toContain(PRACTICED.placementPanel);
    expect(panel.practiced).not.toContain(PRACTICED.placement);
  });

  it('maps to a learner event with evidence "simulated" and the right mode', () => {
    const xr = completed('xr');
    const ev = buildCompletionEvent(xr, { immersive: false, touch: false });
    expect(ev).toMatchObject({
      activityId: XR_ACTIVITY_ID,
      lessonId: 'esp-workflow',
      mode: 'xr',
      guidance: 'guided',
      evidence: 'simulated',
      outcome: 'completed',
    });
    expect(ev.score).toBeGreaterThan(0.9);
    expect(ev.notes).toMatch(/simulated/);
    const ptr = completed('pointer');
    expect(eventModeFor(ptr, { immersive: false, touch: true })).toBe('mobile');
    expect(eventModeFor(ptr, { immersive: false, touch: false })).toBe('desktop');
    expect(eventModeFor(ptr, { immersive: true, touch: false })).toBe('xr');
  });
});

describe('accessible action list', () => {
  it('offers keyboard equivalents and marks the recommended one only when cues are visible', () => {
    const guided = createMissionStore('guided');
    const list = availableActions(guided.getState());
    expect(list.map((a) => a.id)).toEqual(['locate', 'grab-portafilter', 'grab-tamper', 'grab-cup', 'press-grinder', 'press-tare', 'press-brew']);
    expect(list.find((a) => a.recommended)?.id).toBe('locate');
    const indep = createMissionStore('independent');
    expect(availableActions(indep.getState()).some((a) => a.recommended)).toBe(false);
  });

  it('can complete the whole mission using only the action list (keyboard user)', () => {
    const store = createMissionStore('guided');
    for (let i = 0; i < 400 && store.getState().status !== 'complete'; i++) {
      const s = store.getState();
      const list = availableActions(s);
      const pick = list.find((a) => a.recommended);
      const waiting = s.grinder.running || s.flush.running || s.shot.status === 'settling';
      const brewing = s.shot.status === 'running' && s.shot.yieldG < 35.2;
      if (!pick || waiting || brewing) {
        store.dispatch({ type: 'TICK', dtSec: 0.1 });
        continue;
      }
      for (const a of pick.actions) store.dispatch(a);
    }
    const sum = buildSummary(store.getState());
    expect(sum.completed).toBe(true);
    expect(sum.primaryInput).toBe('panel');
    expect(sum.mistakes).toBe(0);
  });

  it('has bilingual labels', () => {
    const store = createMissionStore('guided');
    store.dispatch({ type: 'GRAB', item: 'portafilter', hand: 'pointer' });
    for (const a of availableActions(store.getState())) {
      expect(a.label.en.length).toBeGreaterThan(3);
      expect(a.label.zh.length).toBeGreaterThan(1);
      expect(a.label.en).not.toMatch(/\{/);
      expect(a.label.zh).not.toMatch(/\{/);
    }
  });
});

describe('content completeness', () => {
  it('every step and tool has bilingual text', () => {
    for (const id of STEP_ORDER) {
      const s = STEPS[id];
      for (const t of [s.title, s.doXr, s.doScreen, s.why]) {
        expect(t.en.trim()).not.toBe('');
        expect(t.zh.trim()).not.toBe('');
      }
    }
    for (const info of Object.values(TOOL_INFO)) {
      expect(info.name.zh && info.name.en && info.purpose.zh && info.purpose.en).toBeTruthy();
    }
  });
});
