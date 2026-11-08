import { useEffect, useId, useRef, useState } from 'react';
import type { DiagnoseActivity } from '../../domain/contracts';
import { formatBrewRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/icons';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { FeedbackPanel, type FeedbackStatus } from '../../ui/primitives/FeedbackPanel';
import { Tag } from '../../ui/primitives/Tag';
import { announce } from '../../ui/primitives/announcer';
import {
  annotateObservations,
  choiceOf,
  diagnoseScore,
  reasonGiven,
  scenarioResolved,
  type ChoiceQuality,
  type DiagnosePicks,
  type ObservationNote,
} from './logic/diagnose';
import { FinishRow, HintBox, SupportNudge, sfx, useHint } from './shared';
import { S } from './strings';
import type { ActivityProps } from './types';

const STATUS: Record<ChoiceQuality, FeedbackStatus> = { best: 'correct', reasonable: 'partly', unhelpful: 'incorrect' };

function Note({ note }: { note?: ObservationNote }) {
  const { t } = useI18n();
  if (!note) return null;
  return (
    <dd className="act-obs__note" data-verdict={note.verdict}>
      {t(note.text)}
    </dd>
  );
}

/**
 * Hypothetical scenario → choose ONE change. Feedback is graded by quality and always explains why;
 * the uncertainty caveat stays visible. Score = average quality of first picks.
 *
 * Guidance tiers (UX_SPEC §3):
 *  guided      — each number is annotated against the common reference range; hint shown; instant feedback.
 *  assisted    — raw numbers; hint on request (button / H); instant feedback.
 *  independent — raw numbers, no hint; pick a change AND write a short reason, then commit to see feedback.
 */
export function DiagnoseView({ activity, guidance, onComplete, hintSignal, onStepDown }: ActivityProps<DiagnoseActivity>) {
  const { t, locale } = useI18n();
  const scenarios = activity.scenarios;
  const independent = guidance === 'independent';
  const annotate = guidance === 'guided';
  const hint = useHint(guidance, hintSignal);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<DiagnosePicks>({});
  const [active, setActive] = useState<string | null>(null);
  // Independent tier: a selected-but-not-committed choice, the learner's reason, and validation state.
  const [pending, setPending] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [committedReason, setCommittedReason] = useState<string | null>(null);
  const [error, setError] = useState<'choice' | 'reason' | null>(null);
  const [misses, setMisses] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const moved = useRef(false);
  const uid = useId();

  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [index]);

  const s = scenarios[index];
  const finished = index >= scenarios.length;
  const score = diagnoseScore(scenarios, picks);
  const allResolved = scenarios.every((x) => scenarioResolved(x, picks));

  if (finished || !s) {
    return (
      <div className="act act-diagnose" data-testid="activity-diagnose" data-guidance={guidance}>
        <FeedbackPanel status={allResolved ? 'correct' : 'partly'} locale={locale}>
          <p>
            {t(
              S.firstTry(
                scenarios.filter((x) => choiceOf(x, picks[x.id]?.[0] ?? '')?.quality === 'best').length,
                scenarios.length,
              ),
            )}
          </p>
        </FeedbackPanel>
        <FinishRow done={allResolved} onContinue={() => onComplete({ outcome: allResolved ? 'completed' : 'retry', score })} />
      </div>
    );
  }

  const tried = picks[s.id] ?? [];
  const choice = active ? choiceOf(s, active) : undefined;
  const resolved = scenarioResolved(s, picks);
  const o = s.observations;
  const notes = annotate ? annotateObservations(o) : {};
  const hasNotes = !!(notes.ratio || notes.time);
  const askId = `${uid}-ask`;
  const reasonId = `${uid}-reason`;
  const errorId = `${uid}-error`;

  /** Records a graded pick and shows its feedback (all tiers; independent only after commit). */
  const record = (id: string) => {
    setPicks((p) => ({ ...p, [s.id]: [...(p[s.id] ?? []), id] }));
    setActive(id);
    const q = choiceOf(s, id)?.quality;
    setMisses((m) => (q === 'best' ? 0 : m + 1));
    sfx(q === 'best' ? 'correct' : q === 'reasonable' ? 'select' : 'incorrect');
  };

  const onOption = (id: string) => {
    if (!independent) {
      record(id);
      return;
    }
    setPending(id);
    setActive(null);
    setError(null);
    sfx('select');
  };

  const commit = () => {
    if (!pending) {
      setError('choice');
      announce(t(S.needChoice));
      return;
    }
    if (!reasonGiven(reason)) {
      setError('reason');
      announce(t(S.needReason));
      reasonRef.current?.focus();
      return;
    }
    setError(null);
    setCommittedReason(reason.trim());
    record(pending);
    setPending(null);
  };

  const next = () => {
    moved.current = true;
    setActive(null);
    setPending(null);
    setReason('');
    setCommittedReason(null);
    setError(null);
    setIndex((i) => i + 1);
  };

  return (
    <div className="act act-diagnose" data-testid="activity-diagnose" data-guidance={guidance}>
      <p className="cl-eyebrow">{t(S.scenario(index + 1, scenarios.length))}</p>
      <article className="act-scenario">
        <div className="act-scenario__head">
          <Tag tone="info" icon="flask">
            {t(S.hypothetical)}
          </Tag>
        </div>
        <h3 ref={headingRef} tabIndex={-1} className="act-subheading">
          {t(s.situation)}
        </h3>
        <dl className="act-obs" data-annotated={hasNotes || undefined}>
          {o.doseG !== undefined && (
            <div>
              <dt>{t(S.dose)}</dt>
              <dd className="cl-num">{o.doseG} g</dd>
            </div>
          )}
          {o.outG !== undefined && (
            <div>
              <dt>{t(S.outGeneric)}</dt>
              <dd className="cl-num">{o.outG} g</dd>
            </div>
          )}
          {o.doseG !== undefined && o.outG !== undefined && (
            <div>
              <dt>{t(S.ratio)}</dt>
              <dd className="cl-num">{formatBrewRatio(o.doseG, o.outG)}</dd>
              <Note note={notes.ratio} />
            </div>
          )}
          {o.timeSec !== undefined && (
            <div>
              <dt>{t(S.time)}</dt>
              <dd className="cl-num">{o.timeSec} s</dd>
              <Note note={notes.time} />
            </div>
          )}
          {o.taste && (
            <div className="act-obs__taste">
              <dt>{t(S.reportedTaste)}</dt>
              <dd>“{t(o.taste)}”</dd>
            </div>
          )}
        </dl>
        {hasNotes && <p className="act-obs__footnote">{t(S.annotationsNote)}</p>}
      </article>

      <HintBox text={S.diagnoseHint} shown={hint.shown} canRequest={hint.canRequest} onToggle={hint.toggle} />
      {independent && <p className="cl-muted act-diagnose__mode">{t(S.independentDiagnose)}</p>}

      <p className="act-prompt" id={askId}>
        {t(S.pickOne)}
      </p>
      <ul className="act-options" role="list" aria-labelledby={askId}>
        {s.choices.map((c) => {
          const was = tried.includes(c.id);
          const isPending = pending === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                className="act-option"
                data-state={
                  was ? (c.quality === 'best' ? 'correct' : c.quality === 'reasonable' ? 'partly' : 'incorrect') : isPending ? 'selected' : 'idle'
                }
                aria-pressed={independent && !was ? isPending : undefined}
                disabled={resolved || was}
                onClick={() => onOption(c.id)}
                data-choice={c.id}
              >
                <span className="act-option__text">{t(c.text)}</span>
                {was && (
                  <span className="act-status" data-ok={c.quality === 'best'}>
                    <Icon name={c.quality === 'best' ? 'check' : c.quality === 'reasonable' ? 'target' : 'x'} size={16} />
                    {t(S.qualityTitle[c.quality])}
                  </span>
                )}
                {isPending && !was && (
                  <span className="act-status">
                    <Icon name="flag" size={16} />
                    {t(S.selectedChoice)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {independent && !resolved && (
        <div className="act-diagnose__commit">
          <div className="act-field">
            <label htmlFor={reasonId} className="act-field__label">
              {t(S.reasonLabel)}
            </label>
            <textarea
              ref={reasonRef}
              id={reasonId}
              className="act-textarea act-textarea--short"
              rows={2}
              value={reason}
              aria-invalid={error === 'reason' || undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(e) => {
                setReason(e.target.value);
                if (error === 'reason') setError(null);
              }}
              data-testid="diagnose-reason"
            />
          </div>
          {error && (
            <p id={errorId} className="act-diagnose__error" role="alert">
              <Icon name="info" size={16} /> {t(error === 'choice' ? S.needChoice : S.needReason)}
            </p>
          )}
          <Button onClick={commit} icon="check" data-testid="diagnose-commit">
            {t(S.checkChoice)}
          </Button>
        </div>
      )}

      {choice && (
        <FeedbackPanel
          status={STATUS[choice.quality]}
          locale={locale}
          title={t(S.qualityTitle[choice.quality])}
          why
          actions={
            resolved ? (
              <Button iconEnd="next" onClick={next} data-testid="diagnose-next">
                {index < scenarios.length - 1 ? t(S.nextScenario) : t(S.continue)}
              </Button>
            ) : (
              <>
                <span className="cl-muted">{t(S.tryAnother)} ↑</span>
                <Button variant="ghost" onClick={next}>
                  {t(S.continueAnyway)}
                </Button>
              </>
            )
          }
        >
          {independent && committedReason && (
            <p className="act-diagnose__reason">
              <strong>{t(S.yourReason)}:</strong> “{committedReason}” — {t(S.compareReason)}
            </p>
          )}
          <p>{t(choice.feedback)}</p>
        </FeedbackPanel>
      )}

      <SupportNudge misses={misses} guidance={guidance} onStepDown={onStepDown} />

      <Callout kind="illustrative" locale={locale} title={t(S.uncertainty)}>
        {t(s.caveat)}
      </Callout>
    </div>
  );
}
