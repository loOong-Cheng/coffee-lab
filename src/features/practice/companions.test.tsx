import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLearnerState, initLearnerStore, learnerActions } from '../../state';
import { timeSourceOf } from '../journal/timeSource';
import PracticePage from './index';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/practice/:activityId" element={<PracticePage />} />
        <Route path="/journal" element={<p>journal page</p>} />
        <Route path="/learn/:lessonId" element={<p>lesson page</p>} />
        <Route path="/atlas/:drinkId" element={<p>drink page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const done = () => fireEvent.click(within(screen.getByRole('group', { name: 'Step controls' })).getByRole('button', { name: /^Done/ }));
const stepId = () => screen.getByTestId('practice-step').getAttribute('data-step-id');
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

function resumeAt(planId: string, stepIndex: number) {
  act(() => {
    learnerActions.startPractice(planId, 'guided');
    learnerActions.updatePractice({ stepIndex });
  });
  const view = renderAt(`/practice/${planId}`);
  fireEvent.click(screen.getByTestId('resume-continue'));
  return view;
}

describe('espresso shot timer companion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T08:00:00.000Z'));
    sessionStorage.clear();
    initLearnerStore();
    act(() => learnerActions.updatePrefs({ locale: 'en', sfx: false }));
  });
  afterEach(() => vi.useRealTimers());

  it('start/stop between the learner’s taps → carried into the log as "timed in app"; the rest stays self-reported', () => {
    resumeAt('esp-first-real-shot-guide', 8);
    expect(stepId()).toBe('brew');
    const shot = screen.getByTestId('shot-timer');
    expect(shot).toHaveTextContent('≈ 36 g');
    expect(shot).toHaveTextContent('25–35 s — stop by weight, not by the clock');
    expect(screen.queryByTestId('stopwatch')).toBeNull(); // one clock at a time

    fireEvent.click(screen.getByTestId('shot-start'));
    advance(28_000);
    expect(screen.getByTestId('shot-digits')).toHaveTextContent('0:28');
    expect(stepId()).toBe('brew'); // a timer never completes a step
    fireEvent.click(screen.getByTestId('shot-stop'));
    advance(5_000);
    const result = screen.getByTestId('shot-result');
    expect(result).toHaveTextContent('Shot time: 0:28');
    expect(result).toHaveTextContent('Timed in app');
    expect(result).toHaveTextContent('Within the 25–35 s reference');
    expect(screen.getByTestId('shot-digits')).toHaveTextContent('0:28'); // frozen after Stop

    fireEvent.click(screen.getByTestId('shot-carry'));
    expect(screen.getByTestId('shot-carried')).toHaveTextContent('0:28 will go in your brew log');

    done(); // → "stop" step shares the same shot timer
    expect(stepId()).toBe('stop');
    expect(screen.getByTestId('shot-result')).toHaveTextContent('0:28');

    while (!screen.queryByTestId('practice-finish')) done();
    expect(screen.getByTestId('log-timeSec')).toHaveValue('28');
    expect(screen.getByTestId('log-time-source')).toHaveTextContent('Timed in app');
    expect(screen.getByTestId('log-doseG')).toHaveValue(''); // never invented
    fireEvent.change(screen.getByTestId('log-doseG'), { target: { value: '18' } });
    fireEvent.change(screen.getByTestId('log-outG'), { target: { value: '36' } });
    fireEvent.click(screen.getByTestId('log-save'));

    const entry = getLearnerState().journal[0]!;
    expect(entry).toMatchObject({ evidence: 'self_report', timeSec: 28, timeSource: 'app-timer', doseG: 18, outG: 36, drinkId: 'espresso-shot' });
    expect(timeSourceOf(entry)).toBe('app-timer');
    expect(screen.getByText('journal page')).toBeInTheDocument();
  });

  it('not carried → offered as a button; editing the value makes it self-reported', () => {
    resumeAt('esp-first-real-shot-guide', 8);
    fireEvent.click(screen.getByTestId('shot-start'));
    advance(19_000);
    fireEvent.click(screen.getByTestId('shot-stop'));
    expect(screen.getByTestId('shot-result')).toHaveTextContent('Shorter than the 25–35 s reference');
    while (!screen.queryByTestId('practice-finish')) done();

    expect(screen.getByTestId('log-timeSec')).toHaveValue('');
    expect(screen.queryByTestId('log-time-source')).toBeNull();
    fireEvent.click(screen.getByTestId('log-use-timer'));
    expect(screen.getByTestId('log-timeSec')).toHaveValue('19');
    expect(screen.getByTestId('log-time-source')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('log-timeSec'), { target: { value: '21' } });
    expect(screen.queryByTestId('log-time-source')).toBeNull();
    fireEvent.click(screen.getByTestId('log-save'));
    const entry = getLearnerState().journal[0]!;
    expect(entry.timeSec).toBe(21);
    expect(entry.timeSource).toBeUndefined(); // typed by the learner → self-reported
    expect(timeSourceOf(entry)).toBe('self_report');
  });

  it('“Time another shot” resets the timer and withdraws the carry', () => {
    resumeAt('drink:espresso-shot', 3);
    expect(stepId()).toBe('s4');
    fireEvent.click(screen.getByTestId('shot-start'));
    advance(30_000);
    fireEvent.click(screen.getByTestId('shot-stop'));
    fireEvent.click(screen.getByTestId('shot-carry'));
    fireEvent.click(screen.getByTestId('shot-reset'));
    expect(screen.getByTestId('shot-digits')).toHaveTextContent('0:00');
    expect(screen.queryByTestId('shot-result')).toBeNull();
    while (!screen.queryByTestId('practice-finish')) done();
    expect(screen.getByTestId('log-timeSec')).toHaveValue('');
    expect(screen.queryByTestId('log-use-timer')).toBeNull();
  });
});

describe('pour-over schedule companion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T08:00:00.000Z'));
    sessionStorage.clear();
    initLearnerStore();
    act(() => learnerActions.updatePrefs({ locale: 'en', sfx: false }));
  });
  afterEach(() => vi.useRealTimers());

  it('scales to the dose, advances phases on its own clock, pauses/resumes, survives a remount, and carries the total time', () => {
    const view = resumeAt('po-first-real-cup-guide', 5);
    expect(stepId()).toBe('bloom');
    const card = () => screen.getByTestId('pour-schedule');
    expect(screen.queryByTestId('countdown')).toBeNull();
    expect(card()).toHaveTextContent('A schedule, not a measurement');
    expect(screen.getByTestId('pour-dose')).toHaveTextContent('15 g');
    expect(screen.getByTestId('pour-total')).toHaveTextContent('250 g water in total');

    fireEvent.click(screen.getByTestId('pour-dose-more'));
    expect(screen.getByTestId('pour-dose')).toHaveTextContent('16 g');
    expect(screen.getByTestId('pour-total')).toHaveTextContent('267 g water in total');

    fireEvent.click(screen.getByTestId('pour-start'));
    expect(card()).toHaveAttribute('data-phase', 'bloom-pour');
    expect(screen.getByTestId('pour-phase')).toHaveTextContent('pour slowly to about 45 g');
    expect(screen.queryByTestId('pour-dose-more')).toBeNull(); // dose locked while brewing

    advance(20_000);
    expect(card()).toHaveAttribute('data-phase', 'bloom-wait');
    expect(screen.getByTestId('pour-detail')).toHaveTextContent('Next pour in 0:25 — up to 160 g');

    advance(26_000); // 0:46 → first pour; a cue is announced for screen readers
    expect(card()).toHaveAttribute('data-phase', 'pour-1');
    advance(100); // the announcer writes after a short delay
    expect(document.querySelector('[data-cl-announcer="polite"]')?.textContent).toMatch(/small circles from the centre to about 160 g/);
    advance(13_900);
    expect(screen.getByTestId('pour-detail')).toHaveTextContent('Reach 160 g by 1:15');
    expect(screen.getByTestId('pour-detail')).toHaveTextContent('about 105 g now');

    done(); // learner confirms the bloom; the same schedule keeps running on the next step
    expect(stepId()).toBe('pour-1');
    expect(screen.getByTestId('pour-clock')).toHaveTextContent('1:00');

    fireEvent.click(screen.getByTestId('pour-pause'));
    advance(30_000);
    expect(screen.getByTestId('pour-clock')).toHaveTextContent('1:00');

    // Interruption: the page goes away and comes back — the schedule is still paused at 1:00.
    view.unmount();
    renderAt('/practice/po-first-real-cup-guide');
    fireEvent.click(screen.getByTestId('resume-continue'));
    expect(screen.getByTestId('pour-clock')).toHaveTextContent('1:00');
    expect(screen.getByTestId('pour-total')).toHaveTextContent('16 g coffee → 267 g water');

    fireEvent.click(screen.getByTestId('pour-resume'));
    advance(125_000); // 3:05 → past the 3:00 drawdown reference
    expect(card()).toHaveAttribute('data-phase', 'over');
    fireEvent.click(screen.getByTestId('pour-stop'));
    expect(screen.getByTestId('pour-result')).toHaveTextContent('Total brew time: 3:05');
    fireEvent.click(screen.getByTestId('pour-carry'));
    expect(screen.getByTestId('pour-carried')).toBeInTheDocument();

    while (!screen.queryByTestId('practice-finish')) done();
    expect(screen.getByTestId('log-timeSec')).toHaveValue('3:05');
    expect(screen.getByTestId('log-time-source')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('log-save'));
    const entry = getLearnerState().journal[0]!;
    expect(entry).toMatchObject({ timeSec: 185, timeSource: 'app-timer' });
    expect(entry.doseG).toBeUndefined(); // the scaled plan is never logged as if measured
    expect(timeSourceOf(entry)).toBe('app-timer');
  });
});
