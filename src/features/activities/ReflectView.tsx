import { useId, useState } from 'react';
import type { ReflectActivity } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { S } from './strings';
import type { ActivityProps } from './types';

/** Optional free-text reflection; saved as the event's notes (self-reported, on this device only). */
export function ReflectView({ activity, onComplete }: ActivityProps<ReflectActivity>) {
  const { t } = useI18n();
  const base = useId();
  const [answers, setAnswers] = useState<string[]>(() => activity.prompts.map(() => ''));
  const hasText = answers.some((a) => a.trim().length > 0);

  const save = () => {
    const notes = activity.prompts
      .map((p, i) => ({ q: t(p), a: answers[i]?.trim() ?? '' }))
      .filter((x) => x.a)
      .map((x) => `${x.q}\n${x.a}`)
      .join('\n\n');
    onComplete({ outcome: 'completed', notes });
  };

  return (
    <form
      className="act act-reflect"
      onSubmit={(e) => {
        e.preventDefault();
        if (hasText) save();
      }}
    >
      <p className="cl-muted act-reflect__note">{t(S.reflectNote)}</p>
      {activity.prompts.map((p, i) => (
        <div className="act-field" key={i}>
          <label htmlFor={`${base}-${i}`} className="act-field__label">
            {t(p)}
          </label>
          <textarea
            id={`${base}-${i}`}
            className="act-textarea"
            rows={3}
            value={answers[i]}
            onChange={(e) => setAnswers((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))}
          />
        </div>
      ))}
      <div className="act-finish">
        <Button variant="ghost" onClick={() => onComplete({ outcome: 'skipped' })} data-testid="reflect-skip">
          {t(S.skipReflection)}
        </Button>
        <Button type="submit" icon="journal" disabled={!hasText} data-testid="reflect-save">
          {t(S.saveReflection)}
        </Button>
      </div>
    </form>
  );
}
