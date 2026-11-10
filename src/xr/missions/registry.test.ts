import { describe, expect, it } from 'vitest';
import { MISSIONS, getMission, missionHref, parseMissionParam } from './registry';
import { createStore, completionEvent, type CoreAction } from '../mission/core';
import { solve as solveEspresso } from '../mission/testkit';
import { createMissionStore } from '../mission/store';
import { getActivity, getLesson } from '../../content';

describe('mission registry + deep links', () => {
  it('parses ?mission=<id> and rejects unknown ids', () => {
    expect(parseMissionParam('?mission=pourover-bloom')).toBe('pourover-bloom');
    expect(parseMissionParam('mission=station-tour&x=1')).toBe('station-tour');
    expect(parseMissionParam('?x=1&mission=espresso-first-shot')).toBe('espresso-first-shot');
    expect(parseMissionParam('?mission=nope')).toBeNull();
    expect(parseMissionParam('')).toBeNull();
    expect(parseMissionParam(null)).toBeNull();
    expect(parseMissionParam('?mission=%3Cscript%3E')).toBeNull();
    expect(missionHref('station-tour')).toBe('/xr?mission=station-tour');
  });

  it('has the three missions with the agreed activity / lesson ids', () => {
    expect(MISSIONS.map((m) => [m.id, m.activityId, m.lessonId])).toEqual([
      ['station-tour', 'esp-meet-the-machine-xr', 'esp-meet-the-machine'],
      ['espresso-first-shot', 'esp-workflow-xr', 'esp-workflow'],
      ['pourover-bloom', 'po-ratio-bloom-xr', 'po-ratio-bloom'],
    ]);
    for (const m of MISSIONS) {
      expect(m.practices.length).toBeGreaterThan(1);
      expect(m.notTrains.length).toBeGreaterThan(1);
      expect(m.minutes[0]).toBeLessThan(m.minutes[1]);
      for (const t of [m.title, m.short, m.intro, ...m.practices, ...m.notTrains, ...m.stepTitles]) {
        expect(t.en.length).toBeGreaterThan(0);
        expect(t.zh.length).toBeGreaterThan(0);
      }
    }
    expect(getMission('station-tour')?.id).toBe('station-tour');
    expect(getMission('x')).toBeNull();
  });

  it('each mission is linked from its lesson by a spatial-practice activity with honest limits', () => {
    for (const m of MISSIONS) {
      const a = getActivity(m.activityId);
      expect(a, m.activityId).toBeDefined();
      expect(a?.kind).toBe('spatial-practice');
      expect(a?.lessonId).toBe(m.lessonId);
      expect(getLesson(m.lessonId)?.activityIds).toContain(m.activityId);
      expect(getLesson(m.lessonId)?.checkForUnderstanding).not.toContain(m.activityId); // optional, never required
      if (a?.kind === 'spatial-practice') {
        expect(a.missionId).toBe(m.id);
        expect(a.limits.en).toMatch(/taste/i);
        expect(a.limits.en).toMatch(/grip|force|touch|weight/i);
        expect(a.limits.zh.length).toBeGreaterThan(10);
      }
    }
  });

  it('each mission says what it does NOT train (grip/feel, heat; taste or pour control where relevant)', () => {
    const text = (id: string) => getMission(id)!.notTrains.map((x) => x.en).join(' ');
    for (const m of MISSIONS) {
      expect(text(m.id), m.id).toMatch(/heat|hot/i);
      expect(text(m.id), m.id).toMatch(/grip|force|feel/i);
    }
    expect(text('espresso-first-shot')).toMatch(/taste/i);
    expect(text('pourover-bloom')).toMatch(/taste/i);
    expect(text('pourover-bloom')).toMatch(/pour control/i);
  });

  it('every mission starts honest: simulated evidence, no real-skill claims, not complete', () => {
    for (const m of MISSIONS) {
      const st = createStore((s, a: CoreAction) => m.reduce(s, a), m.create('assisted'));
      const r = m.result(st.getState());
      expect(r.evidence).toBe('simulated');
      expect(r.completed).toBe(false);
      expect(r.claims).toEqual({ realSkill: false, taste: false, gripForce: false, haptics: false });
      expect(completionEvent(m, r, { immersive: false, touch: false }).outcome).toBe('retry');
      expect(m.hud(st.getState()).stepCount).toBe(m.stepTitles.length);
    }
  });

  it('the espresso adapter maps the existing summary faithfully', () => {
    const esp = getMission('espresso-first-shot')!;
    const store = createMissionStore('guided');
    solveEspresso(store);
    const r = esp.result(store.getState() as never);
    expect(r.completed).toBe(true);
    expect(r.stats.map((x) => x.label.en)).toContain('Stop accuracy');
    expect(r.note?.en).toMatch(/target/);
    expect(completionEvent(esp, r, { immersive: false, touch: false })).toMatchObject({ activityId: 'esp-workflow-xr', mode: 'desktop' });
  });
});

describe('action-list memo key is sound (UI only recomputes the list when the key changes)', () => {
  it('equal actionsKey ⇒ identical actions + recommendations, across random reachable states', async () => {
    const { mulberry32 } = await import('../mission/testkit');
    for (const m of MISSIONS) {
      for (const g of ['guided', 'assisted', 'independent'] as const) {
        const rnd = mulberry32(g.length * 97 + m.id.length);
        const st = createStore((s, a: CoreAction) => m.reduce(s, a), m.create(g));
        const seen = new Map<string, string>();
        for (let i = 0; i < 1500 && st.getState().status !== 'complete'; i++) {
          const s = st.getState();
          const key = m.actionsKey(s);
          const sig = JSON.stringify(m.actions(s).map((a) => [a.id, a.recommended, a.label.en]));
          const prev = seen.get(key);
          if (prev !== undefined) expect(sig, `${m.id}/${g} key=${key}`).toBe(prev);
          else seen.set(key, sig);
          const list = m.actions(s);
          const r = rnd();
          if (r < 0.35 || list.length === 0) st.dispatch({ type: 'TICK', dtSec: 0.1 + rnd() * 2 });
          else {
            const pick = rnd() < 0.6 ? (list.find((a) => a.recommended) ?? list[0]!) : list[Math.floor(rnd() * list.length)]!;
            pick.actions.forEach((a) => st.dispatch(a as CoreAction));
          }
        }
      }
    }
  });
});
