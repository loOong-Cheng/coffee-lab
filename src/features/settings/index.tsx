/**
 * /settings — language, sound & music, display, practice defaults, my setup, and local data
 * (export / validated import / reset). Everything stays on this device.
 */
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { audio, type MusicMood } from '../../audio';
import type { Locale, LocalizedText, Preferences } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { usePwaStatus } from '../../platform';
import { getLearnerState, learnerActions, useLearner, usePersistenceStatus } from '../../state';
import { announce, Button, Callout, Dialog, GuidanceSelector, SegmentedControl, Switch, Tag } from '../../ui';
import { equipmentName } from '../practice/catalog';
import { speechSupported } from '../practice/hooks';
import { applyImportedState, buildExport, exportFileName, parseImport, type ImportResult } from './dataTransfer';
import './settings.css';

const S = {
  title: { zh: '设置', en: 'Settings' },
  lead: { zh: '这些设置只保存在这台设备的浏览器里。', en: 'These settings are saved only in this browser, on this device.' },
  language: { zh: '语言', en: 'Language' },
  sound: { zh: '声音与音乐', en: 'Sound & music' },
  sfx: { zh: '音效', en: 'Sound effects' },
  sfxDesc: { zh: '点击、完成、计时结束时的轻提示音。', en: 'Gentle cues for taps, completions and timers.' },
  music: { zh: '背景音乐', en: 'Background music' },
  musicDesc: { zh: '应用实时生成的原创咖啡馆氛围音乐。', en: 'Original café ambience generated live by the app.' },
  mood: { zh: '音乐氛围', en: 'Music mood' },
  moods: { cafe: { zh: '咖啡馆', en: 'Café' }, focus: { zh: '专注', en: 'Focus' }, lab: { zh: '实验室', en: 'Lab' } } satisfies Record<MusicMood, LocalizedText>,
  volume: { zh: '音量', en: 'Volume' },
  test: { zh: '试听', en: 'Test sound' },
  noAudio: { zh: '这个浏览器不支持网页音频，应用会保持安静。', en: 'This browser doesn’t support web audio — the app will stay silent.' },
  display: { zh: '显示', en: 'Display' },
  theme: { zh: '主题', en: 'Theme' },
  system: { zh: '跟随系统', en: 'System' },
  light: { zh: '浅色', en: 'Light' },
  dark: { zh: '深色', en: 'Dark' },
  motion: { zh: '减少动画', en: 'Reduce motion' },
  on: { zh: '开', en: 'On' },
  off: { zh: '关', en: 'Off' },
  practice: { zh: '练习', en: 'Practice' },
  guidance: { zh: '默认引导程度', en: 'Default guidance' },
  speak: { zh: '厨房模式中朗读步骤', en: 'Read steps aloud in kitchen mode' },
  speakDesc: { zh: '使用浏览器的语音朗读，不会使用麦克风。', en: 'Uses your browser’s text-to-speech; never the microphone.' },
  speakNo: { zh: '这个浏览器不支持朗读，步骤会显示在屏幕上。', en: 'Not available in this browser; steps stay on screen.' },
  setup: { zh: '我的器具', en: 'My setup' },
  owned: { zh: '我有的器具', en: 'Gear I have' },
  wishlist: { zh: '心愿单', en: 'Wishlist' },
  noneYet: { zh: '还没有', en: 'None yet' },
  editSetup: { zh: '编辑我的设置', en: 'Edit my setup' },
  noProfile: { zh: '你还没有完成初始设置。', en: 'You haven’t set up your profile yet.' },
  startSetup: { zh: '开始设置', en: 'Set up now' },
  data: { zh: '你的数据', en: 'Your data' },
  offline: {
    ready: { zh: '离线可用：已就绪（课程、厨房模式、日志、图鉴）。', en: 'Offline: ready (lessons, kitchen mode, journal, atlas).' },
    pending: { zh: '离线可用：首次在线打开后自动准备。', en: 'Offline: prepares automatically after the first online visit.' },
    unsupported: {
      zh: '离线可用：此连接不支持（需要 https 或 localhost）。',
      en: 'Offline: not available on this connection (needs https or localhost).',
    },
  },
  stored: {
    zh: '保存的内容：你的设置和器具、偏好、学习记录（答题、模拟和自我报告的练习）、冲煮日志，以及进行中的指导。',
    en: 'What’s stored: your setup and gear, preferences, learning record (answers, simulations and self-reported practice), brew journal, and any guide in progress.',
  },
  local: {
    zh: '全部只存在这台设备的浏览器里：没有账号，不会上传到任何地方，也不会使用麦克风或摄像头。清除浏览器数据会删除它们——需要时先导出备份。',
    en: 'All of it lives only in this browser on this device: no account, nothing is uploaded anywhere, and no microphone or camera is used. Clearing browser data deletes it — export a backup first if you care.',
  },
  notSaving: { zh: '注意：这个浏览器现在无法保存数据（例如隐私模式），关闭页面后进度会丢失。', en: 'Heads up: this browser can’t save data right now (e.g. private mode) — progress will be lost when you close the page.' },
  export: { zh: '导出我的数据（JSON）', en: 'Export my data (JSON)' },
  exported: { zh: '已生成导出文件。', en: 'Export file created.' },
  import: { zh: '导入数据……', en: 'Import data…' },
  importLabel: { zh: '选择 Coffee Lab 导出的 JSON 文件', en: 'Choose a Coffee Lab export (JSON)' },
  importErr: {
    'not-json': { zh: '这个文件不是有效的 JSON。', en: 'That file isn’t valid JSON.' },
    'not-coffee-lab': { zh: '这个文件看起来不是 Coffee Lab 的导出数据。', en: 'That file doesn’t look like a Coffee Lab export.' },
    'too-large': { zh: '文件太大了（上限 5 MB）。', en: 'That file is too large (5 MB max).' },
    read: { zh: '读取文件失败。', en: 'Couldn’t read that file.' },
  },
  importTitle: { zh: '用导入的数据替换当前数据？', en: 'Replace your current data with this import?' },
  importSummary: (p: boolean, j: number, e: number) => ({
    zh: `导入内容：${p ? '有' : '没有'}个人设置 · ${j} 杯冲煮记录 · ${e} 条学习记录。`,
    en: `The file contains: ${p ? 'a' : 'no'} profile · ${j} brew log entr${j === 1 ? 'y' : 'ies'} · ${e} learning record${e === 1 ? '' : 's'}.`,
  }),
  importLossy: { zh: '有些条目无法读取，将被跳过。', en: 'Some entries couldn’t be read and will be skipped.' },
  importBackup: { zh: '当前数据会先在这个浏览器里备份一份。', en: 'Your current data is backed up once in this browser first.' },
  importGo: { zh: '导入并替换', en: 'Import and replace' },
  imported: { zh: '导入完成。', en: 'Import complete.' },
  importFail: { zh: '无法保存导入的数据（浏览器存储不可用）。', en: 'Couldn’t save the import (browser storage unavailable).' },
  reset: { zh: '重置全部进度', en: 'Reset all progress' },
  resetTitle: { zh: '确定重置全部进度？', en: 'Reset all progress?' },
  resetBody: {
    zh: '这会删除这台设备上的个人设置、学习进度、冲煮日志和进行中的指导。界面语言会保留。浏览器里会留一份备份，仅供手动恢复。',
    en: 'This deletes your profile, progress, brew journal and any guide in progress on this device. Your language stays. One backup copy is kept in this browser for manual recovery only.',
  },
  resetGo: { zh: '全部重置', en: 'Reset everything' },
  resetDone: { zh: '已全部重置。', en: 'Everything was reset.' },
  setupAgain: { zh: '重新设置', en: 'Set up again' },
  cancel: { zh: '取消', en: 'Cancel' },
};

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  useDocumentTitle(S.title);
  const prefs = useLearner((s) => s.prefs);
  const profile = useLearner((s) => s.profile);
  const persistence = usePersistenceStatus();
  const pwa = usePwaStatus();
  const [volume, setVolume] = useState(Math.round(prefs.volume * 100));
  const [importState, setImportState] = useState<Extract<ImportResult, { ok: true }> | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string; setup?: boolean } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canSpeak = speechSupported();

  useEffect(() => setVolume(Math.round(prefs.volume * 100)), [prefs.volume]);

  const pref = <K extends keyof Preferences>(k: K, v: Preferences[K]) => {
    learnerActions.updatePrefs({ [k]: v } as Partial<Preferences>);
    audio.play('select');
  };

  const say = (tone: 'success' | 'error', text: string, setup?: boolean) => {
    setMessage({ tone, text, setup });
    announce(text, tone === 'error' ? 'assertive' : 'polite');
  };

  const doExport = () => {
    try {
      const blob = new Blob([JSON.stringify(buildExport(getLearnerState()), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say('success', t(S.exported));
    } catch {
      say('error', t(S.importErr.read));
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      say('error', t(S.importErr.read));
      return;
    }
    const r = parseImport(text);
    if (!r.ok) say('error', t(S.importErr[r.error]));
    else {
      setMessage(null);
      setImportState(r);
    }
  };

  const confirmImport = () => {
    if (!importState) return;
    const ok = applyImportedState(importState.state, getLearnerState());
    setImportState(null);
    if (ok) {
      audio.play('complete');
      say('success', t(S.imported));
    } else say('error', t(S.importFail));
  };

  const doReset = () => {
    learnerActions.resetAll();
    setResetOpen(false);
    audio.play('reset');
    say('success', t(S.resetDone), true);
  };

  const opt = <V extends string>(value: V, label: LocalizedText) => ({ value, label: t(label) });

  return (
    <section className="st-page" aria-labelledby="page-title">
      <header className="st-head">
        <h1 id="page-title" className="st-title">
          {t(S.title)}
        </h1>
        <p className="st-lead">{t(S.lead)}</p>
      </header>

      {message && (
        <div className={`st-message st-message--${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'} data-testid="settings-message">
          <p>{message.text}</p>
          {message.setup && (
            <Link className="cl-btn cl-btn--primary cl-btn--md" to="/onboarding">
              {t(S.setupAgain)}
            </Link>
          )}
        </div>
      )}

      <section className="st-section" aria-labelledby="st-lang">
        <h2 id="st-lang">{t(S.language)}</h2>
        <SegmentedControl<Locale>
          label={t(S.language)}
          value={locale}
          onChange={(l) => setLocale(l)}
          options={[
            { value: 'zh', label: <span lang="zh-CN">中文</span> },
            { value: 'en', label: <span lang="en">English</span> },
          ]}
          size="lg"
        />
      </section>

      <section className="st-section" aria-labelledby="st-sound">
        <h2 id="st-sound">{t(S.sound)}</h2>
        {!audio.available && <Callout kind="info" locale={locale}>{t(S.noAudio)}</Callout>}
        <Switch checked={prefs.sfx} onChange={(v) => pref('sfx', v)} label={t(S.sfx)} description={t(S.sfxDesc)} data-testid="settings-sfx" />
        <Switch checked={prefs.music} onChange={(v) => pref('music', v)} label={t(S.music)} description={t(S.musicDesc)} data-testid="settings-music" />
        <div className="st-field">
          <span className="st-label" id="st-mood-l">
            {t(S.mood)}
          </span>
          <SegmentedControl<MusicMood>
            labelledBy="st-mood-l"
            value={prefs.musicMood}
            onChange={(m) => pref('musicMood', m)}
            options={[opt('cafe', S.moods.cafe), opt('focus', S.moods.focus), opt('lab', S.moods.lab)]}
          />
        </div>
        <div className="st-field">
          <label className="st-label" htmlFor="st-volume">
            {t(S.volume)} <output htmlFor="st-volume" className="cl-num">{volume}%</output>
          </label>
          <div className="st-volume">
            <input
              id="st-volume"
              type="range"
              min={0}
              max={100}
              step={5}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              onPointerUp={() => learnerActions.updatePrefs({ volume: volume / 100 })}
              onKeyUp={() => learnerActions.updatePrefs({ volume: volume / 100 })}
              onBlur={() => learnerActions.updatePrefs({ volume: volume / 100 })}
              aria-valuetext={`${volume}%`}
              data-testid="settings-volume"
            />
            <Button
              variant="secondary"
              size="md"
              icon="sound-on"
              onClick={() => {
                learnerActions.updatePrefs({ volume: volume / 100 });
                audio.setVolume(volume / 100);
                audio.play('complete');
              }}
            >
              {t(S.test)}
            </Button>
          </div>
        </div>
      </section>

      <section className="st-section" aria-labelledby="st-display">
        <h2 id="st-display">{t(S.display)}</h2>
        <div className="st-field">
          <span className="st-label" id="st-theme-l">
            {t(S.theme)}
          </span>
          <SegmentedControl<Preferences['theme']>
            labelledBy="st-theme-l"
            value={prefs.theme}
            onChange={(v) => pref('theme', v)}
            options={[opt('system', S.system), opt('light', S.light), opt('dark', S.dark)]}
            id="st-theme"
          />
        </div>
        <div className="st-field">
          <span className="st-label" id="st-motion-l">
            {t(S.motion)}
          </span>
          <SegmentedControl<Preferences['reducedMotion']>
            labelledBy="st-motion-l"
            value={prefs.reducedMotion}
            onChange={(v) => pref('reducedMotion', v)}
            options={[opt('system', S.system), opt('on', S.on), opt('off', S.off)]}
          />
        </div>
      </section>

      <section className="st-section" aria-labelledby="st-practice">
        <h2 id="st-practice">{t(S.practice)}</h2>
        <div className="st-field">
          <span className="st-label">{t(S.guidance)}</span>
          <GuidanceSelector value={prefs.defaultGuidance} onChange={(g) => pref('defaultGuidance', g)} locale={locale} variant="full" label={t(S.guidance)} />
        </div>
        <Switch
          checked={prefs.speakSteps && canSpeak}
          disabled={!canSpeak}
          onChange={(v) => pref('speakSteps', v)}
          label={t(S.speak)}
          description={canSpeak ? t(S.speakDesc) : t(S.speakNo)}
        />
      </section>

      <section className="st-section" aria-labelledby="st-setup">
        <h2 id="st-setup">{t(S.setup)}</h2>
        {profile ? (
          <>
            <div className="st-field">
              <span className="st-label">{t(S.owned)}</span>
              <div className="st-tags">
                {profile.equipment.length ? profile.equipment.map((id) => <Tag key={id}>{t(equipmentName(id))}</Tag>) : <span className="cl-muted">{t(S.noneYet)}</span>}
              </div>
            </div>
            <div className="st-field">
              <span className="st-label">{t(S.wishlist)}</span>
              <div className="st-tags">
                {profile.wishlist.length ? (
                  profile.wishlist.map((id) => (
                    <Tag key={id} tone="accent" icon="star">
                      {t(equipmentName(id))}
                    </Tag>
                  ))
                ) : (
                  <span className="cl-muted">{t(S.noneYet)}</span>
                )}
              </div>
            </div>
            <Link className="cl-btn cl-btn--secondary cl-btn--md st-self-start" to="/onboarding?edit=1" data-testid="edit-setup">
              {t(S.editSetup)}
            </Link>
          </>
        ) : (
          <p>
            {t(S.noProfile)}{' '}
            <Link to="/onboarding">{t(S.startSetup)}</Link>
          </p>
        )}
      </section>

      <section className="st-section" aria-labelledby="st-data">
        <h2 id="st-data">{t(S.data)}</h2>
        <p>{t(S.stored)}</p>
        <p data-testid="settings-offline-status">
          {t(!pwa.supported ? S.offline.unsupported : pwa.offlineReady ? S.offline.ready : S.offline.pending)}
        </p>
        <Callout kind="info" locale={locale}>
          {t(S.local)}
        </Callout>
        {(persistence === 'unavailable' || persistence === 'write-failed') && (
          <Callout kind="safety" locale={locale}>
            {t(S.notSaving)}
          </Callout>
        )}
        <div className="st-actions">
          <Button variant="secondary" icon="journal" onClick={doExport} data-testid="export-data">
            {t(S.export)}
          </Button>
          <Button variant="secondary" icon="plus" onClick={() => fileRef.current?.click()} data-testid="import-data">
            {t(S.import)}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="cl-visually-hidden"
            tabIndex={-1}
            aria-label={t(S.importLabel)}
            onChange={onFile}
            data-testid="import-file"
          />
          <Button variant="danger" icon="warning" onClick={() => setResetOpen(true)} data-testid="reset-all">
            {t(S.reset)}
          </Button>
        </div>
      </section>

      <Dialog
        open={!!importState}
        onClose={() => setImportState(null)}
        title={t(S.importTitle)}
        role="alertdialog"
        locale={locale}
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportState(null)}>
              {t(S.cancel)}
            </Button>
            <Button variant="danger" onClick={confirmImport} data-testid="confirm-import">
              {t(S.importGo)}
            </Button>
          </>
        }
      >
        {importState && (
          <>
            <p>{t(S.importSummary(importState.summary.hasProfile, importState.summary.journal, importState.summary.events))}</p>
            {importState.lossy && <p>{t(S.importLossy)}</p>}
            <p className="cl-muted">{t(S.importBackup)}</p>
          </>
        )}
      </Dialog>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t(S.resetTitle)}
        description={t(S.resetBody)}
        role="alertdialog"
        size="sm"
        locale={locale}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              {t(S.cancel)}
            </Button>
            <Button variant="danger" onClick={doReset} data-testid="confirm-reset">
              {t(S.resetGo)}
            </Button>
          </>
        }
      />
    </section>
  );
}
