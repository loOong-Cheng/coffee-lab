import { useEffect, useRef, useState } from 'react';
import type { DiagnoseActivity } from '../../domain/contracts';
import { formatBrewRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/icons';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { FeedbackPanel, type FeedbackStatus } from '../../ui/primitives/FeedbackPanel';
import { Tag } from '../../ui/primitives/Tag';
import { choiceOf, diagnoseScore, scenarioResolved, type ChoiceQuality, type DiagnosePicks } from './logic/diagnose';
import { FinishRow, sfx } from './shared';
import { S } from './strings';
import type { ActivityProps } from './types';

const STATUS: Record<ChoiceQuality, FeedbackStatus> = { best: 'correct', reasonable: 'partly', unhelpful: 'incorrect' };

/**
 * Hypothetical scenario → choose ONE change. Feedback is graded by quality and always explains why;
 * the uncertainty caveat stays visible. Score = average quality of first picks.
 */
export function DiagnoseView({ activity, onComplete }: ActivityProps<DiagnoseActivity>) {
  const { t, locale } = useI18n();
  const scenarios = activity.scenarios;
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<DiagnosePicks>({});
  const [active, setActive] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [index]);

  const s = scenarios[index];
  const finished = index >= scenarios.length;
  const score = diagnoseScore(scenarios, picks);
  const allResolved = scenarios.every((x) => scenarioResolved(x, picks));

  if (finished || !s) {
    return (
      <div className="act act-diagnose" data-testid="activity-diagnose">
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

  const pick = (id: string) => {
    setPicks((p) => ({ ...p, [s.id]: [...(p[s.id] ?? []), id] }));
    setActive(id);
    const q = choiceOf(s, id)?.quality;
    sfx(q === 'best' ? 'correct' : q === 'reasonable' ? 'select' : 'incorrect');
  };

  const next = () => {
    moved.current = true;
    setActive(null);
    setIndex((i) => i + 1);
  };

  return (
    <div className="act act-diagnose" data-testid="activity-diagnose">
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
        <dl className="act-obs">
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
            </div>
          )}
          {o.timeSec !== undefined && (
            <div>
              <dt>{t(S.time)}</dt>
              <dd className="cl-num">{o.timeSec} s</dd>
            </div>
          )}
          {o.taste && (
            <div className="act-obs__taste">
              <dt>{t(S.reportedTaste)}</dt>
              <dd>“{t(o.taste)}”</dd>
            </div>
          )}
        </dl>
      </article>

      <p className="act-prompt" id={`${activity.id}-${s.id}-ask`}>
        {t(S.pickOne)}
      </p>
      <ul className="act-options" role="list" aria-labelledby={`${activity.id}-${s.id}-ask`}>
        {s.choices.map((c) => {
          const was = tried.includes(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                className="act-option"
                data-state={was ? (c.quality === 'best' ? 'correct' : c.quality === 'reasonable' ? 'partly' : 'incorrect') : 'idle'}
                disabled={resolved || was}
                onClick={() => pick(c.id)}
                data-choice={c.id}
              >
                <span className="act-option__text">{t(c.text)}</span>
                {was && (
                  <span className="act-status" data-ok={c.quality === 'best'}>
                    <Icon name={c.quality === 'best' ? 'check' : c.quality === 'reasonable' ? 'target' : 'x'} size={16} />
                    {t(S.qualityTitle[c.quality])}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

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
          <p>{t(choice.feedback)}</p>
        </FeedbackPanel>
      )}

      <Callout kind="illustrative" locale={locale} title={t(S.uncertainty)}>
        {t(s.caveat)}
      </Callout>
    </div>
  );
}
