/** One real cup: values, ratio, one-change suggestion, comparison with the previous attempt, edit/delete. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { audio } from '../../audio';
import type { BrewLogEntry } from '../../domain/contracts';
import { formatRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { learnerActions, useLearner } from '../../state';
import { announce, Button, Callout, Card, Dialog, EmptyState, EvidenceBadge, Illustration, Tag } from '../../ui';
import { entryContext, entryDrinkLabel, guidedPractices } from '../practice/catalog';
import { formatClock } from '../practice/timer';
import { suggestNextChange } from './advice';
import { BrewLogForm } from './BrewLogForm';
import { attemptNumber, changedVariableCount, compareAttempts, partiallyLoggedCount, entryRatio, findEntry, laterAttempts, previousAttempt, type CompareRow } from './model';
import { tasteLabel } from './taste';
import { formatWhen } from './format';

const S = {
  back: { zh: '← 全部记录', en: '← All cups' },
  missing: { zh: '日志里没有这一杯', en: 'This cup isn’t in your journal' },
  missingBody: { zh: '它可能已被删除。', en: 'It may have been deleted.' },
  saved: { zh: '已保存到你的日志。', en: 'Saved to your journal.' },
  attempt: (n: number) => ({ zh: `第 ${n} 次尝试`, en: `Attempt ${n}` }),
  dose: { zh: '粉量', en: 'Dose' },
  outE: { zh: '出液', en: 'Yield' },
  outB: { zh: '用水', en: 'Water' },
  ratio: { zh: '比例', en: 'Ratio' },
  ratioNoteE: { zh: '出液 ÷ 粉量，基于你填写的数字计算。', en: 'Yield ÷ dose, calculated from the numbers you entered.' },
  ratioNoteB: { zh: '水 ÷ 粉量，基于你填写的数字计算。', en: 'Water ÷ dose, calculated from the numbers you entered.' },
  time: { zh: '时间', en: 'Time' },
  grind: { zh: '研磨', en: 'Grind' },
  taste: { zh: '味道', en: 'Taste' },
  rating: { zh: '喜欢程度', en: 'Enjoyment' },
  notes: { zh: '笔记', en: 'Notes' },
  plan: { zh: '下次计划', en: 'Plan for next time' },
  none: { zh: '未记录', en: 'not logged' },
  nextTitle: { zh: '下次可以试的一个改变', en: 'One thing to try next' },
  planThis: { zh: '把它定为下次计划', en: 'Make this my plan' },
  planned: { zh: '已定为下次计划', en: 'Saved as your plan' },
  noAdvice: { zh: '这类练习没有冲煮参数建议——看看你的笔记，下次留意同一个点。', en: 'No brew-parameter suggestion for this kind of practice — revisit your notes and focus on the same point next time.' },
  compareTitle: { zh: '和上一次比较', en: 'Compared with your previous attempt' },
  compareCaption: { zh: '上一次与这一次的记录', en: 'Previous attempt vs this one' },
  field: { zh: '项目', en: 'Field' },
  before: { zh: '上次', en: 'Before' },
  after: { zh: '这次', en: 'Now' },
  changed: { zh: '有变化', en: 'changed' },
  same: { zh: '相同', en: 'same' },
  one: { zh: '你只改变了一个配方变量——这样的比较最有参考价值。', en: 'You changed one recipe variable — the fairest kind of comparison.' },
  many: (n: number) => ({ zh: `你同时改变了 ${n} 个变量，很难判断是哪一个起了作用。下次试着只改一个。`, en: `You changed ${n} things at once, so it’s hard to tell which one mattered. Try changing just one next time.` }),
  zero: { zh: '配方没变——适合检验结果是否稳定。', en: 'Same recipe — good for checking consistency.' },
  partial: { zh: '有些配方数值只在其中一次记录了，所以这个比较不完整。', en: 'Some recipe values were logged only once, so this comparison is partial.' },
  openPrev: { zh: '查看上一次', en: 'Open previous attempt' },
  later: { zh: '之后的尝试', en: 'Later attempts' },
  another: { zh: '记录下一次尝试', en: 'Log another attempt' },
  guide: { zh: '用指导再做一次', en: 'Brew again with the guide' },
  toLesson: { zh: '回到课程', en: 'Back to the lesson' },
  edit: { zh: '编辑', en: 'Edit' },
  del: { zh: '删除', en: 'Delete' },
  editTitle: { zh: '编辑这一杯', en: 'Edit this cup' },
  saveEdit: { zh: '保存修改', en: 'Save changes' },
  cancel: { zh: '取消', en: 'Cancel' },
  delTitle: { zh: '删除这条记录？', en: 'Delete this cup?' },
  delBody: { zh: '删除后无法恢复（除非你导出过数据）。', en: 'This can’t be undone (unless you exported your data).' },
  deleted: { zh: '已删除。', en: 'Deleted.' },
  logged: { zh: '记录于', en: 'Logged' },
};

const FIELD_LABEL: Record<CompareRow['field'], keyof typeof S> = {
  doseG: 'dose',
  outG: 'outE',
  ratio: 'ratio',
  timeSec: 'time',
  grind: 'grind',
  rating: 'rating',
  tasteTags: 'taste',
};

export function EntryDetail({ entryId, fresh }: { entryId: string; fresh: boolean }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const journal = useLearner((s) => s.journal);
  const entry = findEntry(journal, entryId);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  useDocumentTitle(entry ? entryDrinkLabel(entry) : S.missing);

  const ctx = useMemo(() => (entry ? entryContext(entry) : null), [entry?.drinkId, entry?.activityId]);
  if (!entry || !ctx) {
    return (
      <EmptyState
        art={<Illustration name="cup" />}
        title={<span id="page-title">{t(S.missing)}</span>}
        action={
          <Link className="cl-btn cl-btn--primary cl-btn--md" to="/journal">
            {t(S.back)}
          </Link>
        }
      >
        <p>{t(S.missingBody)}</p>
      </EmptyState>
    );
  }

  const espresso = ctx.brewKind === 'espresso';
  const ratio = entryRatio(entry);
  const advice = suggestNextChange({
    kind: ctx.brewKind,
    doseG: entry.doseG,
    outG: entry.outG,
    timeSec: entry.timeSec,
    tasteTags: entry.tasteTags,
    rating: entry.rating,
    targetTimeSec: ctx.targetTimeSec,
  });
  const prev = previousAttempt(entry, journal);
  const later = laterAttempts(entry, journal);
  const n = attemptNumber(entry, journal);
  const rows = prev ? compareAttempts(prev, entry) : [];
  const changes = changedVariableCount(rows);
  const partial = partiallyLoggedCount(rows);
  const adviceText = advice ? `${t(advice.headline)}${advice.target ? ` — ${t(advice.target)}` : ''}` : '';
  const guideId = entry.activityId && (entry.activityId.startsWith('drink:') || guidedPractices.some((a) => a.id === entry.activityId)) ? entry.activityId : null;

  const show = (v: CompareRow['before'], field: CompareRow['field']) => {
    if (v === null) return '—';
    if (field === 'tasteTags' && Array.isArray(v)) return v.map((x) => tasteLabel(x, locale)).join(', ');
    if (field === 'timeSec' && typeof v === 'number') return formatClock(v * 1000);
    if (field === 'ratio' && typeof v === 'number') return formatRatio(v);
    if ((field === 'doseG' || field === 'outG') && typeof v === 'number') return `${v} g`;
    if (field === 'rating') return `${v}/5`;
    return String(v);
  };

  const fieldLabel = (f: CompareRow['field']) => (f === 'outG' && !espresso ? t(S.outB) : t(S[FIELD_LABEL[f]] as { zh: string; en: string }));

  const doDelete = () => {
    learnerActions.deleteJournalEntry(entry.id);
    setConfirmDel(false);
    announce(t(S.deleted));
    navigate('/journal', { replace: true });
  };

  return (
    <article className="jr-detail" aria-labelledby="page-title" data-testid="journal-entry">
      <Link to="/journal" className="jr-back">
        {t(S.back)}
      </Link>

      {fresh && (
        <p className="jr-saved" role="status">
          {t(S.saved)}
        </p>
      )}

      <header className="jr-detail__head">
        <div>
          <p className="cl-eyebrow">
            {t(S.logged)} <time dateTime={entry.createdAt}>{formatWhen(entry.createdAt, locale)}</time>
          </p>
          <h1 id="page-title" className="jr-title">
            {t(entryDrinkLabel(entry))}
          </h1>
          <div className="cl-row">
            <EvidenceBadge kind="self_report" locale={locale} showDetail />
            {n > 1 && <Tag tone="accent">{t(S.attempt(n))}</Tag>}
          </div>
        </div>
      </header>

      {editing ? (
        <Card as="section" title={t(S.editTitle)} titleLevel={2}>
          <BrewLogForm
            fields={['doseG', 'outG', 'timeSec', 'grind', 'taste', 'rating', 'notes']}
            brewKind={ctx.brewKind}
            initial={entry}
            showNextChange
            submitLabel={t(S.saveEdit)}
            onSubmit={(v) => {
              const patch: Partial<BrewLogEntry> = {
                doseG: v.doseG,
                outG: v.outG,
                timeSec: v.timeSec,
                grind: v.grind,
                tasteTags: v.tasteTags,
                rating: v.rating,
                notes: v.notes,
                nextChange: v.nextChange,
              };
              learnerActions.updateJournalEntry(entry.id, patch);
              setEditing(false);
              announce(t(S.saved));
            }}
            secondary={
              <Button variant="ghost" size="lg" onClick={() => setEditing(false)}>
                {t(S.cancel)}
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <dl className="jr-values" data-testid="entry-values">
            <div>
              <dt>{t(S.dose)}</dt>
              <dd className="cl-num">{entry.doseG != null ? `${entry.doseG} g` : <span className="cl-muted">{t(S.none)}</span>}</dd>
            </div>
            <div>
              <dt>{t(espresso ? S.outE : S.outB)}</dt>
              <dd className="cl-num">{entry.outG != null ? `${entry.outG} g` : <span className="cl-muted">{t(S.none)}</span>}</dd>
            </div>
            <div className="jr-values__ratio">
              <dt>{t(S.ratio)}</dt>
              <dd className="cl-num" data-testid="entry-ratio">
                {ratio !== null ? formatRatio(ratio) : <span className="cl-muted">{t(S.none)}</span>}
              </dd>
            </div>
            <div>
              <dt>{t(S.time)}</dt>
              <dd className="cl-num">{entry.timeSec != null ? formatClock(entry.timeSec * 1000) : <span className="cl-muted">{t(S.none)}</span>}</dd>
            </div>
            {entry.grind && (
              <div>
                <dt>{t(S.grind)}</dt>
                <dd>{entry.grind}</dd>
              </div>
            )}
            {entry.rating && (
              <div>
                <dt>{t(S.rating)}</dt>
                <dd className="cl-num">{entry.rating}/5</dd>
              </div>
            )}
          </dl>
          {ratio !== null && <p className="cl-muted jr-small">{t(espresso ? S.ratioNoteE : S.ratioNoteB)}</p>}
          {entry.tasteTags && entry.tasteTags.length > 0 && (
            <div className="jr-tags" aria-label={t(S.taste)}>
              {entry.tasteTags.map((x) => (
                <Tag key={x}>{tasteLabel(x, locale)}</Tag>
              ))}
            </div>
          )}
          {entry.notes && (
            <section className="jr-notes">
              <h2 className="cl-eyebrow">{t(S.notes)}</h2>
              <p>{entry.notes}</p>
            </section>
          )}
        </>
      )}

      <section className="jr-advice" aria-labelledby="jr-advice-h" data-testid="advice">
        <h2 id="jr-advice-h">{t(S.nextTitle)}</h2>
        {advice ? (
          <>
            <p className="jr-advice__headline">{t(advice.headline)}</p>
            {advice.target && <p className="jr-advice__target cl-num">{t(advice.target)}</p>}
            <p>{t(advice.reason)}</p>
            <Callout kind="illustrative" locale={locale}>
              {t(advice.caveat)}
            </Callout>
            {advice.change !== 'log-more' && advice.change !== 'check-numbers' && (
              <div className="cl-row">
                {entry.nextChange === adviceText ? (
                  <Tag tone="success" icon="check">
                    {t(S.planned)}
                  </Tag>
                ) : (
                  <Button variant="secondary" size="md" icon="flag" onClick={() => learnerActions.updateJournalEntry(entry.id, { nextChange: adviceText })}>
                    {t(S.planThis)}
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <p>{t(S.noAdvice)}</p>
        )}
        {entry.nextChange && entry.nextChange !== adviceText && (
          <p>
            <strong>{t(S.plan)}:</strong> {entry.nextChange}
          </p>
        )}
      </section>

      {prev && (
        <section className="jr-compare" aria-labelledby="jr-compare-h" data-testid="compare">
          <h2 id="jr-compare-h">{t(S.compareTitle)}</h2>
          {rows.length > 0 && (
            <div className="jr-table-wrap">
              <table className="jr-table">
                <caption className="cl-visually-hidden">{t(S.compareCaption)}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t(S.field)}</th>
                    <th scope="col">{t(S.before)}</th>
                    <th scope="col">{t(S.after)}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.field} data-changed={r.changed}>
                      <th scope="row">{fieldLabel(r.field)}</th>
                      <td>{show(r.before, r.field)}</td>
                      <td>
                        {show(r.after, r.field)} <span className="jr-change">{r.changed ? `● ${t(S.changed)}` : t(S.same)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p>
            {changes === 1 ? t(S.one) : changes > 1 ? t(S.many(changes)) : partial ? '' : t(S.zero)} {partial > 0 && t(S.partial)}
          </p>
          <Link to={`/journal?entry=${encodeURIComponent(prev.id)}`}>{t(S.openPrev)}</Link>
        </section>
      )}

      {later.length > 0 && (
        <section aria-labelledby="jr-later-h">
          <h2 id="jr-later-h" className="cl-eyebrow">
            {t(S.later)}
          </h2>
          <ul className="jr-links">
            {later.map((l) => (
              <li key={l.id}>
                <Link to={`/journal?entry=${encodeURIComponent(l.id)}`}>
                  <time dateTime={l.createdAt}>{formatWhen(l.createdAt, locale)}</time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!editing && (
        <div className="jr-actions">
          <Link className="cl-btn cl-btn--primary cl-btn--lg" to={`/journal?log=1&attemptOf=${encodeURIComponent(entry.id)}`} data-testid="log-another">
            {t(S.another)}
          </Link>
          {guideId && (
            <Link className="cl-btn cl-btn--secondary cl-btn--lg" to={`/practice/${encodeURIComponent(guideId)}`}>
              {t(S.guide)}
            </Link>
          )}
          {ctx.activity?.lessonId && (
            <Link className="cl-btn cl-btn--ghost cl-btn--lg" to={`/learn/${encodeURIComponent(ctx.activity.lessonId)}`}>
              {t(S.toLesson)}
            </Link>
          )}
          <Button variant="ghost" size="lg" icon="sliders" onClick={() => setEditing(true)} data-testid="entry-edit">
            {t(S.edit)}
          </Button>
          <Button variant="ghost" size="lg" icon="x" onClick={() => setConfirmDel(true)} data-testid="entry-delete">
            {t(S.del)}
          </Button>
        </div>
      )}

      <Dialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title={t(S.delTitle)}
        description={t(S.delBody)}
        role="alertdialog"
        size="sm"
        locale={locale}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDel(false)}>
              {t(S.cancel)}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                audio.play('reset');
                doDelete();
              }}
              data-testid="confirm-delete"
            >
              {t(S.del)}
            </Button>
          </>
        }
      />
    </article>
  );
}
