import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage, getLearnerState, initLearnerStore, learnerActions } from '../state';
import { resetCapabilityCache } from '../platform';
import XrRoute from './XrRoute';

beforeEach(() => {
  initLearnerStore(createMemoryStorage());
  act(() => learnerActions.updatePrefs({ locale: 'en' }));
  resetCapabilityCache();
});
afterEach(() => {
  vi.useRealTimers();
});

function renderRoute(path = '/xr?mission=espresso-first-shot') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <XrRoute />
    </MemoryRouter>,
  );
}

describe('XR lab picker', () => {
  it('lists three missions with practice/limits/time and deep links, showing simulated completions', () => {
    act(() => {
      learnerActions.recordEvent({ activityId: 'po-ratio-bloom-xr', lessonId: 'po-ratio-bloom', mode: 'desktop', guidance: 'assisted', evidence: 'simulated', outcome: 'completed', score: 0.82 });
    });
    renderRoute('/xr');
    expect(screen.getByRole('heading', { level: 1, name: 'XR coffee lab' })).toBeInTheDocument();
    for (const id of ['station-tour', 'espresso-first-shot', 'pourover-bloom']) {
      const card = screen.getByTestId(`xr-mission-${id}`);
      expect(within(card).getByText(/You practise/)).toBeInTheDocument();
      expect(within(card).getByText(/Not trained/)).toBeInTheDocument();
      expect(within(card).getByText(/min ·/)).toBeInTheDocument();
      expect(within(card).getByRole('link', { name: 'Open mission' })).toHaveAttribute('href', `/xr?mission=${id}`);
    }
    expect(screen.getByTestId('xr-mission-pourover-bloom')).toHaveAttribute('data-completed', 'true');
    expect(screen.getByTestId('xr-mission-status-pourover-bloom')).toHaveTextContent('Completed ×1 · last: Assisted · 82% (simulated)');
    expect(screen.getByTestId('xr-mission-status-station-tour')).toHaveTextContent('Not tried yet');
  });

  it('deep link opens the pour-over brief; unknown ids fall back to the picker', () => {
    renderRoute('/xr?mission=pourover-bloom');
    expect(screen.getByRole('heading', { level: 1, name: 'Pour-over: bloom and steady pours' })).toBeInTheDocument();
    expect(screen.getByText(/Controlling flow with kettle tilt/)).toBeInTheDocument();
  });

  it('unknown mission id shows the picker', () => {
    renderRoute('/xr?mission=bogus');
    expect(screen.getByTestId('xr-picker')).toBeInTheDocument();
  });

  it('the station tour is completable from the action list and records its own activity', () => {
    renderRoute('/xr?mission=station-tour');
    act(() => void fireEvent.click(screen.getByTestId('xr-play-list')));
    const click = (name: RegExp) => act(() => void fireEvent.click(screen.getByRole('button', { name })));
    for (const tool of [/Inspect the Electric grinder/, /Inspect the Scale/, /Inspect the Tamper/, /Inspect the Knock box/]) click(tool);
    expect(screen.getByTestId('xr-step-title')).toHaveTextContent('Point at the grinder');
    click(/Inspect the Electric grinder/);
    click(/Pick up the tamper/);
    click(/Put the tamper back/);
    click(/Pick up the portafilter/);
    click(/grinder fork/);
    click(/Inspect the Group head/);
    click(/Pick up the cup/);
    click(/Put the cup on the scale/);
    click(/Inspect the Knock box/);
    const summary = screen.getByTestId('xr-summary');
    expect(within(summary).getByText('Simulated')).toBeInTheDocument();
    const ev = getLearnerState().events.filter((e) => e.activityId === 'esp-meet-the-machine-xr');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ lessonId: 'esp-meet-the-machine', evidence: 'simulated', outcome: 'completed', mode: 'desktop' });
  });
});

describe('XR route fallback (jsdom: no navigator.xr, no WebGL)', () => {
  it('renders the brief with honest limits and no Enter VR button', async () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'Espresso counter: your first shot' })).toBeInTheDocument();
    expect(screen.getByText(/What it does NOT train/)).toBeInTheDocument();
    expect(screen.getByText(/Hardware-unverified/)).toBeInTheDocument();
    const cap = screen.getByTestId('xr-capability');
    await within(cap).findByText(/WebGL/); // no WebGL in jsdom → explains the action-list path
    expect(within(cap).queryByRole('button', { name: /Enter VR|Start the scene/ })).toBeNull();
    expect(within(cap).queryByRole('button', { name: /Play in 3D/ })).toBeNull();
    expect(within(cap).getByRole('button', { name: /action list/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /matching 2D lesson/ })).toHaveAttribute('href', '/learn/esp-workflow');
  });

  it('the whole mission is completable from the keyboard action list and records simulated progress', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance', 'Date'] });
    const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
    const click = (name: string | RegExp) => act(() => void fireEvent.click(screen.getByRole('button', { name })));
    renderRoute();
    act(() => void fireEvent.click(screen.getByTestId('xr-play-list')));
    expect(screen.getByTestId('xr-station-status')).toBeInTheDocument();
    expect(screen.getByTestId('xr-step-title')).toHaveTextContent('Find the espresso machine');

    // Wrong order first: gentle, specific feedback, no dead end.
    await click(/^Press the brew button/);
    expect(screen.getByTestId('xr-feedback')).toHaveAttribute('data-code', 'brew-no-portafilter');

    await click(/Look at the espresso machine/);
    await click(/Pick up the portafilter/);
    await click(/grinder fork/);
    await click(/grinder's button/);
    await wait(3500); // simulated grinder time (the ticker runs without a 3D scene)
    expect(screen.getByTestId('xr-step-title')).toHaveTextContent('Tamp the grounds');
    await click(/Pick up the portafilter/);
    await click(/tamping mat/);
    await click(/Pick up the tamper/);
    await click(/Tamp: press the tamper/);
    await click(/Pick up the portafilter/);
    await click(/Lock the portafilter/);
    await click(/Pick up the cup/);
    await click(/Put the cup on the scale/);
    await click(/TARE/);
    await click(/^Press the brew button/);
    await wait(24000); // ~31 g by now (illustrative curve)
    for (let i = 0; i < 100; i++) {
      const g = parseFloat(screen.getByTestId('xr-readout').textContent ?? '0');
      if (g >= 35.2) break;
      await wait(100);
    }
    await click(/to STOP/);
    await wait(1500);
    await click(/Pick up the cup/);
    await click(/serving board/);
    await click(/Pick up the portafilter/);
    await click(/knock box/);
    await click(/^Press the brew button/);
    await wait(2500);

    const summary = screen.getByTestId('xr-summary');
    expect(within(summary).getByText('Simulated')).toBeInTheDocument();
    expect(within(summary).getByText(/spatial placement was not practised/)).toBeInTheDocument();
    expect(within(summary).getByText(/Grip force and tamping pressure/)).toBeInTheDocument();
    const events = getLearnerState().events.filter((e) => e.activityId === 'esp-workflow-xr');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ evidence: 'simulated', outcome: 'completed', mode: 'desktop', lessonId: 'esp-workflow' });
    expect(events[0]!.score).toBeGreaterThan(0.8);
  }, 30000);
});
