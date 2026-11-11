import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { brands, type Brand } from '../../content';
import { createMemoryStorage, initLearnerStore, learnerActions } from '../../state';
import { DrinkBrands } from './DrinkBrands';
import BrandsPage from './index';
import { brandsForDrink, filterBrands, groupByKind, isBrandKind, KIND_ORDER } from './model';

const mk = (id: string, kind: Brand['kind'], zh: string, en: string, drinks: string[] = []): Brand => ({
  id,
  kind,
  name: { zh, en },
  country: { zh: '某国', en: 'Somewhere' },
  knownFor: { zh: '某事', en: 'Something' },
  signature: [],
  learnFromIt: { zh: '学点', en: 'Learn' },
  relatedDrinkIds: drinks,
  relatedEquipmentIds: [],
  relatedLessonIds: [],
  asOf: 2026,
  sources: [],
  confidence: 'verified',
});

const FIX: Brand[] = [
  mk('a', 'cafe-chain', '星巴克 Starbucks', 'Starbucks', ['caffe-latte', 'cappuccino']),
  mk('b', 'roaster', '蓝瓶咖啡', 'Blue Bottle', ['pourover-cone']),
  mk('c', 'equipment', '哈里欧 HARIO', 'Hario', ['pourover-cone', 'caffe-latte']),
];

describe('brands model', () => {
  it('filters by kind', () => {
    expect(filterBrands(FIX, { kind: 'roaster', query: '' }).map((b) => b.id)).toEqual(['b']);
    expect(filterBrands(FIX, { kind: 'all', query: '' })).toHaveLength(3);
  });
  it('searches zh and en names case-insensitively, combined with kind', () => {
    expect(filterBrands(FIX, { kind: 'all', query: '蓝瓶' }).map((b) => b.id)).toEqual(['b']);
    expect(filterBrands(FIX, { kind: 'all', query: '  blue BOTTLE ' }).map((b) => b.id)).toEqual(['b']);
    expect(filterBrands(FIX, { kind: 'cafe-chain', query: 'hario' })).toEqual([]);
    expect(filterBrands(FIX, { kind: 'all', query: 'zzz' })).toEqual([]);
  });
  it('groups by kind in canonical order and skips empty groups', () => {
    expect(groupByKind([FIX[2], FIX[0]]).map((g) => g.kind)).toEqual(['cafe-chain', 'equipment']);
    expect(isBrandKind('roaster')).toBe(true);
    expect(isBrandKind('nope')).toBe(false);
  });
  it('reverse-looks-up brands by drink id', () => {
    expect(brandsForDrink(FIX, 'caffe-latte').map((b) => b.id)).toEqual(['a', 'c']);
    expect(brandsForDrink(FIX, 'turkish-coffee')).toEqual([]);
  });
  it('real content: every kind is present and every brand is findable by both names', () => {
    for (const k of KIND_ORDER) expect(brands.some((b) => b.kind === k)).toBe(true);
    for (const b of brands) {
      expect(filterBrands(brands, { kind: 'all', query: b.name.en })).toContain(b);
      expect(filterBrands(brands, { kind: 'all', query: b.name.zh })).toContain(b);
    }
  });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/brands/:brandId" element={<BrandsPage />} />
        <Route path="/drink/:id" element={<DrinkBrands drinkId="caffe-latte" />} />
        <Route path="/none" element={<DrinkBrands drinkId="no-such-drink" />} />
        <Route path="*" element={<p>elsewhere</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  initLearnerStore(createMemoryStorage());
  act(() => learnerActions.updatePrefs({ locale: 'en', sfx: false, music: false }));
});

describe('Brands pages', () => {
  it('list: kind filter + search narrow the cards and the count; empty state clears', async () => {
    const user = userEvent.setup();
    renderAt('/brands');
    expect(screen.getByRole('heading', { level: 1, name: 'Coffee Brands' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(brands.length);

    await user.click(screen.getByTestId('brands-kind-equipment'));
    const eq = brands.filter((b) => b.kind === 'equipment').length;
    expect(screen.getAllByRole('article')).toHaveLength(eq);
    expect(screen.getByTestId('brands-count')).toHaveTextContent(`Showing ${eq} of ${brands.length} brands`);

    await user.type(screen.getByTestId('brands-search'), 'zzzz');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText('No brands match')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
    expect(screen.getAllByRole('article')).toHaveLength(brands.length);

    await user.type(screen.getByTestId('brands-search'), '星巴克');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByTestId('brand-card-starbucks')).toBeInTheDocument();
  });

  it('detail: shows learn section, safety note, disclaimer and asOf; unknown id is a friendly not-found', () => {
    const withSafety = brands.find((b) => b.safetyNote)!;
    const { unmount } = renderAt(`/brands/${withSafety.id}`);
    expect(screen.getByRole('heading', { level: 1, name: withSafety.name.en })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What a beginner can learn' })).toBeInTheDocument();
    expect(within(screen.getByTestId('brand-safety')).getByText(withSafety.safetyNote!.en)).toBeInTheDocument();
    expect(screen.getByTestId('brand-asof')).toHaveTextContent(`Checked in ${withSafety.asOf}`);
    expect(screen.getByTestId('brand-disclaimer')).toHaveTextContent(/not affiliated/);
    unmount();
    renderAt('/brands/no-such-brand');
    expect(screen.getByTestId('brand-not-found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← All brands' })).toHaveAttribute('href', '/brands');
  });

  it('drink detail section lists brands via reverse lookup and is absent when none', () => {
    const { unmount } = renderAt('/drink/x');
    const section = screen.getByTestId('drink-brands');
    const expected = brandsForDrink(brands, 'caffe-latte');
    expect(expected.length).toBeGreaterThan(0);
    expect(within(section).getAllByRole('link')).toHaveLength(expected.length);
    unmount();
    renderAt('/none');
    expect(screen.queryByTestId('drink-brands')).not.toBeInTheDocument();
  });
});
