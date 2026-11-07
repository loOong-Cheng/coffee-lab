import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { getLearnerState, initLearnerStore, learnerActions } from '../../state';
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

const controls = () => screen.getByRole('group', { name: 'Step controls' });

describe('kitchen mode page', () => {
  beforeEach(() => {
    initLearnerStore();
    act(() => learnerActions.updatePrefs({ locale: 'en', sfx: false }));
  });

  it('starts a drink practice, advances self-reported steps and offers resume after a remount', async () => {
    const user = userEvent.setup();
    const view = renderAt('/practice/drink:french-press-coffee');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/French press/i);
    await user.click(screen.getByTestId('practice-start'));
    expect(screen.getByTestId('practice-step')).toHaveAttribute('data-step-id', 's1');
    await user.click(within(controls()).getByRole('button', { name: /^Done/ }));
    expect(screen.getByTestId('practice-step')).toHaveAttribute('data-step-id', 's2');
    expect(getLearnerState().activePractice).toMatchObject({ activityId: 'drink:french-press-coffee', stepIndex: 1, stepStatus: { s1: 'done' } });

    // Interruption: the page goes away and comes back.
    view.unmount();
    renderAt('/practice/drink:french-press-coffee');
    expect(screen.getByTestId('resume-prompt')).toHaveTextContent('Resume where you left off?');
    expect(screen.getByTestId('resume-prompt')).toHaveTextContent('step 2');
    await user.click(screen.getByTestId('resume-continue'));
    expect(screen.getByTestId('practice-step')).toHaveAttribute('data-step-id', 's2');
  });

  it('records exactly one self-reported completion and then shows the brew log', async () => {
    const user = userEvent.setup();
    renderAt('/practice/drink:french-press-coffee');
    await user.click(screen.getByTestId('practice-start'));
    while (!screen.queryByTestId('practice-finish')) {
      await user.click(within(controls()).getByRole('button', { name: /^Done/ }));
    }
    // Back then Done again must not duplicate the event.
    await user.click(screen.getByRole('button', { name: /Back to the last step/ }));
    await user.click(within(controls()).getByRole('button', { name: /^Done/ }));
    const events = getLearnerState().events.filter((e) => e.activityId === 'drink:french-press-coffee');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ evidence: 'self_report', mode: 'real-world-guide', outcome: 'completed', lessonId: '' });
    expect(screen.getByText('Self-reported')).toBeInTheDocument();

    await user.type(screen.getByTestId('log-doseG'), '30');
    await user.type(screen.getByTestId('log-outG'), '500');
    expect(screen.getByTestId('log-ratio')).toHaveTextContent('1:16.7');
    await user.click(screen.getByTestId('log-save'));
    expect(getLearnerState().journal).toHaveLength(1);
    expect(getLearnerState().journal[0]).toMatchObject({ drinkId: 'french-press-coffee', activityId: 'drink:french-press-coffee', doseG: 30, outG: 500 });
    expect(getLearnerState().activePractice).toBeNull();
  });

  it('rejects invalid numbers without saving and keeps empty fields undefined', async () => {
    const user = userEvent.setup();
    act(() => {
      learnerActions.startPractice('drink:french-press-coffee', 'independent');
      learnerActions.updatePractice({ stepIndex: 99 });
    });
    renderAt('/practice/drink:french-press-coffee');
    await user.click(screen.getByTestId('resume-continue'));
    await user.type(screen.getByTestId('log-doseG'), 'abc');
    await user.click(screen.getByTestId('log-save'));
    expect(screen.getByText(/Enter a number/)).toBeInTheDocument();
    expect(getLearnerState().journal).toHaveLength(0);
    await user.clear(screen.getByTestId('log-doseG'));
    await user.click(screen.getByTestId('log-save'));
    expect(getLearnerState().journal).toHaveLength(1);
    const entry = getLearnerState().journal[0];
    expect(entry.doseG).toBeUndefined();
    expect(entry.timeSec).toBeUndefined();
    expect(entry.tasteTags).toBeUndefined();
  });

  it('independent tier shows the compact checklist; Chinese UI renders', async () => {
    act(() => {
      learnerActions.updatePrefs({ locale: 'zh' });
      learnerActions.startPractice('esp-first-real-shot-guide', 'independent');
    });
    const user = userEvent.setup();
    renderAt('/practice/esp-first-real-shot-guide');
    await user.click(screen.getByTestId('resume-continue'));
    expect(screen.getByRole('heading', { name: '全部步骤' })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: '步骤操作' })).getByRole('button', { name: /完成这一步/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { current: 'step' })).toHaveLength(1);
  });

  it('unknown ids show a helpful not-found state', () => {
    renderAt('/practice/nope');
    expect(screen.getByText('We couldn’t find that practice')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the Drink Atlas' })).toBeInTheDocument();
  });
});
