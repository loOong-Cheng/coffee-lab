/** Small pieces shared by several activity views. */
import { useEffect, useRef, useState } from 'react';
import { audio, type SfxName } from '../../audio';
import type { Guidance, LocalizedText } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { FeedbackPanel } from '../../ui/primitives/FeedbackPanel';
import { announce } from '../../ui/primitives/announcer';
import { guidancePolicy } from './logic/guidance';
import { S } from './strings';

/** SFX must never break an activity. */
export function sfx(name: SfxName): void {
  try {
    audio.play(name);
  } catch {
    /* optional */
  }
}

/**
 * Hint visibility driven by the guidance tier:
 *  guided → shown up front; assisted → on request (button or H); independent → none.
 */
export function useHint(guidance: Guidance, hintSignal: number | undefined) {
  const policy = guidancePolicy(guidance);
  const [shown, setShown] = useState(policy.hintVisible);
  const { t } = useI18n();
  const first = useRef(hintSignal);
  useEffect(() => {
    if (hintSignal === undefined || hintSignal === first.current) return;
    if (policy.hintOnRequest) setShown((s) => !s);
    else announce(t(S.hintsOff));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintSignal]);
  return {
    shown: shown && (policy.hintOnRequest || policy.hintVisible),
    canRequest: policy.hintOnRequest,
    toggle: () => setShown((s) => !s),
    reset: () => setShown(policy.hintVisible),
  };
}

/** Hint toggle + panel. Renders nothing in independent mode. */
export function HintBox({
  text,
  shown,
  canRequest,
  onToggle,
}: {
  text: LocalizedText | undefined;
  shown: boolean;
  canRequest: boolean;
  onToggle(): void;
}) {
  const { t, locale } = useI18n();
  if (!text || !canRequest) return null;
  return (
    <div className="act-hint">
      <Button variant="ghost" size="sm" icon="lightbulb" aria-expanded={shown} onClick={onToggle}>
        {shown ? t(S.hideHint) : t(S.showHint)}
        <span className="act-kbd-hint" aria-hidden="true">
          {' '}
          (H)
        </span>
      </Button>
      {shown && (
        <FeedbackPanel status="hint" locale={locale} announceOnShow={false}>
          {t(text)}
        </FeedbackPanel>
      )}
    </div>
  );
}

/** UX spec §3: after 2 misses in a row, SUGGEST more support (never force it). */
export function SupportNudge({ misses, guidance, onStepDown }: { misses: number; guidance: Guidance; onStepDown?: () => void }) {
  const { t } = useI18n();
  if (!onStepDown || guidance === 'guided' || misses < 2) return null;
  return (
    <p className="act-nudge">
      <span>{t(S.moreSupport)}</span>
      <Button variant="secondary" size="sm" icon="lightbulb" onClick={onStepDown} data-testid="support-nudge">
        {t(guidance === 'independent' ? S.toAssisted : S.toGuided)}
      </Button>
    </p>
  );
}

/** Final "Continue" row used when an activity is finished (or abandoned honestly). */
export function FinishRow({
  done,
  onContinue,
  onRetry,
  retryLabel,
}: {
  done: boolean;
  onContinue(): void;
  onRetry?(): void;
  retryLabel?: LocalizedText;
}) {
  const { t } = useI18n();
  return (
    <div className="act-finish">
      {onRetry && (
        <Button variant="secondary" icon="repeat" onClick={onRetry}>
          {t(retryLabel ?? S.tryAgain)}
        </Button>
      )}
      <Button variant={done ? 'primary' : 'ghost'} iconEnd="next" onClick={onContinue} data-testid="activity-continue">
        {done ? t(S.continue) : t(S.continueAnyway)}
      </Button>
    </div>
  );
}
