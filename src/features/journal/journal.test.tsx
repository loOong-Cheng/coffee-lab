import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrewLogEntry } from '../../domain/contracts';
import { getLearnerState, initLearnerStore, learnerActions } from '../../state';
import JournalPage from './index';
import { LEGACY_TIME_SOURCE_KEY } from './timeSource';

function renderJournal(path = '/journal') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/journal" element={<JournalPage />} />
        <Route path="*" element={<p>elsewhere</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function log(at: string, v: Partial<BrewLogEntry>): BrewLogEntry {
  vi.setSystemTime(new Date(at));
  let e!: BrewLogEntry;
  act(() => {
    e = learnerActions.addJournalEntry({ drinkId: 'espresso-shot', ...v });
  });
  return e;
}

describe('journal dial-in chart', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    localStorage.removeItem(LEGACY_TIME_SOURCE_KEY);
    initLearnerStore();
    act(() => learnerActions.updatePrefs({ locale: 'en' }));
  });
  afterEach(() => vi.useRealTimers());

  it('empty state with fewer than two plottable attempts', () => {
    log('2026-11-01T08:00:00Z', { doseG: 18, outG: 36, timeSec: 27 });
    log('2026-11-02T08:00:00Z', { doseG: 18, outG: 36 }); // no time
    renderJournal();
    const empty = screen.getByTestId('dialin-empty');
    expect(empty).toHaveTextContent('One more attempt and your dial-in path appears');
    expect(empty).toHaveTextContent('Plottable so far: 1');
    expect(screen.queryByTestId('dialin-svg')).toBeNull();
  });

  it('plots attempts in order with the latest highlighted, an illustrative zone, a table alternative, and tap → entry', () => {
    const a = log('2026-11-01T08:00:00Z', { doseG: 18, outG: 40, timeSec: 19, tasteTags: ['sour'] });
    log('2026-11-02T08:00:00Z', { doseG: 18, outG: 36, timeSec: 27 });
    log('2026-11-03T08:00:00Z', { doseG: 18, outG: 34, timeSec: 31, timeSource: 'app-timer' });
    log('2026-11-03T09:00:00Z', { doseG: 18, outG: 30 }); // not plotted
    renderJournal();

    const chart = screen.getByTestId('dialin');
    expect(within(chart).getByRole('heading', { name: 'Dial-in path: Espresso' })).toBeInTheDocument();
    expect(screen.getByTestId('dialin-zone')).toBeInTheDocument();
    expect(chart).toHaveTextContent('Common starting zone (illustrative): about 1:1.5–1:2.5 in 25–35 s');
    expect(chart).toHaveTextContent('3 attempts plotted, joined oldest to newest. Latest: 31 s at 1:1.9.');
    expect(chart).toHaveTextContent('1 more cup missing time or dose/output — not plotted');
    const latest = screen.getByTestId('dialin-point-3');
    expect(latest).toHaveClass('is-latest');
    expect(latest).toHaveAttribute('aria-label', expect.stringContaining('Attempt 3 (latest): 31 s, 1:1.9'));
    expect(screen.getByTestId('dialin-point-1')).not.toHaveClass('is-latest');

    // Table alternative (hidden until asked for).
    expect(screen.queryByTestId('dialin-table')).toBeNull();
    const toggle = screen.getByTestId('dialin-table-toggle');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const table = screen.getByTestId('dialin-table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByRole('row', { name: /Attempt 3/ })).toHaveTextContent('Timed in app');
    expect(within(table).getByRole('row', { name: /Attempt 1/ })).toHaveTextContent('18 g → 40 g');

    // The journal list marks the timed cup too.
    expect(screen.getByTestId('journal-list')).toHaveTextContent('timed in app');

    // Tap the first point → that cup's entry.
    fireEvent.click(screen.getByTestId('dialin-point-1'));
    expect(screen.getByTestId('journal-entry')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-time-source')).toBeNull(); // attempt 1 was self-timed
    expect(getLearnerState().journal.find((e) => e.id === a.id)?.timeSec).toBe(19);
  });

  it('entry detail shows an app-timed time with its provenance; an untouched edit keeps it, editing the time makes it self-reported', () => {
    const e = log('2026-11-01T08:00:00Z', { doseG: 18, outG: 36, timeSec: 28, timeSource: 'app-timer' });
    renderJournal(`/journal?entry=${e.id}`);
    expect(screen.getByTestId('entry-time-source')).toHaveTextContent('Timed in app');
    expect(screen.getByTestId('journal-entry')).toHaveTextContent('measured by the app between your own Start and Stop taps');
    expect(screen.getByTestId('journal-entry')).toHaveTextContent('Self-reported');

    fireEvent.click(screen.getByTestId('entry-edit'));
    expect(screen.getByTestId('log-time-source')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('log-doseG'), { target: { value: '18.5' } });
    fireEvent.click(screen.getByTestId('log-save'));
    expect(getLearnerState().journal[0]).toMatchObject({ doseG: 18.5, timeSec: 28, timeSource: 'app-timer' });

    fireEvent.click(screen.getByTestId('entry-edit'));
    fireEvent.change(screen.getByTestId('log-timeSec'), { target: { value: '30' } });
    expect(screen.queryByTestId('log-time-source')).toBeNull();
    fireEvent.click(screen.getByTestId('log-save'));
    expect(getLearnerState().journal[0]).toMatchObject({ timeSec: 30, timeSource: 'self_report', evidence: 'self_report' });
    expect(screen.queryByTestId('entry-time-source')).toBeNull();
  });

  it('first load folds the interim side key into entries (only exact matches) and removes it', () => {
    const a = log('2026-11-01T08:00:00Z', { doseG: 18, outG: 36, timeSec: 28 });
    const b = log('2026-11-02T08:00:00Z', { doseG: 18, outG: 36, timeSec: 33 });
    localStorage.setItem(LEGACY_TIME_SOURCE_KEY, JSON.stringify({ [a.id]: 28, [b.id]: 30 }));
    renderJournal();
    const j = getLearnerState().journal;
    expect(j.find((x) => x.id === a.id)?.timeSource).toBe('app-timer');
    expect(j.find((x) => x.id === b.id)?.timeSource).toBeUndefined();
    expect(localStorage.getItem(LEGACY_TIME_SOURCE_KEY)).toBeNull();
  });

  it('follows the drink filter (pour-over shows its own zone and m:ss times)', () => {
    log('2026-11-01T08:00:00Z', { drinkId: 'pourover-cone', doseG: 15, outG: 250, timeSec: 185 });
    log('2026-11-02T08:00:00Z', { drinkId: 'pourover-cone', doseG: 15, outG: 240, timeSec: 170 });
    renderJournal('/journal?drink=pourover-cone');
    const chart = screen.getByTestId('dialin');
    expect(chart).toHaveTextContent('about 1:15–1:17 in 2:30–4:00 total');
    expect(chart).toHaveTextContent('Latest: 2:50 at 1:16.0');
  });
});
