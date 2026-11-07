import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Locale } from '../../domain/contracts';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { announce } from './announcer';
import type { Politeness } from './announcer';
import { Button, IconButton } from './Button';
import { cx } from './util';
import './primitives.css';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  icon?: IconName;
  /** ms; 0 = stays until dismissed. Default 5000 (paused while hovered/focused). */
  duration?: number;
  action?: { label: string; onClick(): void };
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastApi {
  toast(opts: ToastOptions): number;
  dismiss(id: number): void;
}

const TONE_ICON: Record<ToastTone, IconName> = {
  neutral: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'warning',
  info: 'info',
  accent: 'sparkle',
};

const ToastContext = createContext<ToastApi | null>(null);

function isNarrowViewport(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 40rem)').matches;
  } catch {
    return false;
  }
}

/** Fallback when no provider is mounted: still announce, never throw. */
const fallbackApi: ToastApi = {
  toast(opts) {
    announce([opts.title, opts.description].filter(Boolean).join('. '));
    return -1;
  },
  dismiss() {},
};

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? fallbackApi;
}

/** Screen-reader announcements from React code. */
export function useAnnounce(): (message: string, politeness?: Politeness) => void {
  return announce;
}

export function ToastProvider({ children, locale = 'en' }: { children: ReactNode; locale?: Locale }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((t) => t.id !== id)), []);
  const toast = useCallback((opts: ToastOptions) => {
    const id = nextId.current++;
    setItems((xs) => [...xs.slice(-3), { ...opts, id }]);
    announce(
      [opts.title, opts.description].filter(Boolean).join('. '),
      opts.tone === 'danger' ? 'assertive' : 'polite',
    );
    return id;
  }, []);
  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section className="cl-toasts" aria-label={locale === 'zh' ? '通知' : 'Notifications'}>
        {items.map((t) => (
          <ToastView key={t.id} item={t} dismiss={dismiss} locale={locale} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

function ToastView({ item, dismiss, locale }: { item: ToastItem; dismiss(id: number): void; locale: Locale }) {
  const [paused, setPaused] = useState(false);
  const { id } = item;
  const onDismiss = useCallback(() => dismiss(id), [dismiss, id]);
  // Phones get a shorter default: the toast sits over content near the header.
  const duration = item.duration ?? (isNarrowViewport() ? 3500 : 5000);
  const tone = item.tone ?? 'neutral';

  useEffect(() => {
    if (!duration || paused) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, paused, onDismiss]);

  return (
    <div
      className={cx('cl-toast', `cl-toast--${tone}`)}
      data-tone={tone}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon name={item.icon ?? TONE_ICON[tone]} size={20} className="cl-toast__icon" />
      <div className="cl-toast__title">{item.title}</div>
      <IconButton
        icon="x"
        size="sm"
        label={locale === 'zh' ? '关闭通知' : 'Dismiss notification'}
        className="cl-toast__close"
        onClick={onDismiss}
      />
      {item.description && <div className="cl-toast__desc">{item.description}</div>}
      {item.action && (
        <Button
          size="sm"
          variant="ghost"
          className="cl-toast__action"
          onClick={() => {
            item.action?.onClick();
            onDismiss();
          }}
        >
          {item.action.label}
        </Button>
      )}
    </div>
  );
}
