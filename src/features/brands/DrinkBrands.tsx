/** "Brands known for this" on an Atlas drink detail: reverse lookup of Brand.relatedDrinkIds. Renders nothing when empty. */
import { Link } from 'react-router';
import { brands } from '../../content';
import { useI18n } from '../../i18n';
import { brandsForDrink } from './model';
import { S } from './strings';
import './brandsEntry.css';

export function DrinkBrands({ drinkId }: { drinkId: string }) {
  const { t } = useI18n();
  const list = brandsForDrink(brands, drinkId);
  if (list.length === 0) return null;
  return (
    <section className="br-drink" aria-labelledby="br-drink-h" data-testid="drink-brands">
      <h2 id="br-drink-h">{t(S.drinkBrandsH)}</h2>
      <ul>
        {list.map((b) => (
          <li key={b.id}>
            <Link to={`/brands/${encodeURIComponent(b.id)}`} data-testid={`drink-brand-${b.id}`}>
              {t(b.name)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
