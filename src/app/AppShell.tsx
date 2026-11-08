import { useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { audio, MUSIC_MOOD_IDS } from '../audio';
import type { LocalizedText } from '../domain/contracts';
import { otherLocale, useI18n } from '../i18n';
import { learnerActions, useLearner, usePersistenceStatus } from '../state';
import { MusicControl } from '../ui/MusicControl';
import { ToastProvider } from '../ui/primitives/Toast';
import { ErrorBoundary } from './ErrorBoundary';
import { S } from './strings';
import { useAudioSync, useDocumentSync, useRouteEffects } from './useShellEffects';
import './shell.css';

const MAIN_ID = 'main';

interface NavItem {
  to: string;
  label: LocalizedText;
  icon: ReactNode;
  isActive(pathname: string): boolean;
}

// Tiny inline icons (currentColor) — the experience-designer's icon set can replace these.
const svg = (d: string) => (
  <svg className="shell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICONS = {
  learn: svg('M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z'),
  practice: svg('M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M11 3.5v2.5M14 3.5v2.5'),
  atlas: svg('M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14'),
  cafe: svg('M4 10h16M5 10l1-5h12l1 5M6 10v10h12V10M10 20v-5h4v5'),
  xr: svg('M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4l-1.5-2.5a1.7 1.7 0 0 0-3 0L9 17H5a2 2 0 0 1-2-2z'),
  settings: svg('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2.2.2-1.3-1.6.4-2.2-3-1-1 2h-1.8l-1-2-3 1 .4 2.2L6.2 8.2 4 8l-1 3 2 1v1.8l-2 1 1 3 2.2-.2 1.3 1.6-.4 2.2 3 1 1-2h1.8l1 2 3-1-.4-2.2 1.3-1.6 2.2.2 1-3-2-1z'),
  soundOn: svg('M4 10h3l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11'),
  soundOff: svg('M4 10h3l5-4v12l-5-4H4zM16 10l4 4M20 10l-4 4'),
};

const NAV: NavItem[] = [
  { to: '/', label: S.navLearn, icon: ICONS.learn, isActive: (p) => p === '/' || p.startsWith('/learn/') },
  {
    to: '/journal',
    label: S.navPractice,
    icon: ICONS.practice,
    isActive: (p) => p === '/journal' || p.startsWith('/practice/'),
  },
  { to: '/atlas', label: S.navAtlas, icon: ICONS.atlas, isActive: (p) => p === '/atlas' || p.startsWith('/atlas/') },
  { to: '/cafe', label: { zh: '咖啡馆', en: 'Café' }, icon: ICONS.cafe, isActive: (p) => p === '/cafe' },
  { to: '/xr', label: S.navXr, icon: ICONS.xr, isActive: (p) => p === '/xr' },
  { to: '/settings', label: S.navSettings, icon: ICONS.settings, isActive: (p) => p === '/settings' },
];

function PersistenceNotice() {
  const { t } = useI18n();
  const status = usePersistenceStatus();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const message =
    status === 'unavailable' || status === 'write-failed' ? S.storageUnavailable : status === 'recovered' ? S.storageRecovered : null;
  if (!message || dismissed === status) return null;
  return (
    <div className="shell-notice" role="status">
      <p>{t(message)}</p>
      <button type="button" onClick={() => setDismissed(status)}>
        {t(S.dismiss)}
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const { pathname } = useLocation();
  const sfx = useLearner((s) => s.prefs.sfx);
  const music = useLearner((s) => s.prefs.music);
  const musicMood = useLearner((s) => s.prefs.musicMood);
  const volume = useLearner((s) => s.prefs.volume);
  useDocumentSync();
  useAudioSync();
  useRouteEffects(MAIN_ID);

  // Hash routing owns location.hash, so the skip link must move focus programmatically.
  const skipToMain = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById(MAIN_ID);
    main?.focus();
    main?.scrollIntoView?.();
  };

  const setSfx = (next: boolean) => {
    learnerActions.updatePrefs({ sfx: next });
    if (next) {
      try {
        audio.setSfxEnabled(true);
        audio.play('tap');
      } catch {
        /* audio is optional */
      }
    }
  };

  const nextLocale = otherLocale(locale);

  return (
    <ToastProvider locale={locale}>
      <div className="shell">
        <a className="shell-skip" href={`#${MAIN_ID}`} onClick={skipToMain}>
          {t(S.skip)}
        </a>
        <header className="shell-header">
          <Link to="/" className="shell-brand" aria-label={t(S.brand)}>
            <svg className="shell-brand__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <path d="M5 11h18v7a9 9 0 0 1-18 0z" fill="currentColor" />
              <path d="M23 13h2a4 4 0 0 1 0 8h-2.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M10 4c0 2 2 2 2 4M15 4c0 2 2 2 2 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="shell-brand__full">{t(S.brand)}</span>
            <span className="shell-brand__short" aria-hidden="true">
              {t(S.brandShort)}
            </span>
          </Link>
          <div className="shell-tools">
            <button
              type="button"
              className="shell-tool"
              data-testid="locale-toggle"
              onClick={() => setLocale(nextLocale)}
            >
              {/* WCAG 2.5.3: the visible "中文"/"EN" starts the accessible name ("中文 — Switch to Chinese"). */}
              <span lang={nextLocale === 'zh' ? 'zh-CN' : 'en'}>{nextLocale === 'zh' ? '中文' : 'EN'}</span>
              {' '}
              <span className="shell-sr-only">— {t(S.switchLang)}</span>
            </button>
            <button
              type="button"
              className="shell-tool"
              aria-pressed={sfx}
              onClick={() => setSfx(!sfx)}
              title={t(S.sfx)}
              data-testid="sfx-toggle"
            >
              {sfx ? ICONS.soundOn : ICONS.soundOff}
              <span className="shell-sr-only">{t(S.sfx)}</span>
            </button>
            {/* Music on/off + mood + master volume (+ SFX inside the popover). Off by default; never autoplays. */}
            <MusicControl
              className="shell-music"
              locale={locale}
              playing={music}
              onPlayingChange={(on) => learnerActions.updatePrefs({ music: on })}
              mood={musicMood}
              onMoodChange={(m) => learnerActions.updatePrefs({ musicMood: m })}
              moods={MUSIC_MOOD_IDS}
              volume={volume}
              onVolumeChange={(v) => learnerActions.updatePrefs({ volume: v })}
              sfx={sfx}
              onSfxChange={setSfx}
            />
          </div>
        </header>

        <nav className="shell-nav" aria-label={t(S.primaryNav)}>
          <ul>
            {NAV.map((item) => {
              const active = item.isActive(pathname);
              return (
                <li key={item.to}>
                  <Link to={item.to} className="shell-nav__link" aria-current={active ? 'page' : undefined}>
                    {item.icon}
                    <span className="shell-nav__label">{t(item.label)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <PersistenceNotice />

        <main id={MAIN_ID} className="shell-main" tabIndex={-1}>
          <ErrorBoundary resetKey={pathname} scope="page">
            {children}
          </ErrorBoundary>
        </main>

        <footer className="shell-footer">
          <p>{t(S.footer)}</p>
          <Link to="/onboarding?edit=1">{t(S.editSetup)}</Link>
        </footer>
      </div>
    </ToastProvider>
  );
}
