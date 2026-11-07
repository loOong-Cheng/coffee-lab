/** After serving: what differs from the order, specifically, and why. */
import { useState } from 'react';
import type { DrinkRecipe, Guidance } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Button, Callout, FeedbackPanel, Kbd } from '../../ui';
import { CupView } from './CupView';
import { statusFor, type CompleteBuild, type Diff, type Evaluation } from './model';
import type { BuildSpec } from './specs';
import { COMPONENT_TEXT, S, genericWhy, joinValues, valueText } from './strings';

export interface FeedbackProps {
  spec: BuildSpec;
  drink: DrinkRecipe;
  build: CompleteBuild;
  evaluation: Evaluation;
  guidance: Guidance;
  lookalikeName: string | null;
  isLast: boolean;
  missStreak: number;
  showKeys: boolean;
  onRetry(): void;
  onNext(): void;
  onSwitchGuided(): void;
}

function DiffItem({ d, spec, reveal }: { d: Diff; spec: BuildSpec; reveal: boolean }) {
  const { t } = useI18n();
  // Right cup, but the build is too big for it: the fix lies in the other differences, not the cup.
  const rightCupOverflow = d.component === 'cup' && !!d.overflow && d.expected.includes(d.got);
  const why = rightCupOverflow ? S.overflowWhy : (spec.why[d.component] ?? genericWhy(d));
  const extrasDetail = d.component === 'extras';
  return (
    <li className="cafe-diff" data-component={d.component}>
      <p className="cafe-diff__head">
        <strong>{t(COMPONENT_TEXT[d.component])}</strong>
        {!extrasDetail && (
          <span className="cafe-diff__vals">
            <span>
              {t(S.you)}: {t(valueText(d.component, d.got))}
            </span>
            {reveal && !rightCupOverflow && (
              <span>
                {t(S.order)}: {t(joinValues(d.component, d.expected))}
              </span>
            )}
          </span>
        )}
      </p>
      {extrasDetail && (d.missing?.length || d.unexpected?.length) ? (
        <p className="cafe-diff__vals">{t(genericWhy(d))}</p>
      ) : null}
      {d.overflow && <p className="cafe-diff__vals">{t(S.overflowNote(d.overflow.volumeMl, d.overflow.capacityMl))}</p>}
      <p className="cafe-diff__why">
        <span className="cafe-diff__whylabel">{t(S.why)}:</span> {t(why)}
      </p>
    </li>
  );
}

export function ServeFeedback({
  spec,
  drink,
  build,
  evaluation,
  guidance,
  lookalikeName,
  isLast,
  missStreak,
  showKeys,
  onRetry,
  onNext,
  onSwitchGuided,
}: FeedbackProps) {
  const { t, locale } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const status = statusFor(evaluation);
  const reveal = guidance !== 'independent' || revealed || evaluation.correct;
  const title = status === 'correct' ? S.fbCorrect : status === 'partly' ? S.fbPartly : S.fbIncorrect;
  const parts = evaluation.judged.length;
  const right = parts - evaluation.diffs.length;

  return (
    <section className="cafe-feedback" data-testid="cafe-feedback" data-status={status} aria-label={t(title)}>
      <FeedbackPanel
        status={status}
        locale={locale}
        title={t(title)}
        focusOnShow
        actions={
          <>
            {!evaluation.correct && (
              <Button variant="secondary" icon="repeat" onClick={onRetry} data-testid="cafe-retry" aria-keyshortcuts="R">
                {t(S.tryAgain)}
                {showKeys && <Kbd className="cafe-kbd" aria-hidden="true">R</Kbd>}
              </Button>
            )}
            {!evaluation.correct && !reveal && (
              <Button variant="ghost" icon="eye" onClick={() => setRevealed(true)} data-testid="cafe-reveal">
                {t(S.showAnswer)}
              </Button>
            )}
            <Button variant={evaluation.correct ? 'primary' : 'ghost'} iconEnd="next" onClick={onNext} data-testid="cafe-next" aria-keyshortcuts="N">
              {isLast ? t(S.finishShift) : t(S.nextOrder)}
              {showKeys && <Kbd className="cafe-kbd" aria-hidden="true">N</Kbd>}
            </Button>
          </>
        }
      >
        {evaluation.correct ? (
          <p>
            <strong>{t(S.keyPoint)}:</strong> {t(spec.keyPoint)}
          </p>
        ) : (
          <>
            {lookalikeName && (
              <p className="cafe-lookalike" data-testid="cafe-lookalike">
                {t(S.lookalike(lookalikeName, t(drink.name)))}
              </p>
            )}
            <ul className="cafe-diffs">
              {evaluation.diffs.map((d) => (
                <DiffItem key={d.component} d={d} spec={spec} reveal={reveal} />
              ))}
            </ul>
            {!reveal && <p className="cafe-small cl-muted">{t(S.answerHidden)}</p>}
          </>
        )}
        <p className="cafe-small cl-muted" data-testid="cafe-score">
          {t(S.scoreLine(right, parts))}
        </p>
      </FeedbackPanel>

      {missStreak >= 2 && guidance !== 'guided' && (
        <div className="cafe-support" role="note">
          <p>{t(S.moreSupport)}</p>
          <Button variant="secondary" size="sm" onClick={onSwitchGuided} data-testid="cafe-more-support">
            {t(S.switchGuided)}
          </Button>
        </div>
      )}

      <figure className="cafe-compare">
        <div>
          <CupView build={build} locale={locale} size={150} label={t(S.yourCup)} testId="cafe-cup-yours" />
          <figcaption>{t(S.yourCup)}</figcaption>
        </div>
        {reveal && (
          <div>
            <CupView build={spec.canonical} locale={locale} size={150} label={t(S.theOrder)} testId="cafe-cup-order" />
            <figcaption>
              {t(S.theOrder)} · {t(drink.name)}
            </figcaption>
          </div>
        )}
      </figure>

      <Callout kind="culture" locale={locale}>
        <p>{t(drink.cultureNote)}</p>
      </Callout>
      <p className="cafe-small cl-muted">{t(S.versionsShort)}</p>
    </section>
  );
}
