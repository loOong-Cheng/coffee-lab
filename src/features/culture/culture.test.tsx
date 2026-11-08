import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../app/App';
import { places as realPlaces, timeline as realTimeline } from '../../content';
import type { CulturePlace, CultureTimelineEvent } from '../../domain/contracts';
import { createMemoryStorage, getLearnerState, initLearnerStore, learnerActions } from '../../state';
import { CultureExplorer } from './CultureExplorer';

const L = (en: string, zh: string) => ({ en, zh });

const PLACES: CulturePlace[] = [
  {
    id: 'istanbul',
    name: L('Istanbul', '伊斯坦布尔'),
    kind: 'coffeehouse',
    lat: 41.01,
    lon: 28.98,
    summary: L('Early coffeehouses.', '早期咖啡馆。'),
    relatedDrinkIds: ['turkish-coffee', 'not-a-drink'],
    relatedLessonIds: ['cul-coffeehouses'],
    sources: ['atlas-wiki-history', 'unknown-source'],
    confidence: 'verified',
  },
  {
    id: 'kaffa',
    name: L('Kaffa', '卡法'),
    kind: 'origin',
    lat: 7.27,
    lon: 36.23,
    summary: L('Wild arabica.', '野生阿拉比卡。'),
    producing: true,
    relatedDrinkIds: ['ethiopian-buna'],
    relatedLessonIds: [],
    sources: [],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'brazil',
    name: L('Brazil', '巴西'),
    kind: 'producer',
    lat: -21.5,
    lon: -45.4,
    summary: L('Largest producer.', '最大生产国。'),
    producing: true,
    relatedDrinkIds: [],
    relatedLessonIds: [],
    sources: [],
    confidence: 'verified',
  },
];

const EVENTS: CultureTimelineEvent[] = [
  {
    id: 'tl-goats',
    year: 850,
    yearLabel: L('Legend — c. 9th century', '传说——约 9 世纪'),
    title: L('The dancing goats', '跳舞的山羊'),
    body: L('A goatherd story.', '牧羊人的故事。'),
    kind: 'legend',
    placeId: 'kaffa',
    relatedDrinkIds: [],
    relatedLessonIds: ['cul-origins-legends'],
    sources: [],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'tl-istanbul',
    year: 1554,
    yearLabel: L('c. 1554–55', '约 1554—1555 年'),
    title: L('Istanbul’s coffeehouses', '伊斯坦布尔的咖啡馆'),
    body: L('Merchants open coffeehouses.', '商人开设咖啡馆。'),
    kind: 'culture',
    disputed: true,
    placeId: 'istanbul',
    relatedDrinkIds: ['turkish-coffee'],
    relatedLessonIds: [],
    sources: [],
    confidence: 'verified',
  },
  {
    id: 'tl-filter',
    year: 1908,
    yearLabel: L('1908', '1908 年'),
    title: L('Paper filter patented', '纸滤杯专利'),
    body: L('No single place.', '没有固定地点。'),
    kind: 'innovation',
    relatedDrinkIds: [],
    relatedLessonIds: [],
    sources: [],
    confidence: 'verified',
  },
];

function LocationProbe() {
  const loc = useLocation();
  return <output data-testid="loc">{`${loc.pathname}${loc.search}`}</output>;
}

function renderExplorer(initial = '/culture') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/culture" element={<CultureExplorer places={PLACES} timeline={EVENTS} />} />
        <Route path="*" element={<p>elsewhere</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  initLearnerStore(createMemoryStorage());
  act(() => learnerActions.updatePrefs({ locale: 'en', sfx: false, music: false, musicMood: 'cafe' }));
});

describe('Culture Explorer (fixture data)', () => {
  it('selecting a place in the list opens its detail with resolved links, honesty badges and sources', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.click(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByTestId('loc')).toHaveTextContent('view=list');
    await user.click(screen.getByTestId('list-place-istanbul'));

    const detail = screen.getByTestId('culture-detail');
    expect(within(detail).getByRole('heading', { level: 3, name: 'Istanbul' })).toHaveFocus();
    expect(screen.getByTestId('list-place-istanbul')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('loc')).toHaveTextContent('place=istanbul');
    // Related drink resolves; the unknown id is dropped (no dead link)
    const drinks = within(detail).getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/atlas/'));
    expect(drinks.map((a) => a.getAttribute('href'))).toEqual(['/atlas/turkish-coffee']);
    expect(within(detail).getByRole('link', { name: /coffeehouse/i })).toHaveAttribute('href', '/learn/cul-coffeehouses');
    expect(within(detail).getByText('Well documented')).toBeInTheDocument();
    expect(within(detail).getByText('Sources (1)')).toBeInTheDocument();
    // Its timeline moment is listed with the disputed badge
    expect(within(screen.getByTestId('detail-event-tl-istanbul')).getByText('Dates disputed')).toBeInTheDocument();
  });

  it('selecting a map marker opens the detail; close returns to the intro', async () => {
    const user = userEvent.setup();
    renderExplorer();
    const map = screen.getByTestId('culture-map');
    await user.click(within(map).getByRole('button', { name: /Kaffa, Origin/ }));
    const detail = screen.getByTestId('culture-detail');
    expect(within(detail).getByRole('heading', { name: 'Kaffa' })).toBeInTheDocument();
    expect(within(detail).getByText('Commonly told')).toBeInTheDocument();
    expect(within(detail).getByText('Coffee is grown here')).toBeInTheDocument();
    await user.click(screen.getByTestId('culture-detail-close'));
    expect(screen.queryByTestId('culture-detail')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pick a place' })).toBeInTheDocument();
  });

  it('place-kind filter hides markers and never allows an empty map', async () => {
    const user = userEvent.setup();
    renderExplorer();
    const map = screen.getByTestId('culture-map');
    expect(within(map).getAllByRole('button', { pressed: false }).filter((b) => b.dataset.placeId)).toHaveLength(3);
    await user.click(screen.getByTestId('place-kind-origin'));
    expect(within(map).queryByTestId('map-pin-kaffa')).not.toBeInTheDocument();
    expect(screen.getByTestId('loc')).toHaveTextContent('kinds=producer%2Cdrink-culture%2Ccoffeehouse');
    // turn everything else off: the last kind stays on
    await user.click(screen.getByTestId('place-kind-producer'));
    await user.click(screen.getByTestId('place-kind-drink-culture'));
    await user.click(screen.getByTestId('place-kind-coffeehouse'));
    expect(screen.getByTestId('place-kind-coffeehouse')).toHaveAttribute('aria-pressed', 'true');
    expect(within(map).getByTestId('map-pin-istanbul')).toBeInTheDocument();
  });

  it('map zoom/pan buttons work and are disabled at their limits', async () => {
    const user = userEvent.setup();
    renderExplorer();
    const zoomOut = screen.getByRole('button', { name: 'Zoom out' });
    const west = screen.getByRole('button', { name: 'Move west' });
    expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
    expect(west).toHaveAttribute('aria-disabled', 'true');
    await user.click(zoomOut); // no-op at the limit, focus stays
    expect(screen.getByText(/Zoom 1×/)).toBeInTheDocument();
    expect(screen.getByText(/Zoom 1×/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText(/Zoom 2×/)).toBeInTheDocument();
    expect(zoomOut).not.toHaveAttribute('aria-disabled');
    expect(west).not.toHaveAttribute('aria-disabled');
    await user.click(west);
    await user.click(screen.getByRole('button', { name: 'Reset map' }));
    expect(screen.getByText(/Zoom 1×/)).toBeInTheDocument();
    // keyboard on the controls: + zooms, arrows pan; focus stays on the control
    const zoomIn = screen.getByRole('button', { name: 'Zoom in' });
    zoomIn.focus();
    await user.keyboard('+');
    expect(screen.getByText(/Zoom 2×/)).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(zoomIn).toHaveFocus();
  });

  it('timeline: legend and disputed badges are textual; kind filter works; show-on-map selects the place', async () => {
    const user = userEvent.setup();
    renderExplorer();
    const tl = screen.getByTestId('culture-timeline');
    const goats = within(tl).getByTestId('tl-event-tl-goats');
    expect(within(goats).getByTestId('legend-badge')).toHaveTextContent('Legend');
    expect(within(goats).getByText(/not documented history/)).toBeInTheDocument();
    expect(within(within(tl).getByTestId('tl-event-tl-istanbul')).getByTestId('disputed-badge')).toHaveTextContent('Dates disputed');
    // event without a place: no map button, no crash
    expect(within(within(tl).getByTestId('tl-event-tl-filter')).queryByRole('button')).not.toBeInTheDocument();
    // chronological
    expect(within(tl).getAllByRole('article').map((a) => a.dataset.testid)).toEqual(['tl-event-tl-goats', 'tl-event-tl-istanbul', 'tl-event-tl-filter']);

    expect(screen.getByTestId('tl-count')).toHaveTextContent('Showing 3 of 3 events');
    await user.click(screen.getByTestId('tl-kind-legend'));
    expect(screen.getByTestId('tl-count')).toHaveTextContent('Showing 2 of 3 events');
    expect(screen.queryByTestId('tl-event-tl-goats')).not.toBeInTheDocument();
    expect(screen.getByTestId('loc')).toHaveTextContent('tk=history%2Cinnovation%2Cculture');

    await user.click(screen.getByTestId('tl-show-tl-istanbul'));
    expect(within(screen.getByTestId('culture-detail')).getByRole('heading', { name: 'Istanbul' })).toHaveFocus();
  });

  it('detail → timeline moment re-enables a hidden kind and focuses the event', async () => {
    const user = userEvent.setup();
    renderExplorer('/culture?place=kaffa&tk=history');
    expect(screen.queryByTestId('tl-event-tl-goats')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('detail-event-tl-goats'));
    expect(screen.getByTestId('tl-event-tl-goats')).toHaveFocus();
  });

  it('“Listen while you explore” sets the culture mood and turns music on only when clicked', async () => {
    const user = userEvent.setup();
    renderExplorer('/culture?place=brazil');
    expect(getLearnerState().prefs.music).toBe(false);
    const detail = screen.getByTestId('culture-detail');
    expect(within(detail).getByText('Brazil · Bossa')).toBeInTheDocument();
    await user.click(screen.getByTestId('culture-listen'));
    expect(getLearnerState().prefs).toMatchObject({ music: true, musicMood: 'bossa' });
    expect(screen.getByTestId('culture-listen')).toHaveTextContent('Stop the music');
    await user.click(screen.getByTestId('culture-listen'));
    expect(getLearnerState().prefs.music).toBe(false);
  });

  it('a place without a culture mood offers café jazz and says so', () => {
    renderExplorer('/culture?place=istanbul');
    expect(screen.getByText(/No mood is tied to this region yet/)).toBeInTheDocument();
  });

  it('unknown ?place shows a clear, recoverable message', async () => {
    const user = userEvent.setup();
    renderExplorer('/culture?place=atlantis');
    expect(screen.getByText(/isn’t on the map/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close details' }));
    expect(screen.queryByText(/isn’t on the map/)).not.toBeInTheDocument();
  });
});

describe('/culture route (real content)', () => {
  it('renders the explorer with every place and event, in zh too', async () => {
    window.location.hash = '#/culture?view=list';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Coffee Culture Explorer' })).toBeInTheDocument();
    const list = screen.getByTestId('culture-list');
    expect(within(list).getAllByRole('button')).toHaveLength(realPlaces.length);
    expect(within(screen.getByTestId('culture-timeline')).getAllByRole('article')).toHaveLength(realTimeline.length);
    act(() => learnerActions.updatePrefs({ locale: 'zh' }));
    expect(await screen.findByRole('heading', { level: 1, name: '咖啡文化探索' })).toBeInTheDocument();
    expect(screen.getAllByText('传说').length).toBeGreaterThan(0);
  });
});
