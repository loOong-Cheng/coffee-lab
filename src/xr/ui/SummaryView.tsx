/** End-of-mission summary: what was practised (simulated) and what still needs real hands-on practice. */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import type { Guidance } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { EvidenceBadge } from '../../ui/primitives/EvidenceBadge';
import { Callout } from '../../ui/primitives/Callout';
import type { AnyMission, MissionResult } from '../mission/core';
import { GUIDANCE_LABEL } from '../mission/content';
import { GUIDANCE_ORDER } from '../mission/tiers';
import { S } from '../strings';

export function SummaryView({
  def,
  result,
  saved,
  onAgain,
  onTier,
}: {
  def: AnyMission;
  result: MissionResult;
  saved: boolean;
  onAgain(): void;
  onTier(g: Guidance): void;
}) {
  const { t, locale } = useI18n();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const next = GUIDANCE_ORDER[GUIDANCE_ORDER.indexOf(result.guidanceFinal) + 1];

  return (
    <section className="xr-summary" aria-labelledby="xr-summary-h" data-testid="xr-summary" data-mission={def.id}>
      <h2 id="xr-summary-h" ref={heading} tabIndex={-1}>
        {t(S.summaryTitle)} · {t(def.short)}
      </h2>
      <p className="xr-summary__badges">
        <EvidenceBadge kind="simulated" locale={locale} />
        <span className="xr-chip">{t(GUIDANCE_LABEL[result.guidanceForRecord])}</span>
      </p>
      <p className="xr-muted">{t(S.summaryEvidence)}</p>
      {saved ? <p className="xr-small xr-muted">{t(S.saved)}</p> : null}
      <dl className="xr-stats">
        {result.stats.map((x) => (
          <div key={x.label.en}>
            <dt>{t(x.label)}</dt>
            <dd>{t(x.value)}</dd>
          </div>
        ))}
      </dl>
      {result.note ? (
        <Callout kind={result.illustrativeModel ? 'illustrative' : 'info'} locale={locale}>
          {t(result.note)}
        </Callout>
      ) : null}
      <div className="xr-summary__cols">
        <div>
          <h3>{t(S.practicedHeading)}</h3>
          <ul>
            {result.practiced.map((p) => (
              <li key={p.en}>{t(p)}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t(S.stillNeedsHeading)}</h3>
          <ul>
            {result.notTrained.map((p) => (
              <li key={p.en}>{t(p)}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="xr-row">
        <Link className="cl-btn cl-btn--primary cl-btn--md" to={def.realNext.to}>
          {t(def.realNext.label)}
        </Link>
        <Button variant="secondary" icon="repeat" onClick={onAgain}>
          {t(S.again)}
        </Button>
        {next ? (
          <Button variant="ghost" onClick={() => onTier(next)}>
            {t(S.tryNextTier)}: {t(GUIDANCE_LABEL[next])}
          </Button>
        ) : null}
        <Link to="/xr">{t(S.allMissions)}</Link>
      </div>
    </section>
  );
}
