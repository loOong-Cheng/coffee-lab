/**
 * /xr — optional spatial practice: "Espresso counter: your first shot".
 * Brief → capability check → Enter VR (only when the browser reports support)
 * or Play in 3D here (mouse/touch) or the action list. The mission is fully
 * playable without a headset; VR mode is HARDWARE-UNVERIFIED (no headset available).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { Guidance } from '../domain/contracts';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { useI18n } from '../i18n';
import { useCapabilities, useXrSupport } from '../platform';
import { useLearner } from '../state';
import { Button } from '../ui/primitives/Button';
import { Callout } from '../ui/primitives/Callout';
import { GuidanceSelector } from '../ui/primitives/Guidance';
import { STEPS, STEP_ORDER } from './mission/content';
import { createMissionStore, type MissionStore } from './mission/store';
import { currentStepIndex } from './mission/reducer';
import { detectWebGL, xrEntryState } from './entry';
import { S } from './strings';
import { MissionPlayer } from './ui/MissionPlayer';
import './xr.css';

/** Survives route remounts within this page session so "Exit" → "Continue" works. */
let session: MissionStore | null = null;

export default function XrRoute() {
  const { t, locale } = useI18n();
  useDocumentTitle(S.missionShort);
  const defaultGuidance = useLearner((s) => s.prefs.defaultGuidance);
  const support = useXrSupport();
  const caps = useCapabilities();
  const webgl = useMemo(() => detectWebGL(), []);
  const entry = xrEntryState(support, webgl);
  const [guidance, setGuidance] = useState<Guidance>(() => session?.getState().guidance ?? defaultGuidance ?? 'guided');
  const [playing, setPlaying] = useState<null | { mode: '3d' | 'list'; store: MissionStore }>(null);

  const resumable = session && session.getState().status !== 'complete' && currentStepIndex(session.getState()) > 0 ? session : null;

  const start = (mode: '3d' | 'list', fresh: boolean) => {
    if (fresh || !session) session = createMissionStore(guidance);
    else if (session.getState().guidance !== guidance) session.dispatch({ type: 'SET_GUIDANCE', guidance });
    setPlaying({ mode, store: session });
    try {
      window.scrollTo({ top: 0 });
    } catch {
      /* non-browser env */
    }
  };

  if (playing) {
    return (
      <div className="xr-route xr-route--playing">
        <h1 className="cl-visually-hidden">{t(S.missionTitle)}</h1>
        <MissionPlayer
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

  return (
    <section className="xr-route xr-brief" aria-labelledby="xr-title">
      <p className="xr-eyebrow">{t(S.eyebrow)}</p>
      <h1 id="xr-title">{t(S.missionTitle)}</h1>
      <p className="xr-lead">{t(S.intro)}</p>

      <div className="xr-brief__grid">
        <div className="xr-card">
          <h2>{t(S.stepsHeading)}</h2>
          <ol className="xr-steps">
            {STEP_ORDER.map((id) => (
              <li key={id}>{t(STEPS[id].title)}</li>
            ))}
          </ol>
        </div>
        <div className="xr-card">
          <h2>{t(S.trainsHeading)}</h2>
          <ul>
            {S.trains.map((x) => (
              <li key={x.en}>{t(x)}</li>
            ))}
          </ul>
          <h2>{t(S.notHeading)}</h2>
          <ul>
            {S.notTrains.map((x) => (
              <li key={x.en}>{t(x)}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="xr-card">
        <h2 id="xr-guidance-h">{t(S.guidanceHeading)}</h2>
        <GuidanceSelector value={guidance} onChange={setGuidance} locale={locale} variant="full" label={t(S.guidanceHeading)} />
        <p className="xr-small xr-muted">{t(S.guidanceNote)}</p>
      </div>

      <div className="xr-card" data-testid="xr-capability" data-reason={entry.reason}>
        <h2>{t(S.capabilityHeading)}</h2>
        <p role="status">{t(entry.message)}</p>
        <div className="xr-row">
          {resumable ? (
            <Button icon="play" onClick={() => start(webgl ? '3d' : 'list', false)}>
              {`${t(S.resume)} · ${t(S.step)} ${currentStepIndex(resumable.getState()) + 1}${t(S.of)}${STEP_ORDER.length}`}
            </Button>
          ) : null}
          {entry.canEnterVR ? (
            <Button icon="headset" variant={resumable ? 'secondary' : 'primary'} onClick={() => start('3d', true)}>
              {t(S.startForVR)}
            </Button>
          ) : null}
          {entry.canPlay3D ? (
            <Button icon="cube" variant={entry.canEnterVR || resumable ? 'secondary' : 'primary'} onClick={() => start('3d', true)} data-testid="xr-play-3d">
              {t(S.play3d)}
            </Button>
          ) : null}
          <Button icon="menu" variant="ghost" onClick={() => start('list', true)} data-testid="xr-play-list">
            {t(S.playList)}
          </Button>
        </div>
      </div>

      <Callout kind="info" locale={locale}>
        {t(S.hardwareUnverified)}
      </Callout>

      <p className="xr-row">
        <Link to="/learn/esp-workflow">{t(S.workflowLesson)}</Link>
        <Link to="/">{t(S.backToLessons)}</Link>
      </p>
    </section>
  );
}
