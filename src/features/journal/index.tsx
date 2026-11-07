/**
 * /journal — "Practice" hub: resume an interrupted guide, start a hands-on practice, and the brew
 * journal of REAL cups (all self-reported). Sub-views via query params (no extra routes):
 *   ?entry=<id>           entry detail (ratio, one-change suggestion, compare, edit/delete)
 *   ?log=1[&drink=<id>]   log a cup made without the guide
 *   ?log=1&attemptOf=<id> log another attempt of an earlier cup
 *   ?drink=<id>           journal filtered by drink
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import type { DrinkCategory, LocalizedText } from '../../domain/contracts';
import { formatRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { learnerActions, useLearner } from '../../state';
import { Callout, Card, EmptyState, EvidenceBadge, Illustration, Tag } from '../../ui';
import { CATEGORY_TEXT } from '../atlas/text';
import { gearStatus } from '../atlas/filters';
import { drinks, entryContext, entryDrinkLabel, getDrink, guidedPractices, lessonTitle, resolvePlan } from '../practice/catalog';
import { formatClock } from '../practice/timer';
import { BrewLogForm } from './BrewLogForm';
import { EntryDetail } from './EntryDetail';
import { formatWhen } from './format';
import { attemptNumber, drinkIdsInJournal, entryRatio, filterByDrink, findEntry, sortNewestFirst } from './model';
import { suggestNextChange } from './advice';
import { tasteLabel } from './taste';
import './journal.css';

const S = {
  title: { zh: '练习与冲煮日志', en: 'Practice & brew journal' },
  lead: {
    zh: '在真实的厨房里练习，然后记下你做出的每一杯。这里的一切都是你自己的记录（自我报告）。',
    en: 'Practise in your real kitchen, then log every cup you make. Everything here is your own record (self-reported).',
  },
  resumeTitle: { zh: '有一个指导进行到一半', en: 'A guide is in progress' },
  resumeBody: (i: number, n: number) => ({ zh: `停在第 ${i}/${n} 步。`, en: `Paused at step ${i} of ${n}.` }),
  resumeFinish: { zh: '步骤都完成了，还差记录。', en: 'Steps done — only the log is left.' },
  resume: { zh: '继续', en: 'Resume' },
  practiceH: { zh: '动手练习（厨房模式）', en: 'Hands-on practice (kitchen mode)' },
  practiceLead: { zh: '手机放在旁边，一步一步来：大按钮、可选计时器、可选朗读。', en: 'Prop your phone nearby and go step by step: big buttons, optional timers, optional read-aloud.' },
  steps: (n: number) => ({ zh: `${n} 步`, en: `${n} steps` }),
  gearOk: { zh: '你的器具够用', en: 'You have the gear' },
  gearMissing: (n: number) => ({ zh: `缺 ${n} 件器具`, en: `${n} item${n > 1 ? 's' : ''} missing` }),
  open: { zh: '开始', en: 'Start' },
  anyDrink: { zh: '做图鉴里的任意一款', en: 'Make any drink from the Atlas' },
  anyDrinkBody: (n: number) => ({ zh: `图鉴里的 ${n} 款饮品，每一款都能用厨房模式一步步完成。`, en: `All ${n} Atlas drinks can run step by step in kitchen mode.` }),
  browse: { zh: '浏览图鉴', en: 'Browse the Atlas' },
  cupsH: { zh: '我的咖啡', en: 'My cups' },
  cups: (n: number) => ({ zh: `已记录 ${n} 杯`, en: `${n} cup${n === 1 ? '' : 's'} logged` }),
  filter: { zh: '按饮品筛选', en: 'Filter by drink' },
  all: { zh: '全部饮品', en: 'All drinks' },
  logCup: { zh: '记录一杯（不用指导）', en: 'Log a cup (no guide)' },
  emptyTitle: { zh: '还没有记录——你的第一杯真咖啡会出现在这里', en: 'No cups yet — your first real cup goes here' },
  emptyBody: {
    zh: '跟着厨房模式做一杯，或者把你已经做好的那杯记下来。只记你知道的，不知道的留空。',
    en: 'Brew one with kitchen mode, or log a cup you already made. Note only what you know; leave the rest blank.',
  },
  emptyStart: { zh: '跟着指导做第一杯', en: 'Make my first cup with the guide' },
  emptyLog: { zh: '记录已经做好的一杯', en: 'Log a cup I already made' },
  noMatch: { zh: '这个饮品还没有记录。', en: 'No cups logged for this drink yet.' },
  showAll: { zh: '显示全部', en: 'Show all' },
  attempt: (n: number) => ({ zh: `第 ${n} 次`, en: `Attempt ${n}` }),
  next: { zh: '下次：', en: 'Next:' },
  openEntry: { zh: '查看', en: 'Open' },
  // new entry
  newTitle: { zh: '记录一杯', en: 'Log a cup' },
  attemptTitle: { zh: '记录下一次尝试', en: 'Log another attempt' },
  newLead: { zh: '记下你实际做的和尝到的。全部选填。', en: 'Note what you actually did and tasted. Everything is optional.' },
  what: { zh: '你做的是什么？', en: 'What did you make?' },
  other: { zh: '其他（自己填写）', en: 'Something else (type it)' },
  otherName: { zh: '饮品名称', en: 'Drink name' },
  prevSummary: { zh: '上一次：', en: 'Previous attempt:' },
  lastTip: { zh: '上次的建议：', en: 'Last time’s suggestion:' },
  yourPlan: { zh: '你的计划：', en: 'Your plan:' },
  oneChange: { zh: '这次只改变一件事，其余保持不变，比较才有意义。', en: 'Change just one thing this time and keep the rest the same — that makes the comparison meaningful.' },
  save: { zh: '保存', en: 'Save' },
  cancel: { zh: '取消', en: 'Cancel' },
  needName: { zh: '请先选择或填写饮品。', en: 'Choose or type a drink first.' },
  notFoundAttempt: { zh: '找不到要对比的上一杯，将作为新的一杯记录。', en: 'The previous cup wasn’t found, so this will be logged as a new cup.' },
};

export default function JournalPage() {
  const [params] = useSearchParams();
  const entry = params.get('entry');
  if (entry) return <EntryDetail key={entry} entryId={entry} fresh={params.get('from') === 'practice' || params.get('from') === 'log'} />;
  if (params.get('log')) return <NewEntry key={params.toString()} attemptOf={params.get('attemptOf')} drinkParam={params.get('drink')} />;
  return <JournalHome drinkFilter={params.get('drink')} />;
}

// ───────────────────────── hub ─────────────────────────

function JournalHome({ drinkFilter }: { drinkFilter: string | null }) {
  const { t, locale } = useI18n();
  useDocumentTitle(S.title);
  const [, setParams] = useSearchParams();
  const journal = useLearner((s) => s.journal);
  const active = useLearner((s) => s.activePractice);
  const profile = useLearner((s) => s.profile);
  const owned = profile?.equipment ?? null;

  const activePlan = useMemo(() => {
    if (!active) return null;
    const r = resolvePlan(active.activityId);
    return r.ok ? r.plan : null;
  }, [active?.activityId]);

  const sorted = useMemo(() => sortNewestFirst(journal), [journal]);
  const visible = filterByDrink(sorted, drinkFilter);
  const drinkOptions = drinkIdsInJournal(journal);
  const filterKnown = !drinkFilter || drinkOptions.some((d) => d.drinkId === drinkFilter);

  const firstGuide =
    guidedPractices.find((a) => a.id === (profile?.goal === 'pourover' ? 'po-first-real-cup-guide' : 'esp-first-real-shot-guide')) ?? guidedPractices[0];

  return (
    <section className="jr-page" aria-labelledby="page-title">
      <header className="jr-head">
        <h1 id="page-title" className="jr-title">
          {t(S.title)}
        </h1>
        <p className="jr-lead">{t(S.lead)}</p>
      </header>

      {active && (
        <Card as="section" tone="accent" className="jr-resume" data-testid="journal-resume" aria-labelledby="jr-resume-h">
          <h2 id="jr-resume-h" className="jr-h3">
            {t(S.resumeTitle)}: {activePlan ? t(activePlan.title) : active.activityId}
          </h2>
          <p>
            {activePlan && active.stepIndex >= activePlan.steps.length
              ? t(S.resumeFinish)
              : t(S.resumeBody(active.stepIndex + 1, activePlan?.steps.length ?? active.stepIndex + 1))}
          </p>
          <Link className="cl-btn cl-btn--primary cl-btn--lg" to={`/practice/${encodeURIComponent(active.activityId)}`}>
            {t(S.resume)}
          </Link>
        </Card>
      )}

      <section className="jr-section" aria-labelledby="jr-cups-h">
        <div className="jr-cups-head">
          <div>
            <h2 id="jr-cups-h">{t(S.cupsH)}</h2>
            <p className="jr-count" data-testid="cups-count">
              <strong>{t(S.cups(journal.length))}</strong> <EvidenceBadge kind="self_report" locale={locale} />
            </p>
          </div>
          <Link className="cl-btn cl-btn--secondary cl-btn--md" to="/journal?log=1" data-testid="log-cup">
            {t(S.logCup)}
          </Link>
        </div>

        {journal.length === 0 ? (
          <EmptyState
            art={<Illustration name="cup" />}
            title={t(S.emptyTitle)}
            action={
              <div className="cl-row jr-empty-actions">
                {firstGuide && (
                  <Link className="cl-btn cl-btn--primary cl-btn--lg" to={`/practice/${encodeURIComponent(firstGuide.id)}`}>
                    {t(S.emptyStart)}
                  </Link>
                )}
                <Link className="cl-btn cl-btn--secondary cl-btn--lg" to="/journal?log=1">
                  {t(S.emptyLog)}
                </Link>
              </div>
            }
          >
            <p>{t(S.emptyBody)}</p>
          </EmptyState>
        ) : (
          <>
            <div className="jr-filter">
              <label htmlFor="jr-filter" className="jr-field__label">
                {t(S.filter)}
              </label>
              <select
                id="jr-filter"
                className="jr-input jr-select"
                value={drinkFilter ?? ''}
                onChange={(e) => setParams(e.target.value ? { drink: e.target.value } : {}, { replace: true })}
                data-testid="journal-filter"
              >
                <option value="">
                  {t(S.all)} ({journal.length})
                </option>
                {drinkOptions.map((d) => (
                  <option key={d.drinkId} value={d.drinkId}>
                    {t(entryDrinkLabel({ drinkId: d.drinkId }))} ({d.count})
                  </option>
                ))}
                {!filterKnown && drinkFilter && <option value={drinkFilter}>{t(entryDrinkLabel({ drinkId: drinkFilter }))} (0)</option>}
              </select>
            </div>
            {visible.length === 0 ? (
              <p>
                {t(S.noMatch)}{' '}
                <button type="button" className="jr-linkbtn" onClick={() => setParams({}, { replace: true })}>
                  {t(S.showAll)}
                </button>
              </p>
            ) : (
              <ol className="jr-list" data-testid="journal-list">
                {visible.map((e) => {
                  const ratio = entryRatio(e);
                  const n = attemptNumber(e, journal);
                  return (
                    <li key={e.id}>
                      <article className="jr-item" aria-labelledby={`jr-${e.id}`}>
                        <div className="jr-item__main">
                          <h3 id={`jr-${e.id}`} className="jr-h3">
                            <Link to={`/journal?entry=${encodeURIComponent(e.id)}`} className="jr-item__link">
                              {t(entryDrinkLabel(e))}
                            </Link>
                          </h3>
                          <p className="jr-small cl-muted">
                            <time dateTime={e.createdAt}>{formatWhen(e.createdAt, locale)}</time>
                          </p>
                          <p className="jr-item__metrics cl-num">
                            {e.doseG != null && <span>{e.doseG} g</span>}
                            {e.doseG != null && e.outG != null && <span aria-hidden="true">→</span>}
                            {e.outG != null && <span>{e.outG} g</span>}
                            {ratio !== null && <span className="jr-item__ratio">{formatRatio(ratio)}</span>}
                            {e.timeSec != null && <span>{formatClock(e.timeSec * 1000)}</span>}
                            {e.rating && <span>★ {e.rating}/5</span>}
                          </p>
                          {e.tasteTags && e.tasteTags.length > 0 && (
                            <div className="jr-tags">
                              {e.tasteTags.map((x) => (
                                <Tag key={x}>{tasteLabel(x, locale)}</Tag>
                              ))}
                            </div>
                          )}
                          {e.nextChange && (
                            <p className="jr-small">
                              <strong>{t(S.next)}</strong> {e.nextChange}
                            </p>
                          )}
                        </div>
                        <div className="jr-item__side">
                          <EvidenceBadge kind="self_report" locale={locale} />
                          {n > 1 && <Tag tone="accent">{t(S.attempt(n))}</Tag>}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </section>

      <section className="jr-section" aria-labelledby="jr-practice-h">
        <h2 id="jr-practice-h">{t(S.practiceH)}</h2>
        <p className="cl-muted">{t(S.practiceLead)}</p>
        <ul className="jr-practice-grid">
          {guidedPractices.map((a) => {
            const gs = gearStatus(a.equipment, owned ?? []);
            const lt = lessonTitle(a.lessonId);
            return (
              <li key={a.id}>
                <Card className="jr-practice-card" padding="sm">
                  {lt && <p className="cl-eyebrow">{t(lt)}</p>}
                  <h3 className="jr-h3">{t(a.title)}</h3>
                  <div className="cl-row jr-small">
                    <span>{t(S.steps(a.steps.length))}</span>
                    {owned && (
                      <Tag tone={gs.canMake ? 'success' : 'warning'} icon={gs.canMake ? 'check' : 'warning'}>
                        {gs.canMake ? t(S.gearOk) : t(S.gearMissing(gs.missing.length))}
                      </Tag>
                    )}
                  </div>
                  <Link className="cl-btn cl-btn--secondary cl-btn--md jr-practice-card__go" to={`/practice/${encodeURIComponent(a.id)}`} data-testid={`start-${a.id}`}>
                    {t(S.open)} <span className="cl-visually-hidden">{t(a.title)}</span>
                  </Link>
                </Card>
              </li>
            );
          })}
          <li>
            <Card className="jr-practice-card" padding="sm" tone="muted">
              <h3 className="jr-h3">{t(S.anyDrink)}</h3>
              <p className="jr-small cl-muted">{t(S.anyDrinkBody(drinks.length))}</p>
              <Link className="cl-btn cl-btn--secondary cl-btn--md jr-practice-card__go" to="/atlas">
                {t(S.browse)}
              </Link>
            </Card>
          </li>
        </ul>
      </section>
    </section>
  );
}

// ───────────────────────── new entry / attempt ─────────────────────────

const ALL_FIELDS = ['doseG', 'outG', 'timeSec', 'grind', 'taste', 'rating', 'notes'] as const;

function NewEntry({ attemptOf, drinkParam }: { attemptOf: string | null; drinkParam: string | null }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const journal = useLearner((s) => s.journal);
  const prev = findEntry(journal, attemptOf);
  useDocumentTitle(prev ? S.attemptTitle : S.newTitle);

  const initialDrink = prev?.drinkId ?? (drinkParam && getDrink(drinkParam) ? drinkParam : '');
  const [drinkId, setDrinkId] = useState<string>(initialDrink);
  const [otherName, setOtherName] = useState('');
  const [nameError, setNameError] = useState(false);

  const ctx = prev ? entryContext(prev) : drinkId && drinkId !== '__other' ? entryContext({ drinkId }) : { brewKind: 'brew' as const };
  const prevPlan = prev?.activityId ? resolvePlan(prev.activityId) : null;
  const fields = prevPlan && prevPlan.ok ? prevPlan.plan.logFields : [...ALL_FIELDS];
  const lastAdvice = prev
    ? suggestNextChange({ kind: ctx.brewKind, doseG: prev.doseG, outG: prev.outG, timeSec: prev.timeSec, tasteTags: prev.tasteTags, rating: prev.rating, targetTimeSec: ctx.targetTimeSec })
    : null;

  const grouped = useMemo(() => {
    const m = new Map<DrinkCategory, typeof drinks>();
    for (const d of drinks) m.set(d.category, [...(m.get(d.category) ?? []), d]);
    return [...m.entries()];
  }, []);

  const label = (x: LocalizedText) => t(x);

  return (
    <section className="jr-page" aria-labelledby="page-title">
      <Link to="/journal" className="jr-back">
        ← {t(S.cupsH)}
      </Link>
      <header className="jr-head">
        <h1 id="page-title" className="jr-title">
          {t(prev ? S.attemptTitle : S.newTitle)}
        </h1>
        <p className="jr-lead">{t(S.newLead)}</p>
        <EvidenceBadge kind="self_report" locale={locale} showDetail />
      </header>

      {attemptOf && !prev && (
        <Callout kind="info" locale={locale}>
          {t(S.notFoundAttempt)}
        </Callout>
      )}

      {prev ? (
        <Card as="section" tone="muted" padding="sm" className="jr-prev" aria-label={t(S.prevSummary)}>
          <p>
            <strong>{t(S.prevSummary)}</strong> {t(entryDrinkLabel(prev))} · <time dateTime={prev.createdAt}>{formatWhen(prev.createdAt, locale)}</time>
          </p>
          <p className="cl-num jr-small">
            {[
              prev.doseG != null ? `${prev.doseG} g` : null,
              prev.outG != null ? `→ ${prev.outG} g` : null,
              entryRatio(prev) !== null ? formatRatio(entryRatio(prev)) : null,
              prev.timeSec != null ? formatClock(prev.timeSec * 1000) : null,
              prev.tasteTags?.length ? prev.tasteTags.map((x) => tasteLabel(x, locale)).join(', ') : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {prev.nextChange ? (
            <p className="jr-small">
              <strong>{t(S.yourPlan)}</strong> {prev.nextChange}
            </p>
          ) : lastAdvice ? (
            <p className="jr-small">
              <strong>{t(S.lastTip)}</strong> {label(lastAdvice.headline)}
            </p>
          ) : null}
          <p className="jr-small cl-muted">{t(S.oneChange)}</p>
        </Card>
      ) : (
        <div className="jr-field">
          <label htmlFor="jr-drink" className="jr-field__label">
            {t(S.what)}
          </label>
          <select
            id="jr-drink"
            className="jr-input jr-select"
            value={drinkId}
            onChange={(e) => {
              setDrinkId(e.target.value);
              setNameError(false);
            }}
            aria-invalid={nameError || undefined}
            data-testid="log-drink"
          >
            <option value="">—</option>
            {grouped.map(([cat, list]) => (
              <optgroup key={cat} label={t(CATEGORY_TEXT[cat].label)}>
                {list.map((d) => (
                  <option key={d.id} value={d.id}>
                    {t(d.name)}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="__other">{t(S.other)}</option>
          </select>
          {drinkId === '__other' && (
            <>
              <label htmlFor="jr-other" className="jr-field__label">
                {t(S.otherName)}
              </label>
              <input id="jr-other" className="jr-input" value={otherName} maxLength={60} onChange={(e) => setOtherName(e.target.value)} aria-invalid={nameError || undefined} />
            </>
          )}
          {nameError && (
            <p className="jr-field__error" role="alert">
              {t(S.needName)}
            </p>
          )}
        </div>
      )}

      <BrewLogForm
        fields={fields}
        brewKind={ctx.brewKind === 'none' && !prev ? 'brew' : ctx.brewKind}
        reference={prev}
        showNextChange
        submitLabel={t(S.save)}
        onSubmit={(v) => {
          const finalDrink = prev ? prev.drinkId : drinkId === '__other' ? otherName.trim() : drinkId;
          if (!finalDrink) {
            setNameError(true);
            document.getElementById(drinkId === '__other' ? 'jr-other' : 'jr-drink')?.focus();
            return;
          }
          const entry = learnerActions.addJournalEntry({
            drinkId: finalDrink,
            ...(prev?.activityId ? { activityId: prev.activityId } : {}),
            ...(prev ? { attemptOf: prev.id } : {}),
            ...v,
          });
          navigate(`/journal?entry=${encodeURIComponent(entry.id)}&from=log`, { replace: true });
        }}
        secondary={
          <Link className="cl-btn cl-btn--ghost cl-btn--lg" to={prev ? `/journal?entry=${encodeURIComponent(prev.id)}` : '/journal'}>
            {t(S.cancel)}
          </Link>
        }
      />
    </section>
  );
}
