import { useEffect, useMemo, useRef, useState } from 'react';
import type { QuizActivity } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/icons';
import { Button } from '../../ui/primitives/Button';
import { FeedbackPanel } from '../../ui/primitives/FeedbackPanel';
import { guidancePolicy } from './logic/guidance';
import {
  answeredCorrectly,
  evaluateOption,
  firstTryCorrect,
  quizComplete,
  quizScore,
  recordAttempt,
  type QuizAttempts,
} from './logic/quiz';
import { isTypingTarget } from './keys';
import { FinishRow, HintBox, SupportNudge, sfx, useHint } from './shared';
import { S } from './strings';
import type { ActivityProps } from './types';

const LETTERS = 'ABCDEFGH';

/**
 * Single-answer quiz with feedback tied to the misconception behind each option.
 *  guided      — hint shown; picking an option checks it immediately; retry until right.
 *  assisted    — pick, then "Check answer"; hint on request; retry until right.
 *  independent — no hints; answers are held until the end, then a full review + retry of misses.
 * Score = share right on the FIRST try; the check is "completed" once every question is eventually right.
 */
export function QuizView({ activity, guidance, onComplete, hintSignal, onStepDown }: ActivityProps<QuizActivity>) {
  const { t, locale } = useI18n();
  const policy = guidancePolicy(guidance);
  const questions = activity.questions;
  const [attempts, setAttempts] = useState<QuizAttempts>({});
  const [round, setRound] = useState<string[]>(() => questions.map((q) => q.id));
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  /** Independent mode: per-round picks are hidden until review. */
  const [phase, setPhase] = useState<'answering' | 'review' | 'summary'>('answering');
  const [roundPicks, setRoundPicks] = useState<Record<string, string>>({});
  const hint = useHint(guidance, hintSignal);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const advanced = useRef(false);

  const q = useMemo(() => questions.find((x) => x.id === round[pos]), [questions, round, pos]);
  const tried = (q && attempts[q.id]) ?? [];
  const solved = q ? answeredCorrectly(q, attempts) : false;
  const lastPick = tried[tried.length - 1];
  const lastEval = q && lastPick ? evaluateOption(q, lastPick) : null;

  useEffect(() => {
    if (advanced.current) headingRef.current?.focus();
  }, [pos, phase]);

  // Keyboard quick path (UX spec): 1–9 picks an option while answering.
  const pickByIndex = useRef<(i: number) => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || !/^[1-9]$/.test(e.key) || isTypingTarget(e.target)) return;
      e.preventDefault();
      pickByIndex.current(Number(e.key) - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (questions.length === 0) {
    return <FinishRow done onContinue={() => onComplete({ outcome: 'completed' })} />;
  }

  const score = quizScore(questions, attempts);
  const firstTryCount = questions.filter((x) => firstTryCorrect(x, attempts)).length;

  const answer = (optionId: string) => {
    if (!q) return;
    const next = recordAttempt(attempts, q.id, optionId);
    setAttempts(next);
    setSelected(null);
    if (policy.deferredFeedback) {
      setRoundPicks((p) => ({ ...p, [q.id]: optionId }));
      sfx('select');
      goNext(next);
      return;
    }
    sfx(evaluateOption(q, optionId).correct ? 'correct' : 'incorrect');
  };

  const goNext = (att: QuizAttempts = attempts) => {
    advanced.current = true;
    hint.reset();
    if (pos < round.length - 1) {
      setPos(pos + 1);
      return;
    }
    if (policy.deferredFeedback) {
      setPhase('review');
      sfx(quizComplete(questions, att) ? 'complete' : 'whoosh');
    } else {
      setPhase('summary');
      sfx('complete');
    }
  };

  const retryMissed = () => {
    const missed = questions.filter((x) => !answeredCorrectly(x, attempts)).map((x) => x.id);
    advanced.current = true;
    setRound(missed);
    setRoundPicks({});
    setPos(0);
    setPhase('answering');
  };

  // ───────────── end states ─────────────
  if (phase === 'summary' || phase === 'review') {
    const done = quizComplete(questions, attempts);
    return (
      <div className="act act-quiz" data-testid="activity-quiz">
        <h3 ref={headingRef} tabIndex={-1} className="act-subheading">
          {phase === 'review' ? t(S.review) : t(S.firstTry(firstTryCount, questions.length))}
        </h3>
        {phase === 'review' && (
          <>
            <p>{t(S.firstTry(firstTryCount, questions.length))}</p>
            <ol className="act-review">
              {questions
                .filter((x) => round.includes(x.id))
                .map((x) => {
                  const pick = roundPicks[x.id] ?? attempts[x.id]?.[attempts[x.id]!.length - 1];
                  const ev = pick ? evaluateOption(x, pick) : null;
                  const opt = x.options.find((o) => o.id === pick);
                  const right = x.options.find((o) => o.correct);
                  return (
                    <li key={x.id} className="act-review__item" data-correct={!!ev?.correct}>
                      <p className="act-review__q">{t(x.prompt)}</p>
                      <p>
                        <span className="act-status" data-ok={!!ev?.correct}>
                          <Icon name={ev?.correct ? 'check' : 'x'} size={16} />
                          {ev?.correct ? t(S.correctWord) : t(S.incorrectWord)}
                        </span>{' '}
                        {t(S.yourAnswer)}: {opt ? t(opt.text) : '—'}
                      </p>
                      {ev && <p className="act-review__fb">{t(ev.feedback)}</p>}
                      {!ev?.correct && right && (
                        <p>
                          <strong>{t(S.thisOne)}:</strong> {t(right.text)}
                        </p>
                      )}
                      <p className="cl-muted">
                        <strong>{t(S.why)}:</strong> {t(x.explanation)}
                      </p>
                    </li>
                  );
                })}
            </ol>
          </>
        )}
        {!done && <SupportNudge misses={questions.length - firstTryCount} guidance={guidance} onStepDown={onStepDown} />}
        <FinishRow
          done={done}
          onContinue={() => onComplete({ outcome: done ? 'completed' : 'retry', score })}
          onRetry={done ? undefined : retryMissed}
          retryLabel={S.retryMissed}
        />
      </div>
    );
  }

  if (!q) return null;

  // ───────────── answering ─────────────
  const instant = policy.instantFeedback;
  const deferred = policy.deferredFeedback;
  pickByIndex.current = (i) => {
    const o = q.options[i];
    if (!o || (!deferred && solved) || (!deferred && tried.includes(o.id))) return;
    if (instant) answer(o.id);
    else setSelected(o.id);
  };
  return (
    <div className="act act-quiz" data-testid="activity-quiz">
      <p className="cl-eyebrow">{t(S.question(pos + 1, round.length))}</p>
      <h3 ref={headingRef} tabIndex={-1} className="act-subheading" id={`${activity.id}-${q.id}-prompt`}>
        {t(q.prompt)}
      </h3>
      {deferred && <p className="cl-muted act-note">{t(S.deferredNote)}</p>}
      <HintBox text={q.hint} shown={hint.shown} canRequest={hint.canRequest} onToggle={hint.toggle} />
      <ul className="act-options" role="list" aria-labelledby={`${activity.id}-${q.id}-prompt`}>
        {q.options.map((o, i) => {
          const triedWrong = !deferred && tried.includes(o.id) && !o.correct;
          const isRight = !deferred && solved && o.correct;
          const isSelected = selected === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                className="act-option"
                data-state={isRight ? 'correct' : triedWrong ? 'incorrect' : isSelected ? 'selected' : 'idle'}
                aria-pressed={instant ? undefined : isSelected}
                disabled={(!deferred && solved) || triedWrong}
                onClick={() => (instant ? answer(o.id) : setSelected(o.id))}
                data-option={o.id}
              >
                <span className="act-option__letter" aria-hidden="true" title={String(i + 1)}>
                  {LETTERS[i]}
                </span>
                <span className="act-option__text">{t(o.text)}</span>
                {isRight && (
                  <span className="act-status" data-ok="true">
                    <Icon name="check" size={16} />
                    {t(S.thisOne)}
                  </span>
                )}
                {triedWrong && (
                  <span className="act-status" data-ok="false">
                    <Icon name="x" size={16} />
                    {t(S.notThis)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {!instant && !solved && (
        <div className="act-actions">
          <Button disabled={!selected} onClick={() => selected && answer(selected)} data-testid="quiz-check">
            {deferred ? (pos < round.length - 1 ? t(S.saveAnswerNext) : t(S.seeResults)) : t(S.checkAnswer)}
          </Button>
        </div>
      )}

      {!deferred && lastEval && (
        <FeedbackPanel
          status={lastEval.correct ? 'correct' : 'incorrect'}
          locale={locale}
          why={lastEval.correct}
          actions={
            lastEval.correct ? (
              <Button iconEnd="next" onClick={() => goNext()} data-testid="quiz-next">
                {pos < round.length - 1 ? t(S.nextQuestion) : t(S.seeResults)}
              </Button>
            ) : undefined
          }
        >
          <p>{t(lastEval.feedback)}</p>
          {lastEval.correct ? <p>{t(lastEval.explanation)}</p> : <p className="cl-muted">{t(S.tryAgain)} ↑</p>}
        </FeedbackPanel>
      )}
      {!deferred && !solved && <SupportNudge misses={tried.length} guidance={guidance} onStepDown={onStepDown} />}
    </div>
  );
}
