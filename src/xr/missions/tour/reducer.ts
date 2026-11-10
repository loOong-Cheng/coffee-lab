/**
 * "station-tour" pure state machine: explore (inspect tools) → find-and-place
 * challenges. Physical moves follow the espresso counter's snap rules.
 * Tier differences: guided = names + arrows + ghosts + tags; assisted = names,
 * cues after idle/hint; independent = functional prompts ("the tool that…"), no cues unless hinted.
 */
import type { Guidance, LocalizedText } from '../../../domain/contracts';
import type { FeedbackKind, HandId, InputSource, InspectableId, ItemId, ItemState, MissionAction } from '../../mission/types';
import type { CoreState, CoreFeedback } from '../../mission/core';
import { emptyMetrics, hintWindow, reduceMeta } from '../../mission/core';
import { TIERS, evaluateSnap } from '../../mission/tiers';
import { GUIDANCE_LABEL, FEEDBACK, TOOL_INFO, ZONE_NAME, fmt } from '../../mission/content';
import { ITEM_HOME, ZONE_ACCEPTS, type CueTarget } from '../../mission/reducer';
import { CHALLENGES, EXPLORE_TARGET, INSPECTABLE, T, tourInfo, tourSafety, type Challenge } from './content';

export interface TourState extends CoreState {
  missionId: 'station-tour';
  items: Record<ItemId, ItemState>;
  phase: 'explore' | 'challenge';
  inspected: InspectableId[];
  challengeIndex: number;
  /** Wrong attempts per challenge. */
  misses: number[];
  nearMisses: number;
  effects: Array<{ type: string; name?: 'tap' | 'select' | 'correct' | 'incorrect' | 'complete' | 'snap' | 'whoosh' | 'reset' }>;
}

const ITEMS: readonly ItemId[] = ['portafilter', 'cup', 'tamper'];

export function createTour(guidance: Guidance = 'guided', carry?: { resets: number; attempt: number; seq: number }): TourState {
  return {
    missionId: 'station-tour',
    status: 'playing',
    guidance,
    guidanceUsed: [guidance],
    attempt: carry?.attempt ?? 1,
    hintUntilSec: null,
    feedback: carry ? { seq: carry.seq + 1, kind: 'info', code: 'reset', text: FEEDBACK.reset } : null,
    effects: carry ? [{ type: 'reset' }, { type: 'sound', name: 'reset' }] : [],
    metrics: emptyMetrics(carry?.resets ?? 0),
    completedAtSec: null,
    items: {
      portafilter: { zone: ITEM_HOME.portafilter, heldBy: null },
      cup: { zone: ITEM_HOME.cup, heldBy: null },
      tamper: { zone: ITEM_HOME.tamper, heldBy: null },
    },
    phase: 'explore',
    inspected: [],
    challengeIndex: 0,
    misses: CHALLENGES.map(() => 0),
    nearMisses: 0,
  };
}

export function currentChallenge(s: TourState): Challenge | null {
  return s.phase === 'challenge' ? (CHALLENGES[s.challengeIndex] ?? null) : null;
}

/** Prompt wording depends on the tier: independent asks by function, not by name. */
export function promptOf(c: Challenge, g: Guidance): LocalizedText {
  return g === 'independent' ? c.functional : c.named;
}

export function tourCue(s: TourState): CueTarget | null {
  if (s.status !== 'playing') return null;
  if (s.phase === 'explore') {
    // Point at the next tool not yet inspected (shown only when the tier shows cues).
    const next = INSPECTABLE.find((id) => !s.inspected.includes(id));
    return next ? { kind: 'look', part: next } : null;
  }
  const c = currentChallenge(s);
  if (!c) return null;
  if (c.kind === 'locate') return { kind: 'look', part: c.target };
  if (c.kind === 'grab') return { kind: 'grab', item: c.item };
  return s.items[c.item].heldBy ? { kind: 'place', item: c.item, zone: c.zone } : { kind: 'grab', item: c.item, zone: c.zone };
}

const heldBy = (s: TourState, hand: HandId) => ITEMS.find((i) => s.items[i].heldBy === hand) ?? null;

export function tourReducer(s: TourState, a: MissionAction): TourState {
  const meta = reduceMeta(s, a as { type: string }, (g, carry) => createTour(g, carry), {
    paused: FEEDBACK.paused,
    resumed: FEEDBACK.resumed,
    guidance: (g) => fmt(FEEDBACK['guidance-changed'], { tier: GUIDANCE_LABEL[g] }),
  });
  if (meta) return meta;
  if (s.status !== 'playing') return s;
  if (a.type === 'TICK') {
    if (!(a.dtSec > 0)) return s;
    const dt = Math.min(a.dtSec, 0.25);
    return { ...s, effects: [], metrics: { ...s.metrics, elapsedSec: s.metrics.elapsedSec + dt, idleSec: s.metrics.idleSec + dt } };
  }

  const d: TourState = {
    ...s,
    items: { portafilter: { ...s.items.portafilter }, cup: { ...s.items.cup }, tamper: { ...s.items.tamper } },
    inspected: [...s.inspected],
    misses: [...s.misses],
    effects: [],
    metrics: { ...s.metrics, mistakes: [...s.metrics.mistakes], actionsBySource: { ...s.metrics.actionsBySource }, idleSec: 0 },
  };
  const src: InputSource = ('source' in a && a.source) || 'test';
  d.metrics.actionsBySource[src] += 1;
  let seq = s.feedback?.seq ?? 0;
  const say = (kind: FeedbackKind, code: string, text: LocalizedText, detail?: LocalizedText) => {
    d.feedback = { seq: ++seq, kind, code, text, detail } satisfies CoreFeedback;
  };
  const sound = (name: NonNullable<TourState['effects'][number]['name']>) => d.effects.push({ type: 'sound', name });
  const c = currentChallenge(d);
  const miss = (code: string, text: LocalizedText) => {
    d.misses[d.challengeIndex] = (d.misses[d.challengeIndex] ?? 0) + 1;
    (d.metrics.mistakes as Array<{ code: string; atSec: number }>).push({ code, atSec: Math.round(d.metrics.elapsedSec * 10) / 10 });
    say('mistake', code, text, c ? promptOf(c, 'guided') : undefined);
    sound('incorrect');
  };
  const advance = (name: LocalizedText) => {
    d.challengeIndex += 1;
    d.effects.push({ type: 'step-complete' });
    if (d.challengeIndex >= CHALLENGES.length) {
      d.status = 'complete';
      d.completedAtSec = Math.round(d.metrics.elapsedSec * 10) / 10;
      d.hintUntilSec = null;
      say('success', 'mission-complete', T.complete);
      d.effects.push({ type: 'mission-complete' });
      sound('complete');
    } else {
      say('success', 'step-complete', fmt(T.correct, { name }));
      sound('correct');
    }
  };

  switch (a.type) {
    case 'REQUEST_HINT': {
      d.metrics.hintsUsed += 1;
      d.hintUntilSec = hintWindow(d);
      if (c) say('info', 'hint', fmt(T.hint, { named: c.named, hint: c.hint }));
      else say('info', 'hint', d.guidance === 'independent' ? T.exploreScreen : src === 'xr' ? T.exploreXr : T.exploreScreen);
      sound('select');
      return d;
    }
    case 'LOCATE': {
      const info = tourInfo(a.target);
      if (d.phase === 'explore') {
        if (!d.inspected.includes(a.target)) d.inspected.push(a.target);
        say('info', 'inspect', fmt(T.inspected, { name: info.name, purpose: info.purpose }), tourSafety(a.target));
        sound('tap');
        if (d.inspected.length >= EXPLORE_TARGET) {
          d.phase = 'challenge';
          d.effects.push({ type: 'step-complete' });
          say('success', 'step-complete', T.exploreDone, fmt(T.inspected, { name: info.name, purpose: info.purpose }));
          sound('correct');
        }
        return d;
      }
      if (c?.kind === 'locate') {
        if (a.target === c.target) advance(info.name);
        else miss('tour-wrong-locate', fmt(T.wrongLocate, { name: info.name, hint: c.hint }));
        return d;
      }
      say('info', 'inspect', fmt(T.inspected, { name: info.name, purpose: info.purpose }));
      sound('tap');
      return d;
    }
    case 'GRAB': {
      const inHand = heldBy(d, a.hand);
      if (inHand === a.item) return s;
      if (inHand) {
        say('info', 'hand-full', FEEDBACK['hand-full']);
        return d;
      }
      d.items[a.item].heldBy = a.hand;
      d.effects.push({ type: 'grab' });
      sound('select');
      if (c?.kind === 'grab') {
        if (a.item === c.item) advance(tourInfo(a.item).name);
        else miss('tour-wrong-grab', fmt(T.wrongGrab, { name: tourInfo(a.item).name, hint: c.hint }));
      }
      return d;
    }
    case 'RELEASE': {
      const item = heldBy(d, a.hand);
      if (!item) return s;
      const it = d.items[item];
      const zone = a.zone && a.zone !== 'basket' && ZONE_ACCEPTS[a.zone].includes(item) ? a.zone : undefined;
      const snap = zone ? evaluateSnap(TIERS[d.guidance], a.distanceM ?? 0, zone === 'group-head' ? a.angleDeg : undefined) : null;
      it.heldBy = null;
      if (zone && snap?.result === 'snap') {
        it.zone = zone;
        d.effects.push({ type: 'snap' });
        sound('snap');
        if (c?.kind === 'place') {
          if (item === c.item && zone === c.zone) advance(ZONE_NAME[zone]);
          else if (zone !== ITEM_HOME[item]) miss('tour-wrong-place', fmt(T.wrongPlace, { zone: ZONE_NAME[zone], hint: c.hint }));
        }
        return d;
      }
      if (zone && snap?.result === 'near') {
        d.nearMisses += 1;
        say('info', snap.angleOk ? 'near-miss' : 'near-miss-angle', FEEDBACK[snap.angleOk ? 'near-miss' : 'near-miss-angle']);
      }
      it.zone = ITEM_HOME[item];
      d.effects.push({ type: 'return-home' });
      sound('whoosh');
      return d;
    }
    case 'PRESS': {
      const id = a.button === 'brew' ? 'brew-button' : a.button === 'tare' ? 'scale' : 'grinder';
      say('info', 'machine-off', fmt(T.machineOff, { name: TOOL_INFO[id].name }));
      sound('tap');
      return d;
    }
    default:
      return s;
  }
}
