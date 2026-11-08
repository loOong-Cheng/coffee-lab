import { Component, createRef, type ErrorInfo, type ReactNode } from 'react';
import type { Locale } from '../domain/contracts';
import { translate } from '../i18n/locale';
import { getLearnerState } from '../state';
import { isChunkLoadError, retryFailedRoutes } from './lazyRoute';
import { S } from './strings';

interface Props {
  children: ReactNode;
  /** When this value changes (e.g. the route), a caught error is cleared automatically. */
  resetKey?: unknown;
  /** 'page' keeps the shell usable around it; 'root' is the last line of defence. */
  scope?: 'page' | 'root';
}

interface State {
  error: Error | null;
  resetKey: unknown;
  /** "Try again" presses since the last navigation; after a few failed ones we suggest a reload. */
  retries: number;
}

/** After this many failed "Try again" presses the reload button becomes the recommended action. */
export const RETRIES_BEFORE_RELOAD_HINT = 2;

function currentLocale(): Locale {
  try {
    return getLearnerState().prefs.locale;
  } catch {
    return 'en';
  }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** Friendly recovery UI. Deliberately hook-free so it still renders if state/i18n is the thing that broke. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey, retries: 0 };
  private titleRef = createRef<HTMLHeadingElement>();

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) {
      // Navigating away (or back) re-arms screens whose download failed, so they load again (QA-01).
      if (state.error) retryFailedRoutes();
      return { resetKey: props.resetKey, error: null, retries: 0 };
    }
    return null;
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('[Coffee Lab] UI error caught by ErrorBoundary:', error, info.componentStack);
  }

  componentDidUpdate(_prev: Props, prevState: State): void {
    // A retry that failed again re-renders the same message: keep keyboard/screen-reader focus on it.
    if (this.state.error && prevState.error !== this.state.error && this.state.retries > 0) this.titleRef.current?.focus();
  }

  private reset = () => {
    retryFailedRoutes();
    this.setState((s) => ({ error: null, retries: s.retries + 1 }));
  };

  private goHome = () => {
    retryFailedRoutes();
    this.setState({ error: null, retries: 0 });
    window.location.hash = '#/';
  };

  render(): ReactNode {
    const { error, retries } = this.state;
    if (!error) return this.props.children;
    const l = currentLocale();
    const t = (x: (typeof S)[keyof typeof S]) => translate(x, l);
    const download = isChunkLoadError(error);
    const suggestReload = retries >= RETRIES_BEFORE_RELOAD_HINT;
    return (
      <section
        className={`shell-error shell-error--${this.props.scope ?? 'page'}`}
        role="alert"
        aria-labelledby="shell-error-title"
        data-testid="error-boundary"
        data-kind={download ? 'download' : 'crash'}
      >
        <h1 id="shell-error-title" ref={this.titleRef} tabIndex={-1}>
          {t(S.errorTitle)}
        </h1>
        <p>{t(download ? (isOffline() ? S.errorOffline : S.errorDownload) : S.errorBody)}</p>
        {suggestReload && <p data-testid="error-reload-hint">{t(S.errorReloadHint)}</p>}
        <div className="shell-error__actions">
          <button type="button" onClick={this.reset} data-variant={suggestReload ? 'secondary' : 'primary'}>
            {t(S.errorRetry)}
          </button>
          <button type="button" onClick={this.goHome}>
            {t(S.errorHome)}
          </button>
          <button type="button" onClick={() => window.location.reload()} data-variant={suggestReload ? 'primary' : undefined}>
            {t(S.errorReload)}
          </button>
        </div>
        <details>
          <summary>{t(S.errorDetails)}</summary>
          <pre>{error.message}</pre>
        </details>
      </section>
    );
  }
}
