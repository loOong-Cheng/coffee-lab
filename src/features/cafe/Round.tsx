/**
 * One shift (round) of five orders: ticket → build at stations → serve → explained feedback →
 * retry or next → summary. Every serve records ONE assessed-answer event (`cafe:<drinkId>`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SfxName } from '../../audio';
import { useSfx } from '../../audio/react';
import { getDrink } from '../../content';
import type { Guidance, LocalizedText, Mode } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { getLearnerState, learnerActions } from '../../state';
import { Button, GuidanceSelector, Icon, Kbd, StepProgress, announce } from '../../ui';
import { CupView } from './CupView';
import { ServeFeedback } from './Feedback';
import {
  STATION_OF,
  cafeActivityId,
  cafeMastery,
  composeRound,
  emptyBuild,
  evaluate,
  isComplete,
  missingChoices,
  perfectMatchOther,
  seededRandom,
  shuffle,
  STATIONS,
  type Build,
  type CafeLevelId,
  type CompleteBuild,
  type Evaluation,
  type StationId,
} from './model';
import { BUILD_SPECS, CUSTOMERS, ORDER_LINES, getBuildSpec, type Customer } from './specs';
import { Stations, focusStation } from './Stations';
import { Summary, type OrderRecord } from './Summary';
import { RecipeCard, Ticket } from './Ticket';
import { LEVEL_TEXT, S, STATION_TEXT } from './strings';

export const RELAXED_TIMER_SEC = 90;

interface Order {
  drinkId: string;
  customer: Customer;
  line: (d: LocalizedText) => LocalizedText;
}

export interface RoundProps {
  level: CafeLevelId;
  seed: number;
  guidance: Guidance;
  onGuidance(g: Guidance): void;
  timerOn: boolean;
  mode: Mode;
  phone: boolean;
  onExit(): void;
  onAnother(): void;
  onNextLevel(l: CafeLevelId): void;
}

function useOrders(level: CafeLevelId, seed: number): Order[] {
  return useMemo(() => {
    const random = seededRandom(seed);
    const mastered = new Set(cafeMastery(getLearnerState().events).keys());
    const ids = composeRound(level, BUILD_SPECS, mastered, random).filter((id) => getDrink(id) && getBuildSpec(id));
    const people = shuffle(CUSTOMERS, random);
    return ids.map((drinkId, i) => ({
      drinkId,
      customer: people[i % people.length]!,
      line: ORDER_LINES[Math.floor(random() * ORDER_LINES.length)] ?? ORDER_LINES[0]!,
    }));
    // Orders are fixed for the life of the round (mastery is read once, at the start).
  }, [level, seed]);
}

const SFX_FOR: Record<StationId, SfxName> = {
  method: 'select',
  shots: 'espresso',
  water: 'pour',
  milk: 'milkSteam',
  ice: 'ice',
  extras: 'tap',
  cup: 'snap',
};

export function Round({ level, seed, guidance, onGuidance, timerOn, mode, phone, onExit, onAnother, onNextLevel }: RoundProps) {
  const { t, locale } = useI18n();
  const sfx = useSfx();
  const orders = useOrders(level, seed);
  const [masteredBefore] = useState(() => new Set(cafeMastery(getLearnerState().events).keys()));

  const [index, setIndex] = useState(0);
  const [build, setBuild] = useState<Build>(() => emptyBuild(level));
  const [phase, setPhase] = useState<'build' | 'feedback' | 'done'>('build');
  const [served, setServed] = useState<{ build: CompleteBuild; evaluation: Evaluation } | null>(null);
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipePeeked, setRecipePeeked] = useState(false);
  const [missStreak, setMissStreak] = useState(0);
  const [missing, setMissing] = useState<StationId[]>([]);
  const [flagged, setFlagged] = useState<ReadonlySet<StationId>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(RELAXED_TIMER_SEC);
  const ticketRef = useRef<HTMLHeadingElement>(null);

  const order = orders[index];
  const spec = order ? getBuildSpec(order.drinkId) : undefined;
  const drink = order ? getDrink(order.drinkId) : undefined;
  const isLast = index >= orders.length - 1;
  const showKeys = !phone;
  const recipeVisible = guidance === 'guided' || (guidance === 'assisted' && recipeOpen);

  // New order → focus the ticket so keyboard and screen-reader users hear it.
  useEffect(() => {
    ticketRef.current?.focus();
  }, [index]);

  // Relaxed timer: counts down while building; never affects the score.
  useEffect(() => {
    if (!timerOn || phase !== 'build') return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [timerOn, phase, index]);

  const change = useCallback(
    (patch: Partial<Build>, station: StationId) => {
      setBuild((b) => ({ ...b, ...patch }));
      setMissing((m) => m.filter((s) => s !== station));
      if (station === 'milk' && patch.milk) sfx(patch.milk === 'cold' ? 'milkPour' : patch.milk === 'none' ? 'tap' : 'milkSteam');
      else sfx(SFX_FOR[station]);
    },
    [sfx],
  );

  const serve = useCallback(() => {
    if (!spec || !order || phase !== 'build') return;
    const need = missingChoices(build);
    if (!isComplete(build) || need.length) {
      setMissing(need);
      const names = need.map((s) => t(STATION_TEXT[s].name)).join(locale === 'zh' ? '、' : ', ');
      announce(t(S.pickFirst(names)), 'assertive');
      if (need[0]) focusStation(need[0]);
      return;
    }
    const evaluation = evaluate(build, spec);
    sfx('serve');
    window.setTimeout(() => sfx(evaluation.correct ? 'correct' : 'incorrect'), 180);
    const notes = [`level=${level}`, recipePeeked ? 'recipe-card-viewed' : '', evaluation.diffs.length ? `off=${evaluation.diffs.map((d) => d.component).join(',')}` : '']
      .filter(Boolean)
      .join(' ');
    learnerActions.recordEvent({
      activityId: cafeActivityId(order.drinkId),
      lessonId: '',
      mode,
      guidance,
      evidence: 'assessed_answer',
      outcome: evaluation.correct ? 'completed' : 'retry',
      score: evaluation.score,
      notes,
    });
    setRecords((rs) => {
      const prev = rs[index];
      const inPace = timerOn ? secondsLeft > 0 && evaluation.correct : undefined;
      const rec: OrderRecord = prev
        ? { ...prev, attempts: prev.attempts + 1, correct: prev.correct || evaluation.correct, inPace: prev.inPace || inPace }
        : {
            drinkId: order.drinkId,
            attempts: 1,
            firstScore: evaluation.score,
            firstDiffs: evaluation.diffs.map((d) => d.component),
            correct: evaluation.correct,
            inPace,
          };
      const next = [...rs];
      next[index] = rec;
      return next;
    });
    setMissStreak((n) => (evaluation.correct ? 0 : n + 1));
    setServed({ build, evaluation });
    setFlagged(new Set(evaluation.diffs.map((d) => STATION_OF[d.component])));
    setPhase('feedback');
  }, [build, guidance, index, level, locale, mode, order, phase, recipePeeked, secondsLeft, sfx, spec, t, timerOn]);

  const retry = useCallback(() => {
    if (phase !== 'feedback') return;
    setPhase('build');
    const first = served?.evaluation.diffs[0];
    setServed(null);
    window.setTimeout(() => {
      if (first) focusStation(STATION_OF[first.component]);
    }, 0);
  }, [phase, served]);

  const next = useCallback(() => {
    if (phase !== 'feedback') return;
    if (isLast) {
      setPhase('done');
      sfx('complete');
      return;
    }
    setIndex((i) => i + 1);
    setBuild(emptyBuild(level));
    setServed(null);
    setFlagged(new Set());
    setMissing([]);
    setRecipeOpen(false);
    setRecipePeeked(false);
    setSecondsLeft(RELAXED_TIMER_SEC);
    setPhase('build');
  }, [isLast, level, phase, sfx]);

  const toggleRecipe = useCallback(() => {
    if (guidance !== 'assisted') return;
    setRecipeOpen((o) => {
      if (!o) setRecipePeeked(true);
      return !o;
    });
  }, [guidance]);

  // Keyboard shortcuts (desktop quick path). Ignored while typing or inside a modal.
  const handlers = useRef({ serve, retry, next, toggleRecipe, phase });
  handlers.current = { serve, retry, next, toggleRecipe, phase };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const h = handlers.current;
      const k = e.key.toLowerCase();
      if (h.phase === 'build') {
        if (/^[1-7]$/.test(k)) {
          const st = STATIONS[Number(k) - 1];
          if (st && focusStation(st)) e.preventDefault();
        } else if (k === 's') {
          e.preventDefault();
          h.serve();
        } else if (k === 'h') {
          h.toggleRecipe();
        }
      } else if (h.phase === 'feedback') {
        if (k === 'r') {
          e.preventDefault();
          h.retry();
        } else if (k === 'n') {
          e.preventDefault();
          h.next();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const newlyMastered = useMemo(() => {
    if (phase !== 'done') return [];
    const now = cafeMastery(getLearnerState().events);
    return orders.map((o) => o.drinkId).filter((id, i, all) => all.indexOf(id) === i && now.has(id) && !masteredBefore.has(id));
  }, [masteredBefore, orders, phase]);

  useEffect(() => {
    if (newlyMastered.length) sfx('levelUp');
  }, [newlyMastered, sfx]);

  if (phase === 'done') {
    return (
      <div className="cafe-round" data-phase="done">
        <Summary
          level={level}
          records={records}
          newlyMastered={newlyMastered}
          timerOn={timerOn}
          onAnother={onAnother}
          onNextLevel={onNextLevel}
          onExit={onExit}
        />
      </div>
    );
  }

  if (!order || !spec || !drink) {
    return (
      <div className="cafe-round">
        <p role="alert">{t(S.missingDrink)}</p>
        <Button onClick={onExit}>{t(S.backToCounter)}</Button>
      </div>
    );
  }

  const lookalike = served && !served.evaluation.correct ? perfectMatchOther(served.build, BUILD_SPECS, spec.drinkId) : null;
  const lookalikeDrink = lookalike ? getDrink(lookalike.drinkId) : undefined;

  return (
    <div className="cafe-round" data-phase={phase} data-guidance={guidance} data-layout={phone ? 'phone' : 'counter'}>
      <header className="cafe-round__bar">
        <div className="cafe-round__where">
          <p className="cl-eyebrow">{t(LEVEL_TEXT[level].title)}</p>
          <StepProgress
            current={index}
            total={orders.length}
            locale={locale}
            states={orders.map((_, i) => (i < index ? 'done' : i === index ? 'current' : 'todo'))}
          />
        </div>
        <GuidanceSelector value={guidance} onChange={onGuidance} locale={locale} className="cafe-round__guidance" />
        <Button variant="ghost" size="sm" icon="back" onClick={onExit} data-testid="cafe-leave">
          {t(S.leave)}
        </Button>
      </header>

      <div className="cafe-counter">
        <div className="cafe-counter__order">
          <Ticket
            ref={ticketRef}
            customer={order.customer}
            line={order.line(drink.name)}
            drink={drink}
            spec={spec}
            counter={t(S.shiftOf(index + 1, orders.length))}
          />
          {phase === 'build' && (
            <>
              {recipeVisible && <RecipeCard spec={spec} drink={drink} />}
              {guidance === 'assisted' && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="clipboard-check"
                  aria-expanded={recipeOpen}
                  aria-keyshortcuts="H"
                  onClick={toggleRecipe}
                  data-testid="cafe-recipe-toggle"
                >
                  {recipeOpen ? t(S.hideRecipe) : t(S.showRecipe)}
                  {showKeys && (
                    <Kbd className="cafe-kbd" aria-hidden="true">
                      H
                    </Kbd>
                  )}
                </Button>
              )}
              {guidance === 'independent' && <p className="cafe-small cl-muted cafe-memory">{t(S.memoryMode)}</p>}
              {timerOn && (
                <p className="cafe-timer" data-testid="cafe-timer" data-over={secondsLeft === 0 || undefined}>
                  <Icon name="clock" size={18} />
                  {secondsLeft > 0 ? t(S.timeLeft(secondsLeft)) : t(S.timeOver)}
                </p>
              )}
            </>
          )}
        </div>

        {phase === 'build' ? (
          <>
            <section className="cafe-counter__stations" aria-label={t(S.counter)}>
              <Stations build={build} onChange={change} hints={guidance === 'guided'} spec={spec} large={phone} flagged={flagged} />
            </section>
            <aside className="cafe-counter__cup" aria-label={t(S.yourCup)}>
              <div className="cafe-serve">
                <CupView build={build} locale={locale} size={phone ? 72 : 168} label={t(S.yourCup)} testId="cafe-cup-live" className="cafe-serve__cup" />
                <div className="cafe-serve__main">
                  {missing.length > 0 && (
                    <p className="cafe-serve__missing" data-testid="cafe-missing">
                      {t(S.pickFirst(missing.map((s) => t(STATION_TEXT[s].name)).join(locale === 'zh' ? '、' : ', ')))}
                    </p>
                  )}
                  <Button size="lg" block icon="cup" onClick={serve} data-testid="cafe-serve" aria-keyshortcuts="S">
                    {t(S.serve)}
                    {showKeys && (
                      <Kbd className="cafe-kbd" aria-hidden="true">
                        S
                      </Kbd>
                    )}
                  </Button>
                </div>
              </div>
              {showKeys && (
                <details className="cafe-keys">
                  <summary>{t(S.shortcuts)}</summary>
                  <ul>
                    <li>
                      <Kbd>1</Kbd>–<Kbd>7</Kbd> {t(S.kStations)}
                    </li>
                    <li>
                      <Kbd>S</Kbd> {t(S.kServe)}
                    </li>
                    {guidance === 'assisted' && (
                      <li>
                        <Kbd>H</Kbd> {t(S.kRecipe)}
                      </li>
                    )}
                    <li>
                      <Kbd>R</Kbd> {t(S.kRetry)} · <Kbd>N</Kbd> {t(S.kNext)}
                    </li>
                  </ul>
                </details>
              )}
            </aside>
          </>
        ) : (
          served && (
            <div className="cafe-counter__feedback">
              <ServeFeedback
                spec={spec}
                drink={drink}
                build={served.build}
                evaluation={served.evaluation}
                guidance={guidance}
                lookalikeName={lookalikeDrink ? t(lookalikeDrink.name) : null}
                isLast={isLast}
                missStreak={missStreak}
                showKeys={showKeys}
                onRetry={retry}
                onNext={next}
                onSwitchGuided={() => onGuidance('guided')}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
