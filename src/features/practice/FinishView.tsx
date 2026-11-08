/** After the last step: honest completion summary, then the brew log (fields per plan.logFields). */
import { Link } from 'react-router';
import { useI18n } from '../../i18n';
import { Button, EvidenceBadge, Illustration } from '../../ui';
import { BrewLogForm, type BrewSubmitMeta, type BrewValues } from '../journal/BrewLogForm';
import type { MeasuredTime } from './measured';
import type { PracticePlan } from './plan';
import type { StepTally } from './session';

const S = {
  title: { zh: '所有步骤都确认了！', en: 'All steps confirmed!' },
  tally: (t: StepTally) => ({
    zh: `你确认完成了 ${t.done}/${t.total} 步${t.skipped ? `，跳过 ${t.skipped} 步` : ''}。`,
    en: `You confirmed ${t.done} of ${t.total} steps${t.skipped ? `, skipped ${t.skipped}` : ''}.`,
  }),
  log: { zh: '记录这一杯', en: 'Log this brew' },
  logLead: {
    zh: '记下你实际看到和尝到的。不知道的就留空——应用不会替你填任何数值。',
    en: 'Note what you actually saw and tasted. Leave unknowns blank — the app never fills in values for you.',
  },
  logLeadCarried: {
    zh: '记下你实际看到和尝到的。不知道的就留空。只有你选择带过来的计时已经填好（标注“应用计时”）——其余都由你填写。',
    en: 'Note what you actually saw and tasted. Leave unknowns blank. Only the time you chose to carry over is filled in (marked “Timed in app”) — everything else is yours to enter.',
  },
  save: { zh: '保存到我的日志', en: 'Save to my journal' },
  skip: { zh: '这次不记录', en: 'Skip the log' },
  back: { zh: '回到最后一步', en: 'Back to the last step' },
  doneTitle: { zh: '练习完成', en: 'Practice complete' },
  doneBody: { zh: '已作为“自我报告”的练习记入你的学习记录。', en: 'Added to your learning record as a self-reported practice.' },
  toLesson: { zh: '回到课程', en: 'Back to the lesson' },
  toDrink: { zh: '回到这款饮品', en: 'Back to this drink' },
  again: { zh: '再做一次', en: 'Do it again' },
  journal: { zh: '打开日志', en: 'Open journal' },
};

export interface FinishViewProps {
  plan: PracticePlan;
  tally: StepTally;
  measuredTime: MeasuredTime | null;
  onSave(v: BrewValues, meta: BrewSubmitMeta): void;
  onSkip(): void;
  onBack(): void;
}

export function FinishView({ plan, tally, measuredTime, onSave, onSkip, onBack }: FinishViewProps) {
  const { t, locale } = useI18n();
  return (
    <div className="kp-finish" data-testid="practice-finish">
      <header className="kp-finish__head">
        <div className="kp-finish__art" aria-hidden="true">
          <Illustration name="cup" />
        </div>
        <div>
          <h1 id="page-title" className="kp-title" tabIndex={-1}>
            {t(S.title)}
          </h1>
          <p>{t(S.tally(tally))}</p>
          <EvidenceBadge kind="self_report" locale={locale} showDetail />
        </div>
      </header>

      <section className="kp-section" aria-labelledby="kp-log-h">
        <h2 id="kp-log-h">{t(S.log)}</h2>
        <p className="cl-muted">{t(measuredTime?.prefill && plan.logFields.includes('timeSec') ? S.logLeadCarried : S.logLead)}</p>
        <BrewLogForm
          fields={plan.logFields}
          brewKind={plan.brewKind}
          measuredTime={measuredTime}
          submitLabel={t(S.save)}
          onSubmit={onSave}
          secondary={
            <>
              <Button variant="secondary" size="lg" onClick={onSkip} data-testid="log-skip">
                {t(S.skip)}
              </Button>
              <Button variant="ghost" size="lg" icon="back" onClick={onBack}>
                {t(S.back)}
              </Button>
            </>
          }
        />
      </section>
    </div>
  );
}

export function PracticeDone({ plan, onAgain }: { plan: PracticePlan; onAgain(): void }) {
  const { t, locale } = useI18n();
  return (
    <div className="kp-finish" data-testid="practice-done">
      <header className="kp-finish__head">
        <div className="kp-finish__art" aria-hidden="true">
          <Illustration name="cup" />
        </div>
        <div>
          <h1 id="page-title" className="kp-title" tabIndex={-1}>
            {t(S.doneTitle)}
          </h1>
          <p>{t(S.doneBody)}</p>
          <EvidenceBadge kind="self_report" locale={locale} />
        </div>
      </header>
      <div className="cl-row">
        {plan.lessonId && (
          <Link className="cl-btn cl-btn--primary cl-btn--lg" to={`/learn/${encodeURIComponent(plan.lessonId)}`}>
            {t(S.toLesson)}
          </Link>
        )}
        {plan.source === 'drink' && (
          <Link className="cl-btn cl-btn--primary cl-btn--lg" to={`/atlas/${encodeURIComponent(plan.drinkId)}`}>
            {t(S.toDrink)}
          </Link>
        )}
        <Button variant="secondary" size="lg" icon="repeat" onClick={onAgain}>
          {t(S.again)}
        </Button>
        <Link className="cl-btn cl-btn--ghost cl-btn--lg" to="/journal">
          {t(S.journal)}
        </Link>
      </div>
    </div>
  );
}
