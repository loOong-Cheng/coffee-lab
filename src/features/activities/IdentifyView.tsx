import { useEffect, useMemo, useRef, useState } from 'react';
import type { IdentifyActivity, LocalizedText } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { EspressoStationDiagram, ESPRESSO_PART_LABELS } from '../../ui/illustrations/EspressoStationDiagram';
import { PourOverStationDiagram, POUROVER_PART_LABELS } from '../../ui/illustrations/PourOverStationDiagram';
import type { DiagramProps } from '../../ui/illustrations/StationDiagram';
import { Button } from '../../ui/primitives/Button';
import { FeedbackPanel } from '../../ui/primitives/FeedbackPanel';
import { guidancePolicy } from './logic/guidance';
import { FinishRow, HintBox, SupportNudge, sfx, useHint } from './shared';
import { S } from './strings';
import type { ActivityProps } from './types';

type Target = IdentifyActivity['targets'][number];

const DEFAULT_LABELS: Record<IdentifyActivity['diagram'], Record<string, LocalizedText>> = {
  'espresso-station': ESPRESSO_PART_LABELS,
  'pourover-station': POUROVER_PART_LABELS,
};

function Diagram({ id, ...props }: DiagramProps<string> & { id: IdentifyActivity['diagram'] }) {
  // Both diagrams accept the same props; part ids are validated by the contract's DIAGRAM_PARTS.
  return id === 'pourover-station' ? (
    <PourOverStationDiagram {...(props as DiagramProps<never>)} />
  ) : (
    <EspressoStationDiagram {...(props as DiagramProps<never>)} />
  );
}

type Feedback =
  | { kind: 'found'; target: Target }
  | { kind: 'miss'; picked: string; highlighted: boolean }
  | { kind: 'revealed'; target: Target };

/**
 * Find parts on an original station diagram.
 *  explore — labelled pins; select any to read what it does (guided learners start here).
 *  check   — "Find: <part>" one target at a time. Wrong picks name what was picked; the target is
 *            highlighted after N misses (guided 1, assisted 2, independent never) and revealed after
 *            more misses (counted as missed). Hints: guided shown, assisted on request, independent none.
 */
export function IdentifyView({ activity, guidance, onComplete, hintSignal, onStepDown }: ActivityProps<IdentifyActivity>) {
  const { t, locale } = useI18n();
  const policy = guidancePolicy(guidance);
  const hint = useHint(guidance, hintSignal);
  const [mode, setMode] = useState<'explore' | 'quiz'>(guidance === 'guided' ? 'explore' : 'quiz');
  const [selected, setSelected] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>(() => activity.targets.map((x) => x.partId));
  const [pos, setPos] = useState(0);
  const [misses, setMisses] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState<Set<string>>(new Set());
  const [missedEver, setMissedEver] = useState<Set<string>>(new Set());
  const [wrongPins, setWrongPins] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const promptRef = useRef<HTMLParagraphElement>(null);
  const moved = useRef(false);
  const foundAfterReveal = useRef(new Set<string>());

  const targetsById = useMemo(() => new Map(activity.targets.map((x) => [x.partId as string, x])), [activity.targets]);
  const labels = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [id, l] of Object.entries(DEFAULT_LABELS[activity.diagram] ?? {})) out[id] = t(l);
    for (const x of activity.targets) out[x.partId] = t(x.label);
    return out;
  }, [activity, t]);

  const currentId = queue[pos];
  const current = currentId ? targetsById.get(currentId) : undefined;
  const roundDone = mode === 'quiz' && pos >= queue.length;
  const total = activity.targets.length;
  // A revealed part must be found again in a practice round before the check counts as complete.
  const allFound = activity.targets.every(
    (x) => found.includes(x.partId) && (!missedEver.has(x.partId) || foundAfterReveal.current.has(x.partId)),
  );

  useEffect(() => {
    if (moved.current) promptRef.current?.focus();
  }, [pos, mode]);

  const advance = () => {
    moved.current = true;
    setPos((p) => p + 1);
    setMisses(0);
    setWrongPins([]);
    setFeedback(null);
    hint.reset();
  };

  const pick = (partId: string) => {
    if (mode === 'explore') {
      setSelected(partId);
      sfx('select');
      return;
    }
    if (!current || feedback?.kind === 'found' || feedback?.kind === 'revealed') return;
    if (partId === current.partId) {
      setFound((f) => (f.includes(partId) ? f : [...f, partId]));
      if (misses === 0 && !missedEver.has(partId)) setFirstTry((s) => new Set(s).add(partId));
      if (missedEver.has(partId)) foundAfterReveal.current.add(partId);
      setFeedback({ kind: 'found', target: current });
      sfx('correct');
      return;
    }
    const nextMisses = misses + 1;
    setMisses(nextMisses);
    setWrongPins((w) => (w.includes(partId) ? w : [...w, partId]));
    sfx('incorrect');
    if (nextMisses >= policy.revealAfterMisses) {
      setMissedEver((s) => new Set(s).add(current.partId));
      setFeedback({ kind: 'revealed', target: current });
      return;
    }
    setFeedback({ kind: 'miss', picked: partId, highlighted: nextMisses >= policy.highlightAfterMisses });
  };

  const practiceMissed = () => {
    const missed = activity.targets.filter((x) => missedEver.has(x.partId) && !foundAfterReveal.current.has(x.partId)).map((x) => x.partId);
    moved.current = true;
    setQueue(missed);
    setPos(0);
    setMisses(0);
    setWrongPins([]);
    setFeedback(null);
  };

  const score = total ? firstTry.size / total : 0;
  const highlight =
    mode === 'quiz' && current && (misses >= policy.highlightAfterMisses || feedback?.kind === 'revealed') ? [current.partId] : [];
  const revealedPins = mode === 'quiz' ? [...found, ...(feedback?.kind === 'revealed' && current ? [current.partId] : [])] : [];
  const selectedTarget = selected ? targetsById.get(selected) : undefined;

  return (
    <div className="act act-identify" data-testid="activity-identify">
      <p className="act-prompt">{t(activity.prompt)}</p>
      <div className="act-identify__layout">
        <Diagram
          id={activity.diagram}
          mode={mode}
          locale={locale}
          labels={labels}
          selected={mode === 'explore' ? selected : null}
          highlighted={highlight}
          revealed={revealedPins}
          incorrect={mode === 'quiz' ? wrongPins : []}
          onSelectPart={pick}
          className="act-identify__diagram"
        />
        <div className="act-identify__panel">
          {mode === 'explore' ? (
            <>
              <p className="cl-muted">{t(S.exploreHelp)}</p>
              {selected && (
                <FeedbackPanel status="info" locale={locale} title={labels[selected] ?? selected}>
                  {selectedTarget ? t(selectedTarget.description) : null}
                </FeedbackPanel>
              )}
              <Button
                iconEnd="next"
                onClick={() => {
                  moved.current = true;
                  setMode('quiz');
                  setSelected(null);
                }}
                data-testid="identify-start"
              >
                {t(S.startCheck)}
              </Button>
            </>
          ) : roundDone ? (
            <>
              <FeedbackPanel status={allFound ? 'correct' : 'partly'} locale={locale} title={allFound ? t(S.allFound) : undefined}>
                <p>{t(S.firstTry(firstTry.size, total))}</p>
              </FeedbackPanel>
              <FinishRow
                done={allFound}
                onContinue={() => onComplete({ outcome: allFound ? 'completed' : 'retry', score })}
                onRetry={allFound ? undefined : practiceMissed}
                retryLabel={S.practiceMissed}
              />
            </>
          ) : current ? (
            <>
              <p className="cl-eyebrow">
                {pos + 1} / {queue.length}
              </p>
              <p ref={promptRef} tabIndex={-1} className="act-identify__find" aria-live="polite">
                {t(S.find)} <strong>{t(current.label)}</strong>
              </p>
              <HintBox text={current.hint} shown={hint.shown} canRequest={hint.canRequest} onToggle={hint.toggle} />
              {feedback?.kind === 'miss' && (
                <FeedbackPanel status="incorrect" locale={locale}>
                  <p>
                    {t(S.thatIs(labels[feedback.picked] ?? feedback.picked))}{' '}
                    {targetsById.get(feedback.picked) ? t(targetsById.get(feedback.picked)!.description) : ''}
                  </p>
                  <p>{feedback.highlighted ? t(S.highlighted) : t(S.lookAgain)}</p>
                </FeedbackPanel>
              )}
              {feedback?.kind === 'miss' && <SupportNudge misses={misses} guidance={guidance} onStepDown={onStepDown} />}
              {(feedback?.kind === 'found' || feedback?.kind === 'revealed') && (
                <FeedbackPanel
                  status={feedback.kind === 'found' ? 'correct' : 'info'}
                  locale={locale}
                  title={feedback.kind === 'revealed' ? t(S.revealed(t(feedback.target.label))) : undefined}
                  actions={
                    <Button iconEnd="next" onClick={advance} data-testid="identify-next">
                      {pos < queue.length - 1 ? t(S.nextPart) : t(S.continue)}
                    </Button>
                  }
                >
                  <p>
                    <strong>{t(feedback.target.label)}</strong> — {t(feedback.target.description)}
                  </p>
                </FeedbackPanel>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
