/**
 * MusicControl — compact "now playing" control for the header / drawer, or an inline panel.
 * Controlled component: it never reads the store. The shell passes prefs in and writes changes
 * back via callbacks; it only calls `audio.unlock()` itself (needs the user gesture).
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { Locale } from '../domain/contracts';
import { audio, CORE_MUSIC_MOODS, MUSIC_MOODS } from '../audio';
import type { MusicMoodId } from '../audio';
import { Icon } from './icons';
import { SegmentedControl } from './primitives/SegmentedControl';
import { Switch } from './primitives/Switch';
import { Tag } from './primitives/Tag';
import { cx } from './primitives/util';
import './music-control.css';

const T = {
  music: { zh: '背景音乐', en: 'Background music' },
  settings: { zh: '音乐设置', en: 'Music settings' },
  moodPrefix: { zh: '音乐风格：', en: 'Music mood: ' },
  heading: { zh: '音乐与声音', en: 'Music & sound' },
  play: { zh: '播放背景音乐', en: 'Play background music' },
  playHint: { zh: '默认关闭；只在你打开后播放。', en: 'Off by default; plays only when you turn it on.' },
  mood: { zh: '风格', en: 'Mood' },
  volume: { zh: '音量', en: 'Volume' },
  sfx: { zh: '操作音效', en: 'Sound effects' },
  sfxHint: { zh: '点击、答题与咖啡操作的轻柔声音。', en: 'Soft sounds for taps, answers and coffee actions.' },
  culture: { zh: '文化', en: 'Culture' },
  offNote: { zh: '音乐已关闭——打开上面的开关即可试听。', en: 'Music is off — turn it on above to listen.' },
  original: { zh: '全部为实时生成的原创音乐，不含任何录音。', en: 'All music is original and generated live — no recordings.' },
} as const;

export interface MusicControlProps<M extends MusicMoodId = MusicMoodId> {
  locale: Locale;
  /** prefs.music */
  playing: boolean;
  onPlayingChange(on: boolean): void;
  mood: M;
  onMoodChange(mood: M): void;
  /**
   * Moods to offer. Defaults to the three persisted moods (cafe/focus/lab).
   * Pass MUSIC_MOOD_IDS once Preferences.musicMood accepts the culture moods.
   */
  moods?: readonly M[];
  /** 0..1 (prefs.volume — master volume for music and SFX). */
  volume: number;
  onVolumeChange(v: number): void;
  /** Optional SFX switch inside the panel. */
  sfx?: boolean;
  onSfxChange?(on: boolean): void;
  /** compact = header buttons + popover; panel = inline controls (drawer, settings). */
  variant?: 'compact' | 'panel';
  className?: string;
}

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span className={cx('cl-eq', playing && 'is-playing')} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function unlock(): void {
  try {
    void audio.unlock();
  } catch {
    /* audio is optional */
  }
}

export function MusicControl<M extends MusicMoodId = MusicMoodId>(props: MusicControlProps<M>) {
  const { locale, playing, onPlayingChange, mood, variant = 'compact', className } = props;
  const moods = (props.moods ?? (CORE_MUSIC_MOODS as readonly MusicMoodId[])) as readonly M[];
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const info = MUSIC_MOODS[mood] ?? MUSIC_MOODS.cafe;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    unlock();
    onPlayingChange(!playing);
  };

  if (variant === 'panel') {
    return <MusicPanel {...props} moods={moods} className={cx('cl-music-panel--inline', className)} />;
  }

  return (
    <div ref={wrapRef} className={cx('cl-music', className)}>
      <button
        type="button"
        className={cx('cl-music__play', playing && 'is-on')}
        aria-pressed={playing}
        aria-label={T.music[locale]}
        title={T.music[locale]}
        onClick={toggle}
      >
        {playing ? <Equalizer playing /> : <Icon name="music" size={20} />}
      </button>
      <button
        ref={triggerRef}
        type="button"
        className="cl-music__mood"
        aria-expanded={open}
        aria-controls={panelId}
        title={T.settings[locale]}
        onClick={() => {
          unlock();
          setOpen((o) => !o);
        }}
      >
        <span className="cl-visually-hidden">{T.moodPrefix[locale]}</span>
        {' '}
        <span className="cl-music__mood-label">{info.label[locale]}</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>
      {open && (
        <div className="cl-music__popover">
          <MusicPanel {...props} moods={moods} id={panelId} className={undefined} />
        </div>
      )}
    </div>
  );
}

function MusicPanel<M extends MusicMoodId>({
  locale,
  playing,
  onPlayingChange,
  mood,
  onMoodChange,
  moods,
  volume,
  onVolumeChange,
  sfx,
  onSfxChange,
  className,
  id,
}: MusicControlProps<M> & { moods: readonly M[]; id?: string }) {
  const headingId = useId();
  const volumeId = useId();
  const pct = Math.round(Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0)) * 100);
  return (
    <div id={id} className={cx('cl-music-panel', className)} role="group" aria-labelledby={headingId}>
      <p id={headingId} className="cl-music-panel__heading">
        <Icon name="music" size={18} />
        {T.heading[locale]}
      </p>
      <Switch
        checked={playing}
        onChange={(on) => {
          unlock();
          onPlayingChange(on);
        }}
        label={T.play[locale]}
        description={T.playHint[locale]}
      />
      <div className="cl-music-panel__field">
        <span className="cl-music-panel__label" id={`${headingId}-mood`}>
          {T.mood[locale]}
        </span>
        <SegmentedControl<M>
          labelledBy={`${headingId}-mood`}
          layout="stacked"
          value={mood}
          onChange={(m) => {
            unlock();
            onMoodChange(m);
          }}
          options={moods.map((m) => {
            const info = MUSIC_MOODS[m];
            return {
              value: m,
              label: info.label[locale],
              icon: info.culture ? <Icon name="globe" size={16} /> : <Icon name="music" size={16} />,
              description: (
                <>
                  {info.description[locale]}
                  {info.culture && info.inspiration && (
                    <span className="cl-music-panel__inspiration">
                      <Tag tone="culture" icon="globe">
                        {T.culture[locale]}
                      </Tag>{' '}
                      {info.inspiration[locale]}
                    </span>
                  )}
                </>
              ),
            };
          })}
        />
        {!playing && <p className="cl-music-panel__note">{T.offNote[locale]}</p>}
      </div>
      <div className="cl-music-panel__field">
        <label className="cl-music-panel__label" htmlFor={volumeId}>
          {T.volume[locale]}
          <output className="cl-num" htmlFor={volumeId}>
            {pct}%
          </output>
        </label>
        <div className="cl-music-panel__volume">
          <Icon name="sound-off" size={18} />
          <input
            id={volumeId}
            type="range"
            min={0}
            max={100}
            step={5}
            value={pct}
            aria-valuetext={`${pct}%`}
            onChange={(e) => {
              unlock();
              onVolumeChange(Number(e.currentTarget.value) / 100);
            }}
          />
          <Icon name="sound-on" size={18} />
        </div>
      </div>
      {onSfxChange && (
        <Switch checked={Boolean(sfx)} onChange={onSfxChange} label={T.sfx[locale]} description={T.sfxHint[locale]} />
      )}
      <p className="cl-music-panel__footnote">{T.original[locale]}</p>
    </div>
  );
}
