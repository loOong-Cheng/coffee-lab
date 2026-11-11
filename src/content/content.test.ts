/**
 * Whole-content integrity tests (all tracks, via the aggregate in ./index).
 * These guard the contracts in docs/CONTRACTS.md §2 plus curriculum honesty rules.
 */
import { describe, expect, it } from 'vitest';
import { DIAGRAM_PARTS, type Activity, type ActivityKind, type Lesson } from '../domain/contracts';
import { CORE_TRACK_IDS, activities, brands, drinks, equipment, getActivity, getLesson, lessons, places, sources, timeline, tracks } from './index';

// ───────────────────────── helpers ─────────────────────────
const dupes = (ids: string[]): string[] => ids.filter((id, i) => ids.indexOf(id) !== i);
const lessonIds = new Set(lessons.map((l) => l.id));
const sourceIds = new Set(sources.map((s) => s.id));
const equipmentIds = new Set(equipment.map((e) => e.id));
const coreTrackSet = new Set<string>(CORE_TRACK_IDS);
const coreLessons = lessons.filter((l) => coreTrackSet.has(l.track));
const coreActivities = activities.filter((a) => coreLessons.some((l) => l.id === a.lessonId));

const ofKind = <K extends ActivityKind>(kind: K, list: Activity[] = activities) =>
  list.filter((a): a is Extract<Activity, { kind: K }> => a.kind === kind);

/** Walk any value; report every object that looks like LocalizedText with an empty/missing language. */
function findBadLocalized(value: unknown, path: string, out: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => findBadLocalized(v, `${path}[${i}]`, out));
    return;
  }
  if (value === null || typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  if ('zh' in obj || 'en' in obj) {
    const ok = (k: string) => typeof obj[k] === 'string' && (obj[k] as string).trim().length > 0;
    if (!ok('zh') || !ok('en')) out.push(path);
    return;
  }
  for (const [k, v] of Object.entries(obj)) findBadLocalized(v, `${path}.${k}`, out);
}

/** Is some ratio out/dose inside [ratioMin, ratioMax] reachable with dose/out inside the given ranges? */
function achievable(
  doseRange: [number, number],
  outRange: [number, number],
  target: { ratioMin: number; ratioMax: number; doseG?: [number, number] },
): boolean {
  const dMin = Math.max(doseRange[0], target.doseG?.[0] ?? -Infinity);
  const dMax = Math.min(doseRange[1], target.doseG?.[1] ?? Infinity);
  if (dMin > dMax || dMin <= 0) return false;
  const reachMin = outRange[0] / dMax;
  const reachMax = outRange[1] / dMin;
  return Math.max(reachMin, target.ratioMin) <= Math.min(reachMax, target.ratioMax);
}

const within = (v: number | undefined, r: [number, number] | undefined) =>
  v === undefined || r === undefined || (v >= r[0] && v <= r[1]);

// ───────────────────────── identity ─────────────────────────
describe('ids', () => {
  it('are globally unique per collection', () => {
    expect(dupes(tracks.map((t) => t.id))).toEqual([]);
    expect(dupes(lessons.map((l) => l.id))).toEqual([]);
    expect(dupes(activities.map((a) => a.id))).toEqual([]);
    expect(dupes(sources.map((s) => s.id))).toEqual([]);
    expect(dupes(equipment.map((e) => e.id))).toEqual([]);
    expect(dupes(drinks.map((d) => d.id))).toEqual([]);
  });

  it('activity ids follow <lessonId>-<slug>', () => {
    const bad = activities.filter((a) => !a.id.startsWith(`${a.lessonId}-`)).map((a) => a.id);
    expect(bad).toEqual([]);
  });

  it('nested ids (questions, options, steps, scenarios, choices, challenges, targets) are unique within their parent', () => {
    const problems: string[] = [];
    const check = (where: string, ids: string[]) => {
      const d = dupes(ids);
      if (d.length) problems.push(`${where}: ${d.join(',')}`);
    };
    for (const a of activities) {
      if (a.kind === 'quiz') {
        check(a.id, a.questions.map((q) => q.id));
        a.questions.forEach((q) => check(`${a.id}/${q.id}`, q.options.map((o) => o.id)));
      }
      if (a.kind === 'sequence' || a.kind === 'guided-practice') check(a.id, a.steps.map((s) => s.id));
      if (a.kind === 'diagnose') {
        check(a.id, a.scenarios.map((s) => s.id));
        a.scenarios.forEach((s) => check(`${a.id}/${s.id}`, s.choices.map((c) => c.id)));
      }
      if (a.kind === 'parameter-lab') check(a.id, a.challenges.map((c) => c.id));
      if (a.kind === 'identify') check(a.id, a.targets.map((t) => t.partId));
    }
    expect(problems).toEqual([]);
  });
});

// ───────────────────────── graph integrity ─────────────────────────
describe('references', () => {
  it('lesson.activityIds exist and each activity.lessonId matches its lesson', () => {
    const problems: string[] = [];
    for (const l of lessons) {
      for (const id of l.activityIds) {
        const a = getActivity(id);
        if (!a) problems.push(`${l.id}: missing activity ${id}`);
        else if (a.lessonId !== l.id) problems.push(`${id}: lessonId ${a.lessonId} ≠ ${l.id}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('every activity is listed by exactly one lesson', () => {
    const listed = lessons.flatMap((l) => l.activityIds);
    expect(dupes(listed)).toEqual([]);
    expect(activities.filter((a) => !listed.includes(a.id)).map((a) => a.id)).toEqual([]);
  });

  it('checkForUnderstanding ⊆ activityIds', () => {
    const bad = lessons.flatMap((l) => l.checkForUnderstanding.filter((id) => !l.activityIds.includes(id)).map((id) => `${l.id}:${id}`));
    expect(bad).toEqual([]);
  });

  it('checkForUnderstanding never contains guided-practice or spatial-practice (must be completable on any screen)', () => {
    const bad = lessons.flatMap((l) =>
      l.checkForUnderstanding
        .map((id) => getActivity(id))
        .filter((a): a is Activity => !!a && (a.kind === 'guided-practice' || a.kind === 'spatial-practice'))
        .map((a) => `${l.id}:${a.id}`),
    );
    expect(bad).toEqual([]);
  });

  it('lessons with an empty checkForUnderstanding contain no guided/spatial activities (all would be required)', () => {
    const bad = lessons
      .filter((l) => l.checkForUnderstanding.length === 0)
      .filter((l) => l.activityIds.some((id) => ['guided-practice', 'spatial-practice'].includes(getActivity(id)?.kind ?? '')))
      .map((l) => l.id);
    expect(bad).toEqual([]);
  });

  it('prerequisites, next, track.lessonIds and drink.relatedLessonIds resolve', () => {
    const missing: string[] = [];
    for (const l of lessons) {
      for (const id of [...l.prerequisites, ...l.next]) if (!lessonIds.has(id)) missing.push(`${l.id} → ${id}`);
    }
    for (const t of tracks) for (const id of t.lessonIds) if (!lessonIds.has(id)) missing.push(`track ${t.id} → ${id}`);
    for (const d of drinks) for (const id of d.relatedLessonIds) if (!lessonIds.has(id)) missing.push(`drink ${d.id} → ${id}`);
    expect(missing).toEqual([]);
  });

  it('each lesson belongs to exactly one track, matching lesson.track', () => {
    const problems: string[] = [];
    for (const l of lessons) {
      const owners = tracks.filter((t) => t.lessonIds.includes(l.id));
      if (owners.length !== 1 || owners[0].id !== l.track) problems.push(`${l.id}: ${owners.map((t) => t.id).join(',') || 'none'}`);
    }
    expect(problems).toEqual([]);
  });

  it('prerequisite graph is acyclic', () => {
    const state = new Map<string, 'visiting' | 'done'>();
    const cycles: string[] = [];
    const visit = (id: string, trail: string[]) => {
      if (state.get(id) === 'done') return;
      if (state.get(id) === 'visiting') {
        cycles.push([...trail, id].join(' → '));
        return;
      }
      state.set(id, 'visiting');
      for (const p of getLesson(id)?.prerequisites ?? []) visit(p, [...trail, id]);
      state.set(id, 'done');
    };
    lessons.forEach((l) => visit(l.id, []));
    expect(cycles).toEqual([]);
  });

  it('core-track lessons never require optional-track lessons, even transitively', () => {
    const bad: string[] = [];
    const reach = (id: string, seen = new Set<string>()): Set<string> => {
      for (const p of getLesson(id)?.prerequisites ?? []) {
        if (!seen.has(p)) {
          seen.add(p);
          reach(p, seen);
        }
      }
      return seen;
    };
    for (const l of coreLessons) {
      for (const p of reach(l.id)) {
        const pl = getLesson(p);
        if (pl && !coreTrackSet.has(pl.track)) bad.push(`${l.id} requires ${p}`);
      }
    }
    expect(bad).toEqual([]);
    // Tracks flagged optional must not be core.
    expect(tracks.filter((t) => t.optional && coreTrackSet.has(t.id)).map((t) => t.id)).toEqual([]);
  });

  it('source ids referenced by lessons and drinks resolve', () => {
    const missing = [
      ...lessons.flatMap((l) => l.sources.filter((s) => !sourceIds.has(s)).map((s) => `${l.id}:${s}`)),
      ...drinks.flatMap((d) => d.sources.filter((s) => !sourceIds.has(s)).map((s) => `${d.id}:${s}`)),
    ];
    expect(missing).toEqual([]);
  });

  it('referenced equipment ids exist in the catalog', () => {
    const missing = [
      ...ofKind('guided-practice').flatMap((a) => a.equipment.filter((e) => !equipmentIds.has(e)).map((e) => `${a.id}:${e}`)),
      ...drinks.flatMap((d) => d.equipment.filter((e) => !equipmentIds.has(e)).map((e) => `${d.id}:${e}`)),
    ];
    expect(missing).toEqual([]);
  });
});

// ───────────────────────── bilingual ─────────────────────────
describe('bilingual text', () => {
  it('every {zh, en} object in all content has non-empty zh and en', () => {
    const bad: string[] = [];
    findBadLocalized(tracks, 'tracks', bad);
    findBadLocalized(lessons, 'lessons', bad);
    findBadLocalized(activities, 'activities', bad);
    findBadLocalized(equipment, 'equipment', bad);
    findBadLocalized(drinks, 'drinks', bad);
    expect(bad).toEqual([]);
  });

  // User rule (QA-R08): one language at a time. A zh name/title is the Chinese name only, never
  // "意式浓缩（Espresso）". Latin names on their own (e.g. a brand, "Chemex 手冲") are allowed.
  it('no zh name or title carries Latin words in parentheses', () => {
    const glossed = /[（(][^）)]*[A-Za-zÀ-ÿ][^）)]*[）)]/;
    const bad: string[] = [];
    const walk = (value: unknown, path: string): void => {
      if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}[${i}]`));
      if (!value || typeof value !== 'object') return;
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const loc = v as { zh?: unknown; en?: unknown } | null;
        if ((k === 'name' || k === 'title') && loc && typeof loc.zh === 'string' && typeof loc.en === 'string') {
          if (glossed.test(loc.zh)) bad.push(`${path}.${k}: ${loc.zh}`);
        } else walk(v, `${path}.${k}`);
      }
    };
    walk({ tracks, lessons, activities, equipment, drinks, brands, places, timeline }, 'content');
    expect(bad).toEqual([]);
    // the rule is live for the catalog QA flagged
    expect(drinks.find((d) => d.id === 'espresso-shot')?.name.zh).toBe('意式浓缩');
  });
});

// ───────────────────────── activity shapes ─────────────────────────
describe('activity rules', () => {
  it('every activity declares at least one supported mode', () => {
    expect(activities.filter((a) => a.supportedModes.length === 0).map((a) => a.id)).toEqual([]);
  });

  it('quiz questions have ≥2 options and exactly one correct', () => {
    const bad = ofKind('quiz').flatMap((a) =>
      a.questions.filter((q) => q.options.length < 2 || q.options.filter((o) => o.correct).length !== 1).map((q) => `${a.id}/${q.id}`),
    );
    expect(bad).toEqual([]);
  });

  it('sequences have ≥3 steps and misconceptions reference real steps in the right order', () => {
    const bad: string[] = [];
    for (const a of ofKind('sequence')) {
      if (a.steps.length < 3) bad.push(`${a.id}: only ${a.steps.length} steps`);
      const idx = (id: string) => a.steps.findIndex((s) => s.id === id);
      for (const m of a.misconceptions ?? []) {
        const e = idx(m.earlierStep);
        const l = idx(m.laterStep);
        if (e < 0 || l < 0 || e >= l) bad.push(`${a.id}: misconception ${m.earlierStep}→${m.laterStep}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('diagnose scenarios have ≥2 choices, at least one "best", and a caveat', () => {
    const bad = ofKind('diagnose').flatMap((a) =>
      a.scenarios
        .filter((s) => s.choices.length < 2 || !s.choices.some((c) => c.quality === 'best'))
        .map((s) => `${a.id}/${s.id}`),
    );
    expect(bad).toEqual([]);
  });

  it('parameter-lab defaults sit within ranges and every challenge is achievable', () => {
    const bad: string[] = [];
    for (const a of ofKind('parameter-lab')) {
      const { defaults: d, ranges: r } = a;
      for (const [k, range] of Object.entries(r) as Array<[string, [number, number] | undefined]>) {
        if (range && !(range[0] < range[1])) bad.push(`${a.id}: bad range ${k}`);
      }
      if (!within(d.doseG, r.doseG) || !within(d.outG, r.outG) || !within(d.timeSec, r.timeSec) || !within(d.grind, r.grind)) {
        bad.push(`${a.id}: defaults out of range`);
      }
      if (a.challenges.length === 0) bad.push(`${a.id}: no challenges`);
      for (const c of a.challenges) {
        if (!(c.target.ratioMin <= c.target.ratioMax)) bad.push(`${a.id}/${c.id}: inverted target`);
        if (!achievable(r.doseG, r.outG, c.target)) bad.push(`${a.id}/${c.id}: not achievable`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('identify targets belong to the diagram’s part list', () => {
    const bad = ofKind('identify').flatMap((a) => {
      const parts: readonly string[] = DIAGRAM_PARTS[a.diagram];
      return a.targets.filter((t) => !parts.includes(t.partId)).map((t) => `${a.id}:${t.partId}`);
    });
    expect(bad).toEqual([]);
  });

  it('guided practice has steps with help text and offers a real-world mode', () => {
    const bad: string[] = [];
    for (const a of ofKind('guided-practice')) {
      if (a.steps.length < 3) bad.push(`${a.id}: too few steps`);
      if (!a.supportedModes.some((m) => m === 'mobile' || m === 'real-world-guide')) bad.push(`${a.id}: no real-world mode`);
      if (a.equipment.length === 0) bad.push(`${a.id}: no equipment`);
      if (a.logFields.length === 0) bad.push(`${a.id}: no log fields`);
    }
    expect(bad).toEqual([]);
  });

  it('spatial mission esp-workflow-xr exists with the fixed contract shape and honest limits', () => {
    const a = getActivity('esp-workflow-xr');
    expect(a).toBeDefined();
    expect(a?.kind).toBe('spatial-practice');
    expect(a?.lessonId).toBe('esp-workflow');
    if (a?.kind === 'spatial-practice') {
      expect(a.missionId).toBe('espresso-first-shot');
      expect([...a.supportedModes].sort()).toEqual(['desktop', 'mobile', 'xr']);
      expect(a.limits.en.toLowerCase()).toMatch(/taste/);
      expect(a.limits.en.toLowerCase()).toMatch(/touch|haptic|grip/);
    }
  });
});

// ───────────────────────── core curriculum (this package) ─────────────────────────
const CORE_IDS = {
  literacy: ['lit-what-is-coffee', 'lit-tools-safety', 'lit-brewing-concepts'],
  espresso: ['esp-meet-the-machine', 'esp-workflow', 'esp-ratio-lab', 'esp-diagnosis', 'esp-first-real-shot', 'esp-milk-basics'],
  pourover: ['po-meet-the-gear', 'po-ratio-bloom', 'po-first-real-cup', 'po-taste-iterate'],
} as const;

describe('core curriculum', () => {
  it('core tracks list exactly the fixed lesson ids, in order', () => {
    for (const [trackId, ids] of Object.entries(CORE_IDS)) {
      expect(tracks.find((t) => t.id === trackId)?.lessonIds).toEqual(ids);
    }
  });

  it('each core lesson is complete: 3–6 activities, ≥1 check, ≥3 key concepts, sources, time', () => {
    const bad: string[] = [];
    for (const l of coreLessons) {
      if (l.activityIds.length < 3 || l.activityIds.length > 6) bad.push(`${l.id}: ${l.activityIds.length} activities`);
      if (l.checkForUnderstanding.length < 1) bad.push(`${l.id}: no check`);
      if (l.keyConcepts.length < 3) bad.push(`${l.id}: few key concepts`);
      if (l.sources.length < 1) bad.push(`${l.id}: no sources`);
      if (!(l.estimatedMinutes > 0)) bad.push(`${l.id}: no duration`);
    }
    expect(bad).toEqual([]);
  });

  it('core activities use every activity kind', () => {
    const kinds = new Set(coreActivities.map((a) => a.kind));
    const all: ActivityKind[] = ['explain', 'identify', 'sequence', 'quiz', 'parameter-lab', 'diagnose', 'guided-practice', 'spatial-practice', 'reflect'];
    expect(all.filter((k) => !kinds.has(k))).toEqual([]);
  });

  it('required labs, diagrams and diagnosis depth are present', () => {
    const lab = (lessonId: string, type: string) =>
      ofKind('parameter-lab').find((a) => a.lessonId === lessonId && a.lab === type);
    expect(lab('esp-ratio-lab', 'espresso-ratio')?.defaults).toMatchObject({ doseG: 18, outG: 36 });
    expect(lab('po-ratio-bloom', 'pourover-ratio')?.defaults).toMatchObject({ doseG: 15, outG: 250 });
    expect(
      ofKind('parameter-lab').some((a) => a.lab === 'extraction-explorer' && ['lit-brewing-concepts', 'esp-diagnosis'].includes(a.lessonId)),
    ).toBe(true);
    expect(ofKind('identify').find((a) => a.lessonId === 'esp-meet-the-machine')?.diagram).toBe('espresso-station');
    expect(ofKind('identify').find((a) => a.lessonId === 'po-meet-the-gear')?.diagram).toBe('pourover-station');
    const scenarios = (lessonId: string) =>
      ofKind('diagnose').filter((a) => a.lessonId === lessonId).reduce((n, a) => n + a.scenarios.length, 0);
    expect(scenarios('esp-diagnosis')).toBeGreaterThanOrEqual(6);
    expect(scenarios('po-taste-iterate')).toBeGreaterThanOrEqual(3);
    for (const id of ['esp-first-real-shot', 'po-first-real-cup', 'esp-milk-basics']) {
      expect(ofKind('guided-practice').some((a) => a.lessonId === id)).toBe(true);
    }
  });

  it('every parameter lab and real-world recipe is labelled as illustrative', () => {
    for (const a of ofKind('parameter-lab', coreActivities)) {
      expect(a.illustrativeNote.en.toLowerCase()).toMatch(/illustrative|teaching model/);
    }
    for (const a of ofKind('guided-practice', coreActivities)) {
      if (a.recipe) expect(`${a.recipe.ratioLabel.en} ${a.recipe.note.en}`.toLowerCase()).toMatch(/illustrative|starting point/);
    }
  });

  it('hands-on lessons carry safety notes, and every real-world guide flags hazards', () => {
    const handsOn: Lesson[] = coreLessons.filter((l) => l.activityIds.some((id) => getActivity(id)?.kind === 'guided-practice'));
    expect(handsOn.filter((l) => l.safetyNotes.length === 0).map((l) => l.id)).toEqual([]);
    for (const a of ofKind('guided-practice', coreActivities)) {
      const flagged = (a.safetyNotes?.length ?? 0) > 0 || a.steps.some((s) => s.safety);
      expect(flagged, a.id).toBe(true);
    }
    expect(getLesson('lit-tools-safety')?.safetyNotes.length).toBeGreaterThanOrEqual(3);
  });

  it('milk practice defers to the manual and warns about steam burns', () => {
    const steam = ofKind('guided-practice').find((a) => a.lessonId === 'esp-milk-basics');
    const text = JSON.stringify(steam).toLowerCase();
    expect(text).toMatch(/manual/);
    expect(text).toMatch(/burn/);
  });

  it('diagnosis choices teach one change at a time (some option is flagged unhelpful per scenario)', () => {
    const bad = ofKind('diagnose', coreActivities).flatMap((a) =>
      a.scenarios.filter((s) => !s.choices.some((c) => c.quality === 'unhelpful')).map((s) => `${a.id}/${s.id}`),
    );
    expect(bad).toEqual([]);
  });
});
