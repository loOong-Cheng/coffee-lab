import type { Locale } from '../../domain/contracts';
import { Icon } from '../icons';
import { Button } from './Button';
import { cx } from './util';
import './primitives.css';

export interface KitchenActionBarProps {
  locale: Locale;
  onDone(): void;
  onBack?(): void;
  onRepeat?(): void;
  onHelp?(): void;
  /** e.g. "Done — water is in" / "Finish & log". */
  doneLabel?: string;
  backDisabled?: boolean;
  /** Show the honest self-report note (default true). */
  showSelfReportNote?: boolean;
  className?: string;
}

const T = {
  done: { zh: '完成这一步', en: 'Done' },
  back: { zh: '上一步', en: 'Back' },
  repeat: { zh: '再说一遍', en: 'Repeat' },
  help: { zh: '需要帮助', en: 'Help' },
  note: { zh: '由你确认完成——应用看不到你的操作（自我报告）', en: 'You confirm each step — the app can’t see your kitchen (self-reported)' },
} as const;

/**
 * Hands-busy controls for the real-world guide: Done is the largest target and sits lowest
 * (thumb zone on phones); Back / Repeat / Help are 64px tiles above it. Sticky to the
 * viewport bottom so wet hands never have to scroll.
 */
export function KitchenActionBar({
  locale,
  onDone,
  onBack,
  onRepeat,
  onHelp,
  doneLabel,
  backDisabled,
  showSelfReportNote = true,
  className,
}: KitchenActionBarProps) {
  return (
    <div className={cx('cl-kitchen-bar', className)} role="group" aria-label={locale === 'zh' ? '步骤操作' : 'Step controls'}>
      {showSelfReportNote && (
        <p className="cl-kitchen-bar__note">
          <Icon name="person-check" size={14} />
          {T.note[locale]}
        </p>
      )}
      <Button variant="secondary" size="kitchen" icon="back" onClick={onBack} disabled={!onBack || backDisabled}>
        {T.back[locale]}
      </Button>
      <Button variant="secondary" size="kitchen" icon="repeat" onClick={onRepeat} disabled={!onRepeat}>
        {T.repeat[locale]}
      </Button>
      <Button variant="secondary" size="kitchen" icon="help" onClick={onHelp} disabled={!onHelp}>
        {T.help[locale]}
      </Button>
      <Button variant="primary" size="kitchen" icon="check" className="cl-kitchen-bar__done" onClick={onDone}>
        {doneLabel ?? T.done[locale]}
      </Button>
    </div>
  );
}
