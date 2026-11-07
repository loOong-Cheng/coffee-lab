import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Locale } from '../domain/contracts';
import { translate } from '../i18n/locale';
import { getLearnerState } from '../state';
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
}

function currentLocale(): Locale {
  try {
    return getLearnerState().prefs.locale;
  } catch {
    return 'en';
  }
}

/** Friendly recovery UI. Deliberately hook-free so it still renders if state/i18n is the thing that broke. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { resetKey: props.resetKey, error: null };
    return null;
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('[Coffee Lab] UI error caught by ErrorBoundary:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  private goHome = () => {
    this.setState({ error: null });
    window.location.hash = '#/';
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    const l = currentLocale();
    const t = (x: (typeof S)[keyof typeof S]) => translate(x, l);
    return (
      <section className={`shell-error shell-error--${this.props.scope ?? 'page'}`} role="alert" aria-labelledby="shell-error-title">
        <h1 id="shell-error-title">{t(S.errorTitle)}</h1>
        <p>{t(S.errorBody)}</p>
        <div className="shell-error__actions">
          <button type="button" onClick={this.reset}>
            {t(S.errorRetry)}
          </button>
          <button type="button" onClick={this.goHome}>
            {t(S.errorHome)}
          </button>
          <button type="button" onClick={() => window.location.reload()}>
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
