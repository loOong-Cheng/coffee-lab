/** Order ticket + recipe card. */
import { forwardRef } from 'react';
import type { DrinkRecipe, LocalizedText } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui';
import { CupView } from './CupView';
import type { CompleteBuild } from './model';
import type { BuildSpec, Customer } from './specs';
import {
  CUP_SUB,
  CUP_TEXT,
  ICE_TEXT,
  METHOD_TEXT,
  MILK_TEXT,
  S,
  SHOTS_TEXT,
  SHOT_STYLE_TEXT,
  STATION_TEXT,
  WATER_TEXT,
  extrasText,
  milkMlText,
  waterMlText,
} from './strings';

/** First sentence of a culture note (full note appears after serving). */
export function firstSentence(text: string): string {
  const m = text.match(/^[\s\S]*?[。！？]|^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : text).trim();
}

export function Avatar({ customer, size = 48 }: { customer: Customer; size?: number }) {
  const { t } = useI18n();
  const initial = Array.from(t(customer.name))[0] ?? '?';
  return (
    <span className="cafe-avatar" data-tone={customer.tone} style={{ width: size, height: size }} aria-hidden="true">
      {initial}
    </span>
  );
}

export interface TicketProps {
  customer: Customer;
  line: LocalizedText;
  drink: DrinkRecipe;
  spec: BuildSpec;
  /** Shown above the ticket, e.g. "Customer 2 of 5". */
  counter: string;
}

export const Ticket = forwardRef<HTMLHeadingElement, TicketProps>(function Ticket({ customer, line, drink, spec, counter }, ref) {
  const { t } = useI18n();
  return (
    <article className="cafe-ticket" data-testid="cafe-ticket" data-drink={drink.id} aria-labelledby="cafe-ticket-h">
      <p className="cafe-ticket__eyebrow cl-eyebrow">
        {t(S.ticket)} · {counter}
      </p>
      <div className="cafe-ticket__who">
        <Avatar customer={customer} />
        <div>
          <h2 id="cafe-ticket-h" ref={ref} tabIndex={-1} className="cafe-ticket__drink">
            {t(drink.name)}
          </h2>
          <p className="cafe-ticket__name">{t(customer.name)}</p>
        </div>
      </div>
      <blockquote className="cafe-ticket__quote">
        <p>
          “{t(line)}
          {spec.orderNote ? ` ${t(spec.orderNote)}` : ''}”
        </p>
      </blockquote>
      <p className="cafe-ticket__culture">
        <Icon name="globe" size={16} />
        <span>
          <span className="cl-visually-hidden">{t(S.cultureLine)}: </span>
          {firstSentence(t(drink.cultureNote))}
        </span>
      </p>
    </article>
  );
});

export function recipeRows(b: CompleteBuild): Array<{ key: string; name: LocalizedText; value: LocalizedText }> {
  const rows: Array<{ key: string; name: LocalizedText; value: LocalizedText }> = [];
  const join = (a: LocalizedText, c: LocalizedText): LocalizedText => ({ zh: `${a.zh} · ${c.zh}`, en: `${a.en} · ${c.en}` });
  rows.push({ key: 'method', name: STATION_TEXT.method.name, value: METHOD_TEXT[b.method] });
  if (b.method === 'espresso') {
    rows.push({ key: 'shots', name: STATION_TEXT.shots.name, value: join(SHOTS_TEXT[b.shots], join(SHOT_STYLE_TEXT[b.shotStyle].label, SHOT_STYLE_TEXT[b.shotStyle].sub)) });
  }
  rows.push({ key: 'water', name: STATION_TEXT.water.name, value: b.water === 'none' ? WATER_TEXT.none : join(WATER_TEXT[b.water], waterMlText(b.waterMl)) });
  rows.push({ key: 'milk', name: STATION_TEXT.milk.name, value: b.milk === 'none' ? MILK_TEXT.none.label : join(MILK_TEXT[b.milk].label, milkMlText(b.milkMl)) });
  rows.push({ key: 'ice', name: STATION_TEXT.ice.name, value: b.ice ? ICE_TEXT.yes : ICE_TEXT.no });
  rows.push({ key: 'extras', name: STATION_TEXT.extras.name, value: extrasText(b.extras) });
  rows.push({ key: 'cup', name: STATION_TEXT.cup.name, value: join(CUP_TEXT[b.cup], CUP_SUB[b.cup]) });
  return rows;
}

export function RecipeCard({ spec, drink }: { spec: BuildSpec; drink: DrinkRecipe }) {
  const { t, locale } = useI18n();
  return (
    <section className="cafe-recipe" aria-labelledby="cafe-recipe-h" data-testid="cafe-recipe">
      <h3 id="cafe-recipe-h" className="cafe-recipe__title">
        <Icon name="clipboard-check" size={18} /> {t(S.recipeCard)} · {t(drink.name)}
      </h3>
      <div className="cafe-recipe__body">
        <CupView build={spec.canonical} locale={locale} size={96} className="cafe-recipe__cup" label={t(S.theOrder)} />
        <dl className="cafe-recipe__rows">
          {recipeRows(spec.canonical).map((r) => (
            <div key={r.key}>
              <dt>{t(r.name)}</dt>
              <dd>{t(r.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="cafe-recipe__key">
        <strong>{t(S.keyPoint)}:</strong> {t(spec.keyPoint)}
      </p>
      <p className="cafe-small cl-muted">{t(S.versionsShort)}</p>
    </section>
  );
}
