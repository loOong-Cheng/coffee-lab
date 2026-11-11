/**
 * Shift result, stars, unlocks and the learning-event record. Follows `src/xr/mission/core.ts`
 * conventions: evidence is always 'simulated', the claims block is all false, numbers are
 * illustrative and game time is compressed. (Not wired into the XR mission picker yet — M2.)
 */
import type { Guidance, LearningEvent, LocalizedText, Mode } from '../../domain/contracts';
import { RUSH_LEVELS, SCORING, type RushLevelNo } from './config';
import type { RushMode, RushState } from './sim';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

/** Learning events: activityId 'rush:<level>', evidence 'simulated', score = stars / 3. */
export const RUSH_ACTIVITY_PREFIX = 'rush:';

export const RUSH_PRACTICES: readonly LocalizedText[] = [
  L('每款饮品由哪些部分组成、按什么顺序（例如长黑先放水）', 'What each drink is made of, and in which order (e.g. a long black takes water first)'),
  L('真实配方比例（墙上的数字来自饮品图鉴）', 'Real recipe ratios (the wall numbers come from the Drink Atlas)'),
  L('在等待萃取、打奶、滴滤时安排并行任务', 'Filling brewing, steaming and drip waits with parallel tasks'),
];

export const RUSH_NOT_TRAINED: readonly LocalizedText[] = [
  L('真实的出品时间：游戏时间被压缩了', 'Real brew timing: game time is compressed'),
  L('研磨、布粉、压粉和打奶的手感与技巧', 'Grinding, distribution, tamping and steaming technique or feel'),
  L('味道：游戏无法判断一杯咖啡好不好喝', 'Taste: the game cannot judge how a coffee tastes'),
  L('拉花、温度判断与真实的安全操作', 'Latte art, judging temperature, and real-world safe handling'),
];

export interface RushResult {
  game: 'cafe-rush';
  level: RushLevelNo;
  mode: RushMode;
  guidance: Guidance;
  completed: boolean;
  evidence: 'simulated';
  illustrativeModel: true;
  gameTimeCompressed: true;
  claims: { realSkill: false; taste: false; gripForce: false; haptics: false; realTiming: false };
  points: number;
  potential: number;
  stars: 0 | 1 | 2 | 3;
  /** 0..1 for the learning event: points ÷ potential (Standard) or perfect-serve share (Relaxed). */
  score: number;
  correct: number;
  partly: number;
  wrongServes: number;
  timeouts: number;
  unservedAtClose: number;
  bestStreak: number;
  tips: number;
  avgWaitSec: number;
  durationSec: number;
  drinksMade: string[];
  practiced: readonly LocalizedText[];
  notTrained: readonly LocalizedText[];
  notes: string;
}

export function starsFor(score: number, mode: RushMode = 'standard'): 0 | 1 | 2 | 3 {
  const [a, b, c] = mode === 'relaxed' ? SCORING.relaxedStars : SCORING.stars;
  return score >= c ? 3 : score >= b ? 2 : score >= a ? 1 : 0;
}

export function rushResult(s: RushState): RushResult {
  const st = s.stats;
  const recs = s.records;
  const potential = recs.reduce((n, r) => n + r.base, 0) + s.orders.reduce((n, o) => n + o.points, 0);
  const served = recs.filter((r) => r.outcome === 'correct' || r.outcome === 'partly');
  const avgWaitSec = served.length ? Math.round(served.reduce((n, r) => n + (r.closedMs - r.arrivedMs), 0) / served.length / 100) / 10 : 0;
  const attempts = st.correct + st.partly + st.wrongServes;
  const raw = s.mode === 'relaxed' ? (attempts ? st.correct / attempts : 0) : potential ? st.points / potential : 0;
  const score = Math.round(Math.min(1, raw) * 1000) / 1000;
  const stars = attempts + st.timeouts === 0 ? 0 : starsFor(raw, s.mode);
  return {
    game: 'cafe-rush',
    level: s.level,
    mode: s.mode,
    guidance: s.guidance,
    completed: s.status === 'over',
    evidence: 'simulated',
    illustrativeModel: true,
    gameTimeCompressed: true,
    claims: { realSkill: false, taste: false, gripForce: false, haptics: false, realTiming: false },
    points: st.points,
    potential,
    stars,
    score,
    correct: st.correct,
    partly: st.partly,
    wrongServes: st.wrongServes,
    timeouts: st.timeouts,
    unservedAtClose: recs.filter((r) => r.outcome === 'open').length,
    bestStreak: st.bestStreak,
    tips: st.tips,
    avgWaitSec,
    durationSec: Math.round(s.tMs / 1000),
    drinksMade: [...new Set(recs.filter((r) => r.outcome === 'correct').map((r) => r.drinkId))],
    practiced: RUSH_PRACTICES,
    notTrained: RUSH_NOT_TRAINED,
    notes: `rush L${s.level} ${s.mode} ${s.input} stars=${stars} pts=${st.points}/${potential} ok=${st.correct} partly=${st.partly} wrong=${st.wrongServes} timeouts=${st.timeouts} (simulated, game time)`,
  };
}

/** Learning event for the shared transcript (evidence 'simulated', never a real-skill claim). */
export function rushCompletionEvent(r: RushResult, env: { immersive: boolean; touch: boolean }): Omit<LearningEvent, 'id' | 'recordedAt'> {
  const mode: Mode = env.immersive ? 'xr' : env.touch ? 'mobile' : 'desktop';
  return {
    activityId: `${RUSH_ACTIVITY_PREFIX}${r.level}`,
    lessonId: '',
    mode,
    guidance: r.guidance,
    evidence: 'simulated',
    outcome: r.completed && r.stars >= 1 ? 'completed' : 'retry',
    score: Math.round((r.stars / 3) * 1000) / 1000,
    notes: r.notes,
  };
}

/** Best stars per level, derived from the learner's simulated Rush events (no extra stored state). */
export function bestStarsFromEvents(events: readonly Pick<LearningEvent, 'activityId' | 'evidence' | 'score'>[]): Partial<Record<RushLevelNo, number>> {
  const out: Partial<Record<RushLevelNo, number>> = {};
  for (const e of events) {
    if (e.evidence !== 'simulated' || !e.activityId.startsWith(RUSH_ACTIVITY_PREFIX)) continue;
    const level = Number(e.activityId.slice(RUSH_ACTIVITY_PREFIX.length)) as RushLevelNo;
    if (!RUSH_LEVELS.includes(level)) continue;
    const stars = Math.max(0, Math.min(3, Math.round((e.score ?? 0) * 3)));
    out[level] = Math.max(out[level] ?? 0, stars);
  }
  return out;
}

/** Level n+1 unlocks after at least one star on level n (either mode). Level 1 is always open. */
export function unlockedLevels(bestStars: Partial<Record<RushLevelNo, number>>): RushLevelNo[] {
  const out: RushLevelNo[] = [];
  for (const l of RUSH_LEVELS) {
    if (l === 1 || (bestStars[(l - 1) as RushLevelNo] ?? 0) >= 1) out.push(l);
    else break;
  }
  return out;
}
