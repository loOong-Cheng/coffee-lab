import { useMemo, useRef, useState, type DragEvent } from 'react';
import type { SequenceActivity } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/icons';
import { Button, IconButton } from '../../ui/primitives/Button';
import { FeedbackPanel } from '../../ui/primitives/FeedbackPanel';
import { guidancePolicy } from './logic/guidance';
import { checkNextStep, checkSequence, moveItem, relocate, shuffleSteps, type NextStepCheck, type SequenceCheck } from './logic/sequence';
import { FinishRow, HintBox, SupportNudge, sfx, useHint } from './shared';
import { S } from './strings';
import type { ActivityProps } from './types';

function seedFor(id: string, attempt: number): number {
  let h = 2166136261;
  for (const ch of `${id}#${attempt}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * Put steps in order.
 *  guided      — build the order one step at a time; every pick is checked instantly, the "why" appears
 *                as each step lands, and jump-aheads get targeted misconception feedback. Hint visible.
 *  assisted    — reorder the whole list (↑/↓ buttons, or drag with a mouse) and check on submit;
 *                misplaced slots are marked; hint on request; unlimited re-checks.
 *  independent — reorder and submit once, no hints; then the full order with reasons is revealed.
 * Score = first-submission accuracy (guided: share of steps placed without a slip).
 */
export function SequenceView(props: ActivityProps<SequenceActivity>) {
  return guidancePolicy(props.guidance).instantFeedback ? <BuildSequence {...props} /> : <ReorderSequence {...props} />;
}

function useSteps(activity: SequenceActivity) {
  const byId = useMemo(() => new Map(activity.steps.map((s) => [s.id, s])), [activity.steps]);
  const correct = useMemo(() => activity.steps.map((s) => s.id), [activity.steps]);
  return { byId, correct };
}

// ───────────────────────── guided: build step by step ─────────────────────────
function BuildSequence({ activity, guidance, onComplete, hintSignal }: ActivityProps<SequenceActivity>) {
  const { t, locale } = useI18n();
  const { byId, correct } = useSteps(activity);
  const [pool] = useState(() => shuffleSteps(correct, seedFor(activity.id, 0)));
  const [placed, setPlaced] = useState<string[]>([]);
  const [slips, setSlips] = useState<Set<number>>(new Set());
  const [last, setLast] = useState<{ candidate: string; check: NextStepCheck } | null>(null);
  const hint = useHint(guidance, hintSignal);
  const remainingRef = useRef<HTMLUListElement>(null);
  const done = placed.length === correct.length;

  const pick = (id: string) => {
    const check = checkNextStep(placed, id, correct, activity.misconceptions);
    setLast({ candidate: id, check });
    if (check.ok) {
      const next = [...placed, id];
      setPlaced(next);
      sfx(next.length === correct.length ? 'complete' : 'correct');
      // keep keyboard focus inside the remaining list
      requestAnimationFrame(() => remainingRef.current?.querySelector<HTMLButtonElement>('button')?.focus());
    } else {
      setSlips((s) => new Set(s).add(placed.length));
      sfx('incorrect');
    }
  };

  const score = correct.length ? (correct.length - slips.size) / correct.length : 0;
  const remaining = pool.filter((id) => !placed.includes(id));

  return (
    <div className="act act-sequence" data-testid="activity-sequence" data-mode="build">
      <p className="act-prompt">{t(activity.prompt)}</p>
      <HintBox text={activity.hint} shown={hint.shown} canRequest={hint.canRequest} onToggle={hint.toggle} />
      <div className="act-seq-build">
        <section className="act-seq-col" aria-labelledby={`${activity.id}-placed`}>
          <h3 id={`${activity.id}-placed`} className="act-col-title">
            {t(S.yourOrder)}
          </h3>
          {placed.length === 0 ? (
            <p className="cl-muted">{t(S.emptyOrder)}</p>
          ) : (
            <ol className="act-seq-list">
              {placed.map((id, i) => (
                <li key={id} className="act-seq-item" data-state="correct">
                  <span className="act-seq-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="act-seq-body">
                    <span className="act-seq-text">{t(byId.get(id)!.text)}</span>
                    <span className="act-seq-why">
                      <Icon name="lightbulb" size={14} /> {t(byId.get(id)!.why)}
                    </span>
                  </span>
                  <span className="act-status" data-ok="true">
                    <Icon name="check" size={16} />
                    <span className="cl-visually-hidden">{t(S.stepPlaced)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
        {!done && (
          <section className="act-seq-col" aria-labelledby={`${activity.id}-pool`}>
            <h3 id={`${activity.id}-pool`} className="act-col-title">
              {t(S.remaining)}
            </h3>
            <p className="cl-muted act-note">{t(S.tapNext)}</p>
            <ul className="act-seq-pool" role="list" ref={remainingRef}>
              {remaining.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className="act-option act-option--step"
                    data-state={last && !last.check.ok && last.candidate === id ? 'incorrect' : 'idle'}
                    onClick={() => pick(id)}
                    data-step={id}
                  >
                    <span className="act-option__text">{t(byId.get(id)!.text)}</span>
                    <Icon name="plus" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {last && !last.check.ok && !done && (
        <FeedbackPanel status="incorrect" locale={locale} title={t(S.notYet)}>
          <p>{t(last.check.misconception?.feedback ?? S.notYetGeneric)}</p>
        </FeedbackPanel>
      )}
      {done && (
        <>
          <FeedbackPanel status="correct" locale={locale}>
            <p>{t(S.firstTry(correct.length - slips.size, correct.length))}</p>
          </FeedbackPanel>
          <FinishRow done onContinue={() => onComplete({ outcome: 'completed', score })} />
        </>
      )}
    </div>
  );
}

// ───────────────────────── assisted / independent: reorder & check ─────────────────────────
function ReorderSequence({ activity, guidance, onComplete, hintSignal, onStepDown }: ActivityProps<SequenceActivity>) {
  const { t, locale } = useI18n();
  const policy = guidancePolicy(guidance);
  const { byId, correct } = useSteps(activity);
  const [attempt, setAttempt] = useState(0);
  const [order, setOrder] = useState(() => shuffleSteps(correct, seedFor(activity.id, 0)));
  const [result, setResult] = useState<SequenceCheck | null>(null);
  const [firstScore, setFirstScore] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [everSolved, setEverSolved] = useState(false);
  const [failedChecks, setFailedChecks] = useState(0);
  const hint = useHint(guidance, hintSignal);
  const listRef = useRef<HTMLOListElement>(null);

  // independent: one submission per attempt; the list locks until "Try again".
  const locked = !!result && (result.allCorrect || !policy.hintOnRequest);

  const change = (next: string[], focusIndex?: number, dir?: 'up' | 'down') => {
    setOrder(next);
    if (result && !result.allCorrect) setResult(null); // stale marks would mislead
    sfx('tap');
    if (focusIndex !== undefined) {
      requestAnimationFrame(() => {
        const items = listRef.current?.querySelectorAll<HTMLLIElement>('li');
        const li = items?.[focusIndex];
        const btn =
          li?.querySelector<HTMLButtonElement>(`[data-move="${dir}"]:not([disabled])`) ??
          li?.querySelector<HTMLButtonElement>('[data-move]:not([disabled])');
        btn?.focus();
      });
    }
  };

  const check = () => {
    const r = checkSequence(order, correct, activity.misconceptions);
    setResult(r);
    if (firstScore === null) setFirstScore(r.score);
    if (r.allCorrect) setEverSolved(true);
    else setFailedChecks((n) => n + 1);
    sfx(r.allCorrect ? 'complete' : 'incorrect');
  };

  const tryAgain = () => {
    const nextAttempt = attempt + 1;
    setAttempt(nextAttempt);
    setOrder(shuffleSteps(correct, seedFor(activity.id, nextAttempt)));
    setResult(null);
    hint.reset();
  };

  const onDragStart = (i: number) => (e: DragEvent) => {
    setDragFrom(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(i));
  };
  const onDrop = (i: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragFrom !== null && dragFrom !== i) change(relocate(order, dragFrom, i));
    setDragFrom(null);
  };

  const score = firstScore ?? 0;
  const showReveal = !!result && !result.allCorrect && !policy.hintOnRequest; // independent

  return (
    <div className="act act-sequence" data-testid="activity-sequence" data-mode="reorder">
      <p className="act-prompt">{t(activity.prompt)}</p>
      {!locked && <p className="cl-muted act-note">{t(S.reorderHelp)}</p>}
      <HintBox text={activity.hint} shown={hint.shown} canRequest={hint.canRequest} onToggle={hint.toggle} />
      <ol className="act-seq-list" ref={listRef} aria-label={t(S.yourOrder)}>
        {order.map((id, i) => {
          const label = t(byId.get(id)!.text);
          const mark = result ? (result.correctPositions[i] ? 'correct' : 'incorrect') : 'idle';
          return (
            <li
              key={id}
              className="act-seq-item"
              data-state={mark}
              data-step={id}
              draggable={!locked}
              onDragStart={onDragStart(i)}
              onDragOver={(e) => {
                if (!locked) e.preventDefault();
              }}
              onDrop={onDrop(i)}
              onDragEnd={() => setDragFrom(null)}
              data-dragging={dragFrom === i || undefined}
            >
              <span className="act-seq-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="act-seq-body">
                <span className="act-seq-text">{label}</span>
                {result?.allCorrect && (
                  <span className="act-seq-why">
                    <Icon name="lightbulb" size={14} /> {t(byId.get(id)!.why)}
                  </span>
                )}
              </span>
              {result && (
                <span className="act-status" data-ok={mark === 'correct'}>
                  <Icon name={mark === 'correct' ? 'check' : 'x'} size={16} />
                  <span className="cl-visually-hidden">{mark === 'correct' ? t(S.rightSpot) : t(S.wrongSpot)}</span>
                </span>
              )}
              {!locked && (
                <span className="act-seq-move">
                  <IconButton
                    icon="chevron-up"
                    label={t(S.moveUp(label))}
                    size="sm"
                    variant="secondary"
                    disabled={i === 0}
                    data-move="up"
                    onClick={() => change(moveItem(order, i, -1), i - 1, 'up')}
                  />
                  <IconButton
                    icon="chevron-down"
                    label={t(S.moveDown(label))}
                    size="sm"
                    variant="secondary"
                    disabled={i === order.length - 1}
                    data-move="down"
                    onClick={() => change(moveItem(order, i, 1), i + 1, 'down')}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="act-actions">
          <Button icon="check" onClick={check} data-testid="sequence-check">
            {t(S.checkOrder)}
          </Button>
        </div>
      )}

      {result && !result.allCorrect && (
        <FeedbackPanel status={result.correctCount > 0 ? 'partly' : 'incorrect'} locale={locale}>
          <p>{t(S.inPlace(result.correctCount, result.total))}</p>
          {result.misconceptions.length > 0 && (
            <ul className="act-misconceptions">
              {result.misconceptions.map((m) => (
                <li key={`${m.earlierStep}-${m.laterStep}`}>{t(m.feedback)}</li>
              ))}
            </ul>
          )}
        </FeedbackPanel>
      )}

      {!everSolved && <SupportNudge misses={failedChecks} guidance={guidance} onStepDown={onStepDown} />}

      {showReveal && (
        <section className="act-reveal" aria-labelledby={`${activity.id}-reveal`}>
          <h3 id={`${activity.id}-reveal`} className="act-col-title">
            {t(S.correctOrderIs)}
          </h3>
          <ol className="act-seq-list">
            {activity.steps.map((s, i) => (
              <li key={s.id} className="act-seq-item" data-state="reference">
                <span className="act-seq-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="act-seq-body">
                  <span className="act-seq-text">{t(s.text)}</span>
                  <span className="act-seq-why">
                    <Icon name="lightbulb" size={14} /> {t(s.why)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {result?.allCorrect && (
        <FeedbackPanel status="correct" locale={locale}>
          <p>{t(S.allInOrder)}</p>
          {firstScore !== null && firstScore < 1 && <p>{t(S.inPlace(Math.round(firstScore * correct.length), correct.length))}</p>}
        </FeedbackPanel>
      )}

      {result && (result.allCorrect || showReveal) && (
        <FinishRow
          done={everSolved}
          onContinue={() => onComplete({ outcome: everSolved ? 'completed' : 'retry', score })}
          onRetry={everSolved ? undefined : tryAgain}
        />
      )}
    </div>
  );
}
