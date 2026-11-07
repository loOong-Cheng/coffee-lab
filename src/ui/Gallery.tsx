/**
 * DEV-ONLY UI gallery: every token, primitive, icon, diagram, illustration and sound in one page.
 * Not linked from the product. The lead decides whether/where to route it (e.g. `/dev/ui`).
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Guidance, Locale } from '../domain/contracts';
import { audio, SFX_NAMES } from '../audio';
import type { MusicMood } from '../audio';
import {
  Button,
  Callout,
  Card,
  Chip,
  Dialog,
  EmptyState,
  EspressoStationDiagram,
  EvidenceBadge,
  FeedbackPanel,
  GuidanceBadge,
  GuidanceSelector,
  ICON_NAMES,
  Icon,
  IconButton,
  ILLUSTRATION_KEYS,
  Illustration,
  Kbd,
  KitchenActionBar,
  PourOverStationDiagram,
  ProgressBar,
  ProgressRing,
  SegmentedControl,
  Sheet,
  Spinner,
  StepProgress,
  Switch,
  Tag,
  ToastProvider,
  useToast,
} from './index';

const SWATCHES = [
  'bg',
  'surface',
  'surface-2',
  'text',
  'text-muted',
  'border',
  'border-strong',
  'accent',
  'accent-soft',
  'crema',
  'success',
  'warning',
  'danger',
  'info',
  'culture',
  'focus',
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 'var(--space-4)', paddingBlock: 'var(--space-5)', borderTop: '1px solid var(--color-border)' }}>
      <h2 style={{ fontSize: 'var(--text-xl)' }}>{title}</h2>
      {children}
    </section>
  );
}

function ToastDemo({ locale }: { locale: Locale }) {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      icon="sparkle"
      onClick={() =>
        toast({
          tone: 'success',
          title: locale === 'zh' ? '已记录到手账' : 'Saved to your journal',
          description: locale === 'zh' ? '这一杯标记为自我报告。' : 'This cup is marked self-reported.',
          action: { label: locale === 'zh' ? '查看' : 'View', onClick: () => {} },
        })
      }
    >
      Toast
    </Button>
  );
}

export default function Gallery() {
  const [locale, setLocale] = useState<Locale>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [g, setG] = useState<Guidance>('guided');
  const [seg, setSeg] = useState('espresso');
  const [sw, setSw] = useState(true);
  const [chip, setChip] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [part, setPart] = useState<string | null>('group-head');
  const [music, setMusic] = useState(false);
  const [mood, setMood] = useState<MusicMood>('cafe');

  const setDocTheme = (t: 'light' | 'dark') => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <ToastProvider locale={locale}>
      <main className="cl-container" style={{ paddingBlock: 'var(--space-6)' }} lang={locale === 'zh' ? 'zh-CN' : 'en'}>
        <header className="cl-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <p className="cl-eyebrow">Coffee Lab · UI kit</p>
            <h1>{locale === 'zh' ? '咖啡实验室 组件库' : 'Coffee Lab components'}</h1>
          </div>
          <div className="cl-row">
            <SegmentedControl<Locale>
              label="Locale"
              value={locale}
              onChange={setLocale}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'zh', label: '中文' },
              ]}
            />
            <IconButton
              icon={theme === 'dark' ? 'sun' : 'moon'}
              label="Toggle theme"
              variant="secondary"
              onClick={() => setDocTheme(theme === 'dark' ? 'light' : 'dark')}
            />
          </div>
        </header>

        <Section title="Tokens">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {SWATCHES.map((s) => (
              <div key={s} style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: 'var(--color-surface)' }}>
                <div style={{ height: 40, background: `var(--color-${s})` }} />
                <code style={{ display: 'block', padding: 6, fontSize: 12 }}>--color-{s}</code>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>Display · 一杯好咖啡，从称重开始</p>
          <p>Body text 正文：手冲咖啡的粉水比通常从 1:15 到 1:17 开始尝试。Keyboard: <Kbd>←</Kbd> <Kbd>→</Kbd></p>
        </Section>

        <Section title="Buttons">
          {(['primary', 'secondary', 'ghost', 'danger'] as const).map((v) => (
            <div key={v} className="cl-row">
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <Button key={s} variant={v} size={s} icon={v === 'danger' ? 'x' : 'cup'}>
                  {v} {s}
                </Button>
              ))}
              <Button variant={v} disabled>
                disabled
              </Button>
              <IconButton icon="help" label="Help" variant={v} />
            </div>
          ))}
          <div className="cl-row">
            <Button size="kitchen" icon="check">
              {locale === 'zh' ? '完成这一步' : 'Done'}
            </Button>
            <Button size="lg" busy>
              Saving
            </Button>
            <Spinner locale={locale} />
          </div>
        </Section>

        <Section title="Tags, chips, progress, switch">
          <div className="cl-row">
            <Tag>neutral</Tag>
            <Tag tone="accent" icon="star">accent</Tag>
            <Tag tone="success" icon="check">success</Tag>
            <Tag tone="warning" icon="warning">warning</Tag>
            <Tag tone="danger">danger</Tag>
            <Tag tone="info" icon="info">info</Tag>
            <Tag tone="culture" icon="globe">culture</Tag>
            <Chip selected={chip} onChange={setChip} icon="grinder">
              {locale === 'zh' ? '我有这个' : 'I own this'}
            </Chip>
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'center' }}>
            <ProgressBar value={0.5} label={locale === 'zh' ? '意式路径' : 'Espresso path'} valueText="3 / 6" />
            <div className="cl-row">
              <ProgressRing value={0.66} label="Mastery" />
              <ProgressRing value={1} label="Done" />
              <StepProgress current={2} total={7} locale={locale} />
            </div>
            <Switch checked={sw} onChange={setSw} label={locale === 'zh' ? '音效' : 'Sound effects'} description={locale === 'zh' ? '轻柔的界面声音' : 'Soft interface sounds'} />
          </div>
        </Section>

        <Section title="Choices and guidance">
          <SegmentedControl
            label="Method"
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'espresso', label: 'Espresso', icon: <Icon name="portafilter" size={16} /> },
              { value: 'pourover', label: 'Pour-over', icon: <Icon name="dripper" size={16} /> },
              { value: 'moka', label: 'Moka' },
            ]}
          />
          <div className="cl-row">
            <GuidanceBadge level="guided" locale={locale} />
            <GuidanceBadge level="assisted" locale={locale} />
            <GuidanceBadge level="independent" locale={locale} />
            <GuidanceSelector value={g} onChange={setG} locale={locale} />
          </div>
          <GuidanceSelector value={g} onChange={setG} locale={locale} variant="full" />
        </Section>

        <Section title="Callouts, evidence and feedback">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <Callout kind="tip" locale={locale}>Weigh beans before grinding.</Callout>
            <Callout kind="safety" locale={locale}>Steam and group head water are scalding — keep hands clear.</Callout>
            <Callout kind="myth" locale={locale}>Crema alone does not prove a good shot.</Callout>
            <Callout kind="culture" locale={locale}>In Italy many people drink espresso standing at the bar.</Callout>
            <Callout kind="illustrative" locale={locale}>This taste outcome is an illustrative model, not a prediction.</Callout>
          </div>
          <div className="cl-row">
            <EvidenceBadge kind="self_report" locale={locale} />
            <EvidenceBadge kind="assessed_answer" locale={locale} />
            <EvidenceBadge kind="simulated" locale={locale} />
            <EvidenceBadge kind="observed_by_app" locale={locale} />
          </div>
          <EvidenceBadge kind="self_report" locale={locale} showDetail />
          <FeedbackPanel status="correct" locale={locale} announceOnShow={false}>
            {locale === 'zh' ? '先称重再研磨，剂量才稳定。' : 'Weighing before grinding keeps your dose consistent.'}
          </FeedbackPanel>
          <FeedbackPanel
            status="incorrect"
            locale={locale}
            why
            announceOnShow={false}
            actions={
              <>
                <Button size="sm" icon="repeat">Try again</Button>
                <Button size="sm" variant="ghost">Show answer</Button>
              </>
            }
          >
            {locale === 'zh'
              ? '流速太快通常说明研磨太粗——水找到了阻力更小的路径。'
              : 'A very fast shot usually means the grind is too coarse — water finds an easy path.'}
          </FeedbackPanel>
          <FeedbackPanel status="partly" locale={locale} announceOnShow={false}>Reasonable, but change one thing at a time.</FeedbackPanel>
          <FeedbackPanel status="hint" locale={locale} announceOnShow={false}>Look where the portafilter locks in.</FeedbackPanel>
        </Section>

        <Section title="Overlays">
          <div className="cl-row">
            <Button variant="secondary" onClick={() => setDialog(true)}>Dialog</Button>
            <Button variant="secondary" onClick={() => setSheet(true)}>Sheet</Button>
            <ToastDemo locale={locale} />
          </div>
          <Dialog open={dialog} onClose={() => setDialog(false)} title="Reset progress?" description="This clears lessons and your journal on this device." locale={locale} footer={<><Button variant="secondary" onClick={() => setDialog(false)}>Cancel</Button><Button variant="danger" onClick={() => setDialog(false)}>Reset</Button></>}>
            <p>Your journal entries are self-reported and stored only on this device.</p>
          </Dialog>
          <Sheet open={sheet} onClose={() => setSheet(false)} title={locale === 'zh' ? '需要帮助' : 'Need help'} locale={locale}>
            <p>{locale === 'zh' ? '把手柄插入冲煮头，向右转到底。' : 'Insert the portafilter and turn it right until snug.'}</p>
          </Sheet>
        </Section>

        <Section title="Kitchen action bar (mobile guide)">
          <div style={{ maxWidth: 420, border: '1px dashed var(--color-border-strong)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: 16, fontSize: 'var(--text-kitchen)', fontWeight: 700, lineHeight: 1.3 }}>
              {locale === 'zh' ? '称 18 克咖啡豆' : 'Weigh 18 g of beans'}
            </div>
            <KitchenActionBar locale={locale} onDone={() => {}} onBack={() => {}} onRepeat={() => {}} onHelp={() => {}} />
          </div>
        </Section>

        <Section title="Station diagrams">
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <EspressoStationDiagram mode="explore" locale={locale} selected={part} onSelectPart={setPart} highlighted={['scale']} />
            <PourOverStationDiagram mode="quiz" locale={locale} revealed={['dripper', 'carafe']} incorrect={['timer']} onSelectPart={() => {}} />
          </div>
        </Section>

        <Section title="Icons">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8 }}>
            {ICON_NAMES.map((n) => (
              <div key={n} style={{ display: 'grid', justifyItems: 'center', gap: 4, padding: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <Icon name={n} size={24} style={{ color: 'var(--color-text)' }} />
                {n}
              </div>
            ))}
          </div>
        </Section>

        <Section title={`Illustrations (${ILLUSTRATION_KEYS.length})`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
            {ILLUSTRATION_KEYS.map((k) => (
              <Card key={k} padding="sm">
                <Illustration name={k} />
                <code style={{ fontSize: 12 }}>{k}</code>
              </Card>
            ))}
            <Card padding="sm">
              <Illustration name="unknown-key" />
              <code style={{ fontSize: 12 }}>(fallback)</code>
            </Card>
          </div>
          <EmptyState art={<Illustration name="journal" />} title="No cups logged yet" action={<Button icon="plus">Log a cup</Button>}>
            Make a real coffee, then record what you did — you decide what to note.
          </EmptyState>
        </Section>

        <Section title="Sound">
          <p className="cl-muted">{audio.available ? 'Web Audio available. Tap to unlock, then play.' : 'Web Audio unavailable here — all calls are silent no-ops.'}</p>
          <div className="cl-row">
            {SFX_NAMES.map((n) => (
              <Button
                key={n}
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await audio.unlock();
                  audio.play(n);
                }}
              >
                {n}
              </Button>
            ))}
          </div>
          <div className="cl-row">
            <Switch
              checked={music}
              onChange={async (on) => {
                await audio.unlock();
                setMusic(on);
                audio.setMusicEnabled(on);
              }}
              label="Music"
            />
            <SegmentedControl<MusicMood>
              label="Mood"
              value={mood}
              onChange={(m) => {
                setMood(m);
                audio.setMusicMood(m);
              }}
              options={[
                { value: 'cafe', label: 'Café' },
                { value: 'focus', label: 'Focus' },
                { value: 'lab', label: 'Lab' },
              ]}
            />
          </div>
        </Section>
      </main>
    </ToastProvider>
  );
}
