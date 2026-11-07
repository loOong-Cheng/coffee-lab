/**
 * /cafe — Café Counter (咖啡馆吧台): customers order drinks and the learner builds them from their
 * structure (shots, water, milk amount + texture, ice, extras, cup, brewer). 2D on purpose.
 * URL state: ?level=<bar|milk|world> (in a shift), &g=<guidance>, &timer=1, &seed=<n> (reproducible shift).
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PHONE_QUERY, useMediaQuery } from '../../app/useMediaQuery';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import type { Guidance, Mode } from '../../domain/contracts';
import { useCapabilities } from '../../platform';
import { useLearner } from '../../state';
import { GUIDANCE_ORDER } from '../../ui';
import { Lobby } from './Lobby';
import { LEVEL_ORDER, type CafeLevelId } from './model';
import { Round } from './Round';
import { S } from './strings';
import './cafe.css';

const isLevel = (v: string | null): v is CafeLevelId => !!v && (LEVEL_ORDER as readonly string[]).includes(v);
const isGuidance = (v: string | null): v is Guidance => !!v && (GUIDANCE_ORDER as readonly string[]).includes(v);

export default function CafePage() {
  useDocumentTitle(S.title);
  const [params, setParams] = useSearchParams();
  const defaultGuidance = useLearner((s) => s.prefs.defaultGuidance);
  const phone = useMediaQuery(PHONE_QUERY);
  const caps = useCapabilities();
  const mode: Mode = phone || caps?.screen === 'mobile' ? 'mobile' : 'desktop';
  const [round, setRound] = useState(0);
  const [fallbackSeed] = useState(() => Date.now() % 2147483647);

  const levelParam = params.get('level');
  const level = isLevel(levelParam) ? levelParam : null;
  const gParam = params.get('g');
  const guidance: Guidance = isGuidance(gParam) ? gParam : defaultGuidance;
  const timerOn = guidance === 'independent' && params.get('timer') === '1';
  const seedParam = Number(params.get('seed'));
  const seed = (Number.isFinite(seedParam) && seedParam > 0 ? seedParam : fallbackSeed) + round * 7919;

  const update = (patch: Record<string, string | null>, replace = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace });
  };

  return (
    <div className="cafe-page" data-testid="cafe-page">
      {level ? (
        <Round
          key={`${level}-${seed}`}
          level={level}
          seed={seed}
          guidance={guidance}
          onGuidance={(g) => update({ g })}
          timerOn={timerOn}
          mode={mode}
          phone={phone}
          onExit={() => update({ level: null }, false)}
          onAnother={() => setRound((r) => r + 1)}
          onNextLevel={(l) => {
            setRound((r) => r + 1);
            update({ level: l }, false);
          }}
        />
      ) : (
        <Lobby
          guidance={guidance}
          onGuidance={(g) => update({ g })}
          timerOn={timerOn}
          onTimer={(on) => update({ timer: on ? '1' : null })}
          onStart={(l) => update({ level: l }, false)}
        />
      )}
    </div>
  );
}
