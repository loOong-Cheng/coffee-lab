/** End-of-shift summary: what went right, what to review, where to learn more. */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { getDrink, getLesson } from '../../content';
import { useI18n } from '../../i18n';
import { Button, Icon, Tag } from '../../ui';
import { LEVEL_ORDER, type CafeLevelId, type Component } from './model';
import { COMPONENT_TEXT, LEVEL_TEXT, S } from './strings';

export interface OrderRecord {
  drinkId: string;
  attempts: number;
  firstScore: number;
  /** Components that were off on the FIRST serve (what to review). */
  firstDiffs: Component[];
  correct: boolean;
  /** Relaxed timer only: served correctly before it ran out. */
  inPace?: boolean;
}

export interface SummaryProps {
  level: CafeLevelId;
  records: OrderRecord[];
  newlyMastered: string[];
  timerOn: boolean;
  onAnother(): void;
  onNextLevel(l: CafeLevelId): void;
  onExit(): void;
}

export function Summary({ level, records, newlyMastered, timerOn, onAnother, onNextLevel, onExit }: SummaryProps) {
  const { t } = useI18n();
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus(), []);

  const firstTry = records.filter((r) => r.attempts >= 1 && r.firstScore === 1).length;
  const fixed = records.filter((r) => r.correct && r.firstScore < 1).length;
  const missed = records.filter((r) => !r.correct).length;
  const inPace = records.filter((r) => r.inPace).length;
  const nextLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1];
  const reviewItems = records.filter((r) => r.firstDiffs.length > 0);
  const drinkName = (id: string) => {
    const d = getDrink(id);
    return d ? t(d.name) : id;
  };

  return (
    <section className="cafe-summary" data-testid="cafe-summary" aria-labelledby="cafe-summary-h">
      <header className="cafe-summary__head">
        <p className="cl-eyebrow">{t(LEVEL_TEXT[level].title)}</p>
        <h2 id="cafe-summary-h" ref={headRef} tabIndex={-1} className="cafe-h2">
          {t(S.shiftDone)}
        </h2>
      </header>

      <dl className="cafe-stats">
        <div>
          <dt>{t(S.firstTry)}</dt>
          <dd className="cl-num" data-testid="cafe-first-try">
            {firstTry}/{records.length}
          </dd>
        </div>
        <div>
          <dt>{t(S.fixed)}</dt>
          <dd className="cl-num">{fixed}</dd>
        </div>
        <div>
          <dt>{t(S.notFixed)}</dt>
          <dd className="cl-num">{missed}</dd>
        </div>
        {timerOn && (
          <div>
            <dt>{t(S.inPace)}</dt>
            <dd className="cl-num">
              {inPace}/{records.length}
            </dd>
          </div>
        )}
      </dl>
      <p className="cafe-small cl-muted">{t(S.honesty)}</p>

      {newlyMastered.length > 0 && (
        <div className="cafe-new" data-testid="cafe-newly-mastered">
          <Icon name="star" size={20} />
          <p>
            <strong>{t(S.newlyMastered)}:</strong> {newlyMastered.map(drinkName).join(t({ zh: '、', en: ', ' }))}
          </p>
        </div>
      )}

      <h3 className="cafe-h3">{t(S.review)}</h3>
      {reviewItems.length === 0 && <p>{t(S.noReview)}</p>}
      <ol className="cafe-results">
        {records.map((r, i) => {
          const d = getDrink(r.drinkId);
          const lesson = d?.relatedLessonIds.map((id) => getLesson(id)).find(Boolean);
          const result = r.correct ? (r.firstScore === 1 ? S.resultCorrect : S.resultFixed) : S.resultMissed;
          return (
            <li key={`${r.drinkId}-${i}`} className="cafe-result" data-drink={r.drinkId} data-correct={r.correct}>
              <div className="cafe-result__head">
                <span className="cafe-result__name">{drinkName(r.drinkId)}</span>
                <Tag tone={r.correct ? 'success' : 'warning'} icon={r.correct ? 'check' : 'target'}>
                  {t(result)}
                </Tag>
                <span className="cafe-small cl-muted">{t(S.attempts(r.attempts))}</span>
              </div>
              {r.firstDiffs.length > 0 && (
                <p className="cafe-result__diffs">{r.firstDiffs.map((c) => t(COMPONENT_TEXT[c])).join(t({ zh: '、', en: ', ' }))}</p>
              )}
              <p className="cafe-result__links">
                <Link to={`/atlas/${encodeURIComponent(r.drinkId)}`}>
                  <Icon name="map" size={16} /> {t(S.atlasLink)}
                </Link>
                {lesson && (
                  <Link to={`/learn/${encodeURIComponent(lesson.id)}`}>
                    <Icon name="book" size={16} /> {t(lesson.title)}
                  </Link>
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="cafe-summary__actions">
        <Button icon="repeat" onClick={onAnother} data-testid="cafe-another">
          {t(S.anotherShift)}
        </Button>
        {nextLevel && (
          <Button variant="secondary" iconEnd="next" onClick={() => onNextLevel(nextLevel)} data-testid="cafe-next-level">
            {t(S.nextShift(t(LEVEL_TEXT[nextLevel].title)))}
          </Button>
        )}
        <Button variant="ghost" icon="back" onClick={onExit} data-testid="cafe-back">
          {t(S.backToCounter)}
        </Button>
      </div>
    </section>
  );
}
