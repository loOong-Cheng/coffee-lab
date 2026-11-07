/**
 * Lesson-player views for activities that happen ELSEWHERE:
 *  - guided-practice → real kitchen, on the phone (/practice/:activityId), self-reported
 *  - spatial-practice → the XR / 3D lab (/xr), recorded there as `simulated`
 * Neither blocks finishing the lesson; both show their honest limits.
 */
import { Link } from 'react-router';
import type { GuidedPracticeActivity, SpatialPracticeActivity } from '../../domain/contracts';
import { formatBrewRatio } from '../../domain/brew';
import { getEquipment } from '../../content';
import { useI18n } from '../../i18n';
import { useXrSupport } from '../../platform';
import { lastEventFor, useLearner } from '../../state';
import { Icon } from '../../ui/icons';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { EvidenceBadge } from '../../ui/primitives/EvidenceBadge';
import { Tag } from '../../ui/primitives/Tag';
import { S } from './strings';
import type { ActivityProps } from './types';

function practiceHref(activityId: string): string {
  return `/practice/${encodeURIComponent(activityId)}`;
}

export function GuidedPracticePreview({ activity, onComplete }: ActivityProps<GuidedPracticeActivity>) {
  const { t, locale } = useI18n();
  const owned = useLearner((s) => s.profile?.equipment ?? []);
  const doneBefore = useLearner((s) => s.events.some((e) => e.activityId === activity.id && e.outcome === 'completed'));
  const r = activity.recipe;
  const absolute = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#${practiceHref(activity.id)}` : '';

  return (
    <div className="act act-practice" data-testid="activity-guided-practice">
      <div className="act-practice__badges">
        <Tag tone="accent" icon="phone">
          {t(S.realWorld)}
        </Tag>
        <EvidenceBadge kind="self_report" locale={locale} />
        {doneBefore && (
          <Tag tone="success" icon="check">
            {t(S.doneBefore)}
          </Tag>
        )}
      </div>
      <p className="cl-muted">{t(S.practiceHonest)}</p>

      <div className="act-practice__grid">
        <section aria-labelledby={`${activity.id}-gear`}>
          <h3 id={`${activity.id}-gear`} className="act-col-title">
            {t(S.youNeed)}
          </h3>
          <ul className="act-gear" role="list">
            {activity.equipment.map((id) => {
              const eq = getEquipment(id);
              const has = owned.includes(id);
              return (
                <li key={id} data-owned={has}>
                  <Icon name={has ? 'check' : 'plus'} size={16} />
                  <span>{eq ? t(eq.name) : id}</span>
                  <span className="act-gear__own">{has ? t(S.own) : t(S.notYetOwned)}</span>
                </li>
              );
            })}
          </ul>
        </section>
        {r && (
          <section aria-labelledby={`${activity.id}-recipe`} className="act-recipe">
            <h3 id={`${activity.id}-recipe`} className="act-col-title">
              {t(S.recipe)}
            </h3>
            <p className="act-recipe__numbers cl-num">
              {r.doseG} g → {r.outG} g · {formatBrewRatio(r.doseG, r.outG)}
            </p>
            <p>{t(r.ratioLabel)}</p>
            {r.targetTimeSec && <p className="cl-muted">{t(S.targetTime(r.targetTimeSec[0], r.targetTimeSec[1]))}</p>}
            <p className="cl-muted">{t(r.note)}</p>
          </section>
        )}
      </div>

      {(activity.safetyNotes ?? []).map((n, i) => (
        <Callout key={i} kind="safety" locale={locale}>
          {t(n)}
        </Callout>
      ))}

      <details className="act-steps-preview">
        <summary>
          {t(S.stepsPreview)} ({activity.steps.length})
        </summary>
        <ol>
          {activity.steps.map((st) => (
            <li key={st.id}>
              <span>{t(st.text)}</span>
              {st.safety && (
                <span className="act-steps-preview__safety">
                  <Icon name="shield" size={14} /> {t(st.safety)}
                </span>
              )}
            </li>
          ))}
        </ol>
      </details>

      <div className="act-practice__cta">
        <Link className="cl-btn cl-btn--primary cl-btn--lg" to={practiceHref(activity.id)} data-testid="open-kitchen-mode">
          <Icon name="phone" size={22} />
          <span className="cl-btn__label">{t(S.openKitchen)}</span>
        </Link>
        {absolute && (
          <p className="cl-muted act-practice__url">
            {t(S.onPhone)} <code>{absolute}</code>
          </p>
        )}
      </div>
      <div className="act-finish">
        <Button variant="secondary" iconEnd="next" onClick={() => onComplete({ outcome: 'skipped' })} data-testid="activity-continue">
          {t(S.later)}
        </Button>
      </div>
    </div>
  );
}

export function SpatialPracticeCard({ activity, onComplete }: ActivityProps<SpatialPracticeActivity>) {
  const { t, locale } = useI18n();
  const xr = useXrSupport();
  const last = useLearner((s) => lastEventFor(s.events, activity.id));
  // Done only when the XR / 3D lab itself recorded a completed SIMULATED run for this activity.
  const done = useLearner((s) =>
    s.events.some((e) => e.activityId === activity.id && e.outcome === 'completed' && e.evidence === 'simulated'),
  );
  const xrHref = `/xr?mission=${encodeURIComponent(activity.missionId)}`;

  return (
    <div className="act act-spatial" data-testid="activity-spatial-practice">
      <div className="act-practice__badges">
        <Tag tone="info" icon="headset">
          {t(S.xrMission)}
        </Tag>
        <EvidenceBadge kind="simulated" locale={locale} />
        {done && (
          <Tag tone="success" icon="check">
            {t(S.xrDone)}
          </Tag>
        )}
      </div>
      <p>{t(activity.summary)}</p>
      <Callout kind="info" locale={locale} title={t(S.whatNot)}>
        {t(activity.limits)}
      </Callout>
      {(activity.safetyNotes ?? []).map((n, i) => (
        <Callout key={i} kind="safety" locale={locale}>
          {t(n)}
        </Callout>
      ))}
      <p className="act-xr-status" role="status">
        <Icon name="headset" size={18} /> {xr === null ? t(S.xrChecking) : xr.immersiveVR ? t(S.xrYes) : t(S.xrNo)}
      </p>
      {last && last.outcome === 'completed' && typeof last.score === 'number' && (
        <p className="cl-muted">{Math.round(last.score * 100)}%</p>
      )}
      <p className="cl-muted">{t(S.xrOptional)}</p>
      <div className="act-finish">
        <Link className="cl-btn cl-btn--secondary cl-btn--md" to={xrHref} data-testid="open-xr">
          <Icon name="cube" size={20} />
          <span className="cl-btn__label">{t(S.openXr)}</span>
        </Link>
        <Button iconEnd="next" onClick={() => onComplete({ outcome: done ? 'completed' : 'skipped' })} data-testid="activity-continue">
          {t(S.continue)}
        </Button>
      </div>
    </div>
  );
}
