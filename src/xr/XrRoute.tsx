/**
 * /xr — the optional XR coffee lab: mission picker (#/xr), deep-linked mission
 * briefs (#/xr?mission=<id>), and the player. Capability check → "Enter VR"
 * only when the browser reports support; otherwise 3D here or the action list.
 * VR mode is HARDWARE-UNVERIFIED (no headset available).
 */
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import type { Guidance } from '../domain/contracts';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { useI18n } from '../i18n';
import { useCapabilities, useXrSupport } from '../platform';
import { useLearner } from '../state';
import { Button } from '../ui/primitives/Button';
import { Callout } from '../ui/primitives/Callout';
import { GuidanceSelector } from '../ui/primitives/Guidance';
import { createStore, type AnyMission, type AnyStore, type MissionId } from './mission/core';
import { GUIDANCE_LABEL, fmt } from './mission/content';
import { MISSIONS, getMission, missionHref, parseMissionParam } from './missions/registry';
import { detectWebGL, xrEntryState, type XrEntryState } from './entry';
import { S } from './strings';
import { MissionPlayer } from './ui/MissionPlayer';
import './xr.css';

/** Per-mission stores survive route remounts within this page session so "Exit" → "Resume" works. */
const sessions = new Map<MissionId, AnyStore>();

function stepOf(def: AnyMission, store: AnyStore) {
  return def.hud(store.getState());
}

export default function XrRoute() {
  const { t, locale } = useI18n();
  const location = useLocation();
  const def = getMission(parseMissionParam(location.search));
  useDocumentTitle(def ? def.short : S.labTitle);
  const defaultGuidance = useLearner((s) => s.prefs.defaultGuidance);
  const support = useXrSupport();
  const caps = useCapabilities();
  const webgl = useMemo(() => detectWebGL(), []);
  const entry = xrEntryState(support, webgl);
  const [guidance, setGuidance] = useState<Guidance>(defaultGuidance ?? 'guided');
  const [playing, setPlaying] = useState<null | { def: AnyMission; mode: '3d' | 'list'; store: AnyStore }>(null);

  const start = (d: AnyMission, mode: '3d' | 'list', fresh: boolean) => {
    let store = sessions.get(d.id);
    if (fresh || !store) {
      store = createStore((s, a) => d.reduce(s, a), d.create(guidance));
      sessions.set(d.id, store);
    } else if (store.getState().guidance !== guidance) store.dispatch({ type: 'SET_GUIDANCE', guidance });
    setPlaying({ def: d, mode, store });
    try {
      window.scrollTo({ top: 0 });
    } catch {
      /* non-browser env */
    }
  };

  if (playing && playing.def === def) {
    return (
      <div className="xr-route xr-route--playing">
        <h1 className="cl-visually-hidden">{t(playing.def.title)}</h1>
        <MissionPlayer
          def={playing.def}
          store={playing.store}
          mode={playing.mode}
          xrSupported={entry.canEnterVR}
          touch={!!caps?.touch}
          onExit={() => {
            setGuidance(playing.store.getState().guidance);
            setPlaying(null);
          }}
        />
      </div>
    );
  }

  if (!def) return <Picker entry={entry} guidance={guidance} setGuidance={setGuidance} />;

  const resumable = (() => {
    const s = sessions.get(def.id);
    if (!s || s.getState().status === 'complete') return null;
    const h = stepOf(def, s);
    return h.stepIndex > 0 ? { store: s, step: h.stepIndex + 1, count: h.stepCount } : null;
  })();

  return (
    <section className="xr-route xr-brief" aria-labelledby="xr-title" data-mission={def.id}>
      <p className="xr-eyebrow">
        <Link to="/xr">{t(S.allMissions)}</Link> · {t(S.eyebrow)}
      </p>
      <h1 id="xr-title">{t(def.title)}</h1>
      <p className="xr-lead">{t(def.intro)}</p>
      <div className="xr-brief__grid">
        <div className="xr-card">
          <h2>{t(S.stepsHeading)}</h2>
          <ol className="xr-steps">
            {def.stepTitles.map((x) => (
              <li key={x.en}>{t(x)}</li>
            ))}
          </ol>
        </div>
        <div className="xr-card">
          <h2>{t(S.trainsHeading)}</h2>
          <ul>
            {def.practices.map((x) => (
              <li key={x.en}>{t(x)}</li>
            ))}
          </ul>
          <h2>{t(S.notHeading)}</h2>
          <ul>
            {def.notTrains.map((x) => (
              <li key={x.en}>{t(x)}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="xr-card">
        <h2>{t(S.guidanceHeading)}</h2>
        <GuidanceSelector value={guidance} onChange={setGuidance} locale={locale} variant="full" label={t(S.guidanceHeading)} />
        <p className="xr-small xr-muted">{t(S.guidanceNote)}</p>
      </div>
      <div className="xr-card" data-testid="xr-capability" data-reason={entry.reason}>
        <h2>{t(S.capabilityHeading)}</h2>
        <p role="status">{t(entry.message)}</p>
        <div className="xr-row">
          {resumable ? (
            <Button icon="play" onClick={() => start(def, webgl ? '3d' : 'list', false)}>
              {`${t(S.resume)} · ${t(S.step)} ${resumable.step}${t(S.of)}${resumable.count}`}
            </Button>
          ) : null}
          {entry.canEnterVR ? (
            <Button icon="headset" variant={resumable ? 'secondary' : 'primary'} onClick={() => start(def, '3d', true)}>
              {t(S.startForVR)}
            </Button>
          ) : null}
          {entry.canPlay3D ? (
            <Button icon="cube" variant={entry.canEnterVR || resumable ? 'secondary' : 'primary'} onClick={() => start(def, '3d', true)} data-testid="xr-play-3d">
              {t(S.play3d)}
            </Button>
          ) : null}
          <Button icon="menu" variant="ghost" onClick={() => start(def, 'list', true)} data-testid="xr-play-list">
            {t(S.playList)}
          </Button>
        </div>
      </div>
      <Callout kind="info" locale={locale}>
        {t(S.hardwareUnverified)}
      </Callout>
      <p className="xr-row">
        <Link to={`/learn/${def.lessonId}`}>{t(S.workflowLesson)}</Link>
        <Link to="/xr">{t(S.allMissions)}</Link>
      </p>
    </section>
  );
}

function Picker({ entry, guidance, setGuidance }: { entry: XrEntryState; guidance: Guidance; setGuidance(g: Guidance): void }) {
  const { t, locale } = useI18n();
  const events = useLearner((s) => s.events);
  return (
    <section className="xr-route xr-brief" aria-labelledby="xr-lab-title" data-testid="xr-picker">
      <p className="xr-eyebrow">{t(S.eyebrow)}</p>
      <h1 id="xr-lab-title">{t(S.labTitle)}</h1>
      <p className="xr-lead">{t(S.labIntro)}</p>
      <div className="xr-card" data-testid="xr-capability" data-reason={entry.reason}>
        <h2>{t(S.capabilityHeading)}</h2>
        <p role="status">{t(entry.message)}</p>
      </div>
      <div className="xr-card">
        <h2>{t(S.playingAt)}</h2>
        <GuidanceSelector value={guidance} onChange={setGuidance} locale={locale} label={t(S.playingAt)} />
      </div>
      <h2 className="xr-section-h">{t(S.missionsHeading)}</h2>
      <ul className="xr-missions">
        {MISSIONS.map((m) => {
          const mine = events.filter((e) => e.activityId === m.activityId && e.outcome === 'completed' && e.evidence === 'simulated');
          const last = mine[mine.length - 1];
          return (
            <li key={m.id} className="xr-card xr-mission" data-testid={`xr-mission-${m.id}`} data-completed={last ? 'true' : 'false'}>
              <h3>
                <Link to={missionHref(m.id)}>{t(m.title)}</Link>
              </h3>
              <p className="xr-small xr-muted">
                {t(fmt(S.minutes, { a: m.minutes[0], b: m.minutes[1] }))} · {m.stepTitles.length} {t({ en: 'steps', zh: '步' })}
              </p>
              <p>{t(m.intro)}</p>
              <p className="xr-small">
                <strong>{t(S.youPractise)}:</strong> {m.practices.map((x) => t(x)).join(' · ')}
              </p>
              <p className="xr-small xr-muted">
                <strong>{t(S.notTrained)}:</strong> {m.notTrains.map((x) => t(x)).join(' · ')}
              </p>
              <p className="xr-small" data-testid={`xr-mission-status-${m.id}`}>
                {last
                  ? t(fmt(S.completedOn, { n: mine.length, tier: GUIDANCE_LABEL[last.guidance], score: `${Math.round((last.score ?? 0) * 100)}%` }))
                  : t(S.notYet)}
              </p>
              <Link className="cl-btn cl-btn--primary cl-btn--md" to={missionHref(m.id)}>
                {t(S.open)}
              </Link>
            </li>
          );
        })}
      </ul>
      <Callout kind="info" locale={locale}>
        {t(S.hardwareUnverified)}
      </Callout>
    </section>
  );
}
