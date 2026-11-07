/** End-of-mission summary: what was practised (simulated) and what still needs real hands-on practice. */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import type { Guidance } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { EvidenceBadge } from '../../ui/primitives/EvidenceBadge';
import { Callout } from '../../ui/primitives/Callout';
import type { MissionSummary } from '../mission/summary';
import { GUIDANCE_LABEL } from '../mission/content';
import { GUIDANCE_ORDER } from '../mission/tiers';
import { S } from '../strings';

export function SummaryView({
  summary,
  saved,
  onAgain,
  onTier,
}: {
  summary: MissionSummary;
  saved: boolean;
  onAgain(): void;
  onTier(g: Guidance): void;
}) {
  const { t, locale } = useI18n();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const next = GUIDANCE_ORDER[GUIDANCE_ORDER.indexOf(summary.guidanceFinal) + 1];
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <section className="xr-summary" aria-labelledby="xr-summary-h" data-testid="xr-summary">
      <h2 id="xr-summary-h" ref={heading} tabIndex={-1}>
        {t(S.summaryTitle)}
      </h2>
      <p className="xr-summary__badges">
        <EvidenceBadge kind="simulated" locale={locale} />
        <span className="xr-chip">{t(GUIDANCE_LABEL[summary.guidanceForRecord])}</span>
      </p>
      <p className="xr-muted">{t(S.summaryEvidence)}</p>
      {saved ? <p className="xr-small xr-muted">{t(S.saved)}</p> : null}

      <dl className="xr-stats">
        <div>
          <dt>{t(S.sequence)}</dt>
          <dd>{pct(summary.sequenceAccuracy)}</dd>
        </div>
        <div>
          <dt>{t(S.stopAccuracy)}</dt>
          <dd>{summary.stop ? `${summary.stop.finalYieldG} ${t(S.grams)} / ${summary.stop.targetG} ${t(S.grams)}` : '—'}</dd>
        </div>
        <div>
          <dt>{t(S.time)}</dt>
          <dd>
            {summary.durationSec} {t(S.seconds)}
          </dd>
        </div>
        <div>
          <dt>{t(S.hintsUsed)}</dt>
          <dd>{summary.hintsUsed}</dd>
        </div>
        <div>
          <dt>{t(S.mistakes)}</dt>
          <dd>{summary.mistakes}</dd>
        </div>
        <div>
          <dt>{t(S.nearMisses)}</dt>
          <dd>{summary.nearMisses}</dd>
        </div>
        <div>
          <dt>{t(S.score)}</dt>
          <dd>{pct(summary.score)}</dd>
        </div>
      </dl>

      {summary.stopFeedback ? (
        <Callout kind="illustrative" locale={locale}>
          {t(summary.stopFeedback)}
          {summary.autoStopped ? ` ${t(S.autoStopped)}` : ''}
        </Callout>
      ) : null}

      <div className="xr-summary__cols">
        <div>
          <h3>{t(S.practicedHeading)}</h3>
          <ul>
            {summary.practiced.map((p) => (
              <li key={p.en}>{t(p)}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t(S.stillNeedsHeading)}</h3>
          <ul>
            {summary.notTrained.map((p) => (
              <li key={p.en}>{t(p)}</li>
            ))}
          </ul>
        </div>
      </div>

      <h3>{t(S.nextHeading)}</h3>
      <p>{t(S.nextReal)}</p>
      <div className="xr-row">
        <Link className="cl-btn cl-btn--primary cl-btn--md" to="/learn/esp-first-real-shot">
          {t(S.realShotLesson)}
        </Link>
        <Button variant="secondary" icon="repeat" onClick={onAgain}>
          {t(S.again)}
        </Button>
        {next ? (
          <Button variant="ghost" onClick={() => onTier(next)}>
            {t(S.tryNextTier)}: {t(GUIDANCE_LABEL[next])}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
