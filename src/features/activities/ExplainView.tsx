import { useEffect, useRef, useState } from 'react';
import type { ExplainActivity } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { ActivityArt } from './ActivityArt';
import { sfx } from './shared';
import { S } from './strings';
import type { ActivityProps } from './types';

/** Illustrated concept cards, paged one at a time (←/→ page through cards before moving on). */
export function ExplainView({ activity, onComplete, keyNavRef }: ActivityProps<ExplainActivity>) {
  const { t, locale } = useI18n();
  const cards = activity.cards;
  const [index, setIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const last = index >= cards.length - 1;

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(cards.length - 1, next));
    if (clamped === index) return false;
    moved.current = true;
    setIndex(clamped);
    sfx('tap');
    return true;
  };

  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (!keyNavRef) return;
    keyNavRef.current = (dir) => go(index + dir);
    return () => {
      keyNavRef.current = null;
    };
  });

  if (cards.length === 0) {
    return (
      <div className="act act-explain">
        <Button onClick={() => onComplete({ outcome: 'completed' })}>{t(S.continue)}</Button>
      </div>
    );
  }

  const card = cards[index]!;
  return (
    <div className="act act-explain" data-testid="activity-explain">
      <article className="act-explain__card" aria-roledescription={locale === 'zh' ? '卡片' : 'card'}>
        <ActivityArt name={card.illustration} className="act-explain__art" />
        <div className="act-explain__text">
          <p className="cl-eyebrow" aria-live="polite">
            {t(S.card(index + 1, cards.length))}
          </p>
          <h3 ref={headingRef} tabIndex={-1} className="act-explain__heading">
            {t(card.heading)}
          </h3>
          <p className="act-explain__body">{t(card.body)}</p>
          {card.callout && (
            <Callout kind={card.callout.kind} locale={locale}>
              {t(card.callout.text)}
            </Callout>
          )}
        </div>
      </article>
      <div className="act-explain__dots" aria-hidden="true">
        {cards.map((_, i) => (
          <span key={i} className="act-dot" data-state={i < index ? 'done' : i === index ? 'current' : 'todo'} />
        ))}
      </div>
      <div className="act-explain__nav">
        <Button variant="secondary" icon="back" onClick={() => go(index - 1)} disabled={index === 0}>
          {t(S.prevCard)}
        </Button>
        {last ? (
          <Button iconEnd="check" onClick={() => onComplete({ outcome: 'completed' })} data-testid="activity-continue">
            {t(S.gotIt)}
          </Button>
        ) : (
          <Button iconEnd="next" onClick={() => go(index + 1)} data-testid="explain-next">
            {t(S.nextCard)}
          </Button>
        )}
      </div>
    </div>
  );
}
