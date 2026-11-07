import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Locale } from '../../domain/contracts';
import { IconButton } from './Button';
import { cx, getFocusable } from './util';
import './primitives.css';

export interface DialogProps {
  open: boolean;
  onClose(): void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** dialog = centred modal (desktop); sheet = bottom sheet (mobile help, step details). */
  variant?: 'dialog' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
  /** Element to focus on open; defaults to the first focusable control in the body, then the close button. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Esc / backdrop / close button allowed (default true). For a confirm step that must be answered, set false and provide footer buttons. */
  dismissible?: boolean;
  /** alertdialog for destructive confirmations. */
  role?: 'dialog' | 'alertdialog';
  locale?: Locale;
  className?: string;
}

let openCount = 0;

/**
 * Accessible modal: portal to body, aria-modal, labelled by its title, focus moves in on open,
 * Tab/Shift+Tab are trapped, Esc closes, focus returns to the opener on close, body scroll locked.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'dialog',
  size = 'md',
  initialFocusRef,
  dismissible = true,
  role = 'dialog',
  locale = 'en',
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    openCount += 1;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const target =
      initialFocusRef?.current ??
      (bodyRef.current ? getFocusable(bodyRef.current)[0] : undefined) ??
      closeRef.current ??
      panel;
    target?.focus();

    return () => {
      openCount = Math.max(0, openCount - 1);
      if (openCount === 0) document.body.style.overflow = prevOverflow;
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
    };
    // Only on open/close transitions (initialFocusRef is read once, on open).
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (dismissible) {
        e.stopPropagation();
        onCloseRef.current();
      }
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = getFocusable(panelRef.current);
    if (items.length === 0) {
      e.preventDefault();
      panelRef.current.focus();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const closeLabel = locale === 'zh' ? '关闭' : 'Close';

  return createPortal(
    <div
      className={cx('cl-overlay', variant === 'sheet' && 'cl-overlay--sheet')}
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx('cl-dialog', `cl-dialog--${variant === 'sheet' ? 'sheet' : size}`, className)}
        onKeyDown={onKeyDown}
      >
        {variant === 'sheet' && <div className="cl-dialog__grip" aria-hidden="true" />}
        <div className="cl-dialog__header">
          <div className="cl-dialog__titles">
            <h2 id={titleId} className="cl-dialog__title">
              {title}
            </h2>
            {description && (
              <p id={descId} className="cl-dialog__desc">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <IconButton
              ref={closeRef}
              icon="x"
              label={closeLabel}
              className="cl-dialog__close"
              onClick={() => onCloseRef.current()}
            />
          )}
        </div>
        {children != null && (
          <div ref={bodyRef} className="cl-dialog__body">
            {children}
          </div>
        )}
        {footer && <div className="cl-dialog__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Convenience alias: <Sheet> is a Dialog with variant="sheet". */
export function Sheet(props: Omit<DialogProps, 'variant'>) {
  return <Dialog {...props} variant="sheet" />;
}
