/**
 * Onboarding: goal → experience → devices → equipment (owned + wishlist) → preferred mode + default guidance.
 * Skip-friendly ("Start with defaults", data-testid="onboarding-defaults") and editable later via
 * /onboarding?edit=1 (prefilled from the saved profile; progress is never touched).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { audio } from '../../audio';
import { equipment as catalog } from '../../content';
import type { DeviceKind, Experience, Goal, Guidance, LearnerProfile, Mode } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { suggestMode, useCapabilities, useXrSupport } from '../../platform';
import { learnerActions, useLearner } from '../../state';
import { Icon, type IconName } from '../../ui/icons';
import { Button } from '../../ui/primitives/Button';
import { GuidanceSelector } from '../../ui/primitives/Guidance';
import { StepProgress } from '../../ui/primitives/Progress';
import { SegmentedControl } from '../../ui/primitives/SegmentedControl';
import { Chip, Tag } from '../../ui/primitives/Tag';
import { QUICK_PICKS, applyQuickPick, defaultProfile, deviceFromCaps, groupEquipment, suggestedModeFor, toggle } from './profileDraft';
import { S } from './strings';
import './onboarding.css';

const GOALS: Goal[] = ['espresso', 'pourover', 'explore'];
const GOAL_ICON: Record<Goal, IconName> = { espresso: 'portafilter', pourover: 'dripper', explore: 'globe' };
const EXPERIENCES: Experience[] = ['new', 'some', 'experienced'];
const DEVICES: DeviceKind[] = ['pc', 'phone', 'headset'];
const DEVICE_ICON: Record<DeviceKind, IconName> = { pc: 'desktop', phone: 'phone', headset: 'headset' };
const MODES: Mode[] = ['desktop', 'mobile', 'real-world-guide', 'xr'];
const MODE_ICON: Record<Mode, IconName> = { desktop: 'desktop', mobile: 'phone', 'real-world-guide': 'cup', xr: 'headset' };
const STEP_COUNT = 5;

function play(name: 'tap' | 'select' | 'complete') {
  try {
    audio.play(name);
  } catch {
    /* optional */
  }
}

function Step({ title, help, children, headingRef }: { title: string; help?: ReactNode; children: ReactNode; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <section className="ob-step" aria-labelledby="ob-step-title">
      <h2 id="ob-step-title" className="ob-step__title" ref={headingRef} tabIndex={-1}>
        {title}
      </h2>
      {help && <p className="cl-muted ob-step__help">{help}</p>}
      {children}
    </section>
  );
}

export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const caps = useCapabilities();
  const xr = useXrSupport();
  const saved = useLearner((s) => s.profile);
  const prefGuidance = useLearner((s) => s.prefs.defaultGuidance);
  const editing = params.get('edit') === '1' && !!saved;
  useDocumentTitle(editing ? S.editTitle : S.title);

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>(saved?.goal ?? 'espresso');
  const [experience, setExperience] = useState<Experience>(saved?.experience ?? 'new');
  const [devicesChoice, setDevicesChoice] = useState<DeviceKind[] | null>(saved ? [...saved.devices] : null);
  const [owned, setOwned] = useState<string[]>(saved ? [...saved.equipment] : []);
  const [wishlist, setWishlist] = useState<string[]>(saved ? [...saved.wishlist] : []);
  const [modeChoice, setModeChoice] = useState<Mode | null>(saved?.preferredMode ?? null);
  const [guidance, setGuidance] = useState<Guidance>(prefGuidance);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const suggested = suggestedModeFor(caps, suggestMode);
  const devices = devicesChoice ?? [deviceFromCaps(caps)];
  const mode = modeChoice ?? suggested;
  const groups = useMemo(() => groupEquipment(catalog), []);
  const catalogIds = useMemo(() => new Set(catalog.map((e) => e.id)), []);

  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [step]);

  const go = (next: number) => {
    moved.current = true;
    setStep(Math.max(0, Math.min(STEP_COUNT - 1, next)));
    play('tap');
  };

  const startWithDefaults = () => {
    learnerActions.setProfile(defaultProfile(caps, suggested));
    play('complete');
    navigate('/', { replace: true });
  };

  const finish = () => {
    const profile: LearnerProfile = {
      goal,
      experience,
      devices: devices.length ? devices : [deviceFromCaps(caps)],
      equipment: owned,
      wishlist: wishlist.filter((id) => !owned.includes(id)),
      preferredMode: mode,
      onboardedAt: saved?.onboardedAt ?? new Date().toISOString(),
    };
    learnerActions.setProfile(profile);
    learnerActions.updatePrefs({ defaultGuidance: guidance });
    play('complete');
    navigate('/', { replace: true });
  };

  const quick = (ids: readonly string[]) => {
    const r = applyQuickPick(owned, wishlist, ids, catalogIds);
    setOwned(r.owned);
    setWishlist(r.wishlist);
    play('select');
  };

  const canNext = step !== 2 || devices.length > 0;
  const isLast = step === STEP_COUNT - 1;

  let body: ReactNode;
  switch (step) {
    case 0:
      body = (
        <Step title={t(S.goalQ)} headingRef={headingRef}>
          <SegmentedControl<Goal>
            labelledBy="ob-step-title"
            layout="stacked"
            size="lg"
            value={goal}
            onChange={(g) => {
              setGoal(g);
              play('select');
            }}
            options={GOALS.map((g) => ({ value: g, label: t(S.goal[g]), icon: <Icon name={GOAL_ICON[g]} size={22} />, description: t(S.goalDesc[g]) }))}
          />
        </Step>
      );
      break;
    case 1:
      body = (
        <Step title={t(S.expQ)} headingRef={headingRef}>
          <SegmentedControl<Experience>
            labelledBy="ob-step-title"
            layout="stacked"
            size="lg"
            value={experience}
            onChange={(e) => {
              setExperience(e);
              play('select');
            }}
            options={EXPERIENCES.map((e) => ({ value: e, label: t(S.exp[e]), description: t(S.expDesc[e]) }))}
          />
        </Step>
      );
      break;
    case 2:
      body = (
        <Step title={t(S.devQ)} help={t(S.devHelp)} headingRef={headingRef}>
          <div className="ob-devices" role="group" aria-labelledby="ob-step-title">
            {DEVICES.map((d) => {
              const on = devices.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  className="ob-device"
                  aria-pressed={on}
                  onClick={() => {
                    setDevicesChoice(toggle(devices, d) as DeviceKind[]);
                    play('select');
                  }}
                  data-device={d}
                >
                  <Icon name={DEVICE_ICON[d]} size={28} />
                  <span className="ob-device__label">{t(S.dev[d])}</span>
                  <span className="ob-device__desc">{t(S.devDesc[d])}</span>
                  <span className="ob-device__check" aria-hidden="true">
                    {on ? <Icon name="check" size={18} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          {devices.length === 0 && (
            <p className="ob-error" role="alert">
              {t(S.devNeedOne)}
            </p>
          )}
        </Step>
      );
      break;
    case 3:
      body = (
        <Step title={t(S.eqQ)} help={t(S.eqHelp)} headingRef={headingRef}>
          <div className="ob-quick" role="group" aria-label={t(S.quickPicks)}>
            <span className="ob-quick__label">{t(S.quickPicks)}:</span>
            <Button variant="secondary" size="sm" icon="portafilter" onClick={() => quick(QUICK_PICKS.espresso)} data-testid="quick-espresso">
              {t(S.quickEspresso)}
            </Button>
            <Button variant="secondary" size="sm" icon="dripper" onClick={() => quick(QUICK_PICKS.pourover)} data-testid="quick-pourover">
              {t(S.quickPour)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOwned([]);
                play('tap');
              }}
            >
              {t(S.quickNone)}
            </Button>
          </div>
          <p className="ob-count" aria-live="polite">
            {t(S.owned)} · {t(S.selectedCount(owned.length))}
          </p>
          <div className="ob-groups">
            {groups.map((g) => (
              <fieldset key={g.category} className="ob-group">
                <legend>{t(S.cat[g.category])}</legend>
                <div className="ob-chips">
                  {g.items.map((e) => (
                    <Chip
                      key={e.id}
                      selected={owned.includes(e.id)}
                      onChange={() => {
                        setOwned((o) => toggle(o, e.id));
                        setWishlist((w) => w.filter((x) => x !== e.id));
                      }}
                      title={t(e.description)}
                      data-equipment={e.id}
                    >
                      {t(e.name)}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <details className="ob-wish" open={wishlist.length > 0 || undefined}>
            <summary>
              {t(S.wishlist)} · {t(S.selectedCount(wishlist.length))}
            </summary>
            <p className="cl-muted ob-step__help">{t(S.wishHelp)}</p>
            <div className="ob-groups">
              {groups.map((g) => {
                const items = g.items.filter((e) => !owned.includes(e.id));
                if (items.length === 0) return null;
                return (
                  <fieldset key={g.category} className="ob-group">
                    <legend>{t(S.cat[g.category])}</legend>
                    <div className="ob-chips">
                      {items.map((e) => (
                        <Chip key={e.id} selected={wishlist.includes(e.id)} onChange={() => setWishlist((w) => toggle(w, e.id))} icon="star">
                          {t(e.name)}
                        </Chip>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </details>
        </Step>
      );
      break;
    default:
      body = (
        <Step title={t(S.modeQ)} headingRef={headingRef}>
          <SegmentedControl<Mode>
            labelledBy="ob-step-title"
            layout="stacked"
            value={mode}
            onChange={(m) => {
              setModeChoice(m);
              play('select');
            }}
            options={MODES.map((m) => ({
              value: m,
              label: (
                <>
                  {t(S.mode[m])}
                  {m === suggested && (
                    <Tag tone="accent" size="sm" className="ob-suggested">
                      {t(S.suggested)}
                    </Tag>
                  )}
                </>
              ),
              icon: <Icon name={MODE_ICON[m]} size={22} />,
              description: `${t(S.modeDesc[m])}${m === 'xr' && xr && !xr.immersiveVR ? ` ${t(S.xrNotDetected)}` : ''}`,
            }))}
          />
          <h3 className="ob-sub">{t(S.guidanceQ)}</h3>
          <p className="cl-muted ob-step__help">{t(S.guidanceHelp)}</p>
          <GuidanceSelector value={guidance} onChange={setGuidance} locale={locale} variant="full" label={t(S.guidanceQ)} />
        </Step>
      );
  }

  return (
    <section className="ob" aria-labelledby="ob-title">
      <header className="ob-head">
        <h1 id="ob-title" className="ob-title">
          {editing ? t(S.editTitle) : t(S.title)}
        </h1>
        <p className="ob-lead">{editing ? t(S.editLead) : t(S.lead)}</p>
        {editing ? (
          <Link to="/" className="ob-skip-link">
            {t(S.cancel)}
          </Link>
        ) : (
          <div className="ob-skip">
            <Button variant="secondary" onClick={startWithDefaults} data-testid="onboarding-defaults">
              {t(S.defaults)}
            </Button>
            <span className="cl-muted ob-skip__note">{t(S.defaultsNote)}</span>
          </div>
        )}
      </header>

      <nav className="ob-steps" aria-label={t(S.stepsLabel)}>
        <StepProgress current={step} total={STEP_COUNT} locale={locale} />
        <ol className="ob-steps__list">
          {S.stepNames.map((n, i) => (
            <li key={i}>
              <button type="button" className="ob-steps__btn" aria-current={i === step ? 'step' : undefined} onClick={() => go(i)} data-done={i < step}>
                {t(n)}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <form
        className="ob-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canNext) return;
          if (isLast) finish();
          else go(step + 1);
        }}
      >
        {body}
        <div className="ob-nav">
          <Button variant="ghost" icon="back" onClick={() => go(step - 1)} disabled={step === 0} data-testid="onboarding-back">
            {t(S.back)}
          </Button>
          <Button type="submit" iconEnd={isLast ? 'check' : 'next'} disabled={!canNext} size="lg" data-testid={isLast ? 'onboarding-finish' : 'onboarding-next'}>
            {isLast ? (editing ? t(S.save) : t(S.finish)) : t(S.next)}
          </Button>
        </div>
      </form>
    </section>
  );
}
