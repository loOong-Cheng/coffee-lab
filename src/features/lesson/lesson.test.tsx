import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../app/App';
import { getLesson } from '../../content';
import { createMemoryStorage, getLearnerState, initLearnerStore, learnerActions, lessonStatus } from '../../state';

beforeEach(() => {
  initLearnerStore(createMemoryStorage());
  act(() => {
    learnerActions.updatePrefs({ locale: 'en', sfx: false, defaultGuidance: 'guided' });
    learnerActions.setProfile({
      goal: 'espresso',
      experience: 'new',
      devices: ['pc'],
      equipment: [],
      wishlist: [],
      preferredMode: 'desktop',
      onboardedAt: new Date().toISOString(),
    });
  });
});

describe('lesson player', () => {
  it('unknown lesson ids get a friendly not-found page with a way back', async () => {
    window.location.hash = '#/learn/no-such-lesson';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Lesson not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the course map' })).toBeInTheDocument();
  });

  it('intro → cards (keyboard) → sequence → quiz wrong-then-right → completion; progress derived from events', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/learn/lit-what-is-coffee';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'What Is Coffee?' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await user.click(screen.getByTestId('lesson-start'));
    expect(window.location.hash).toContain('step=1');

    // Explain cards: → pages through cards first, then "Got it".
    expect(await screen.findByTestId('activity-explain')).toBeInTheDocument();
    for (let i = 0; i < 10 && screen.queryByTestId('explain-next'); i++) await user.keyboard('{ArrowRight}');
    await user.click(screen.getByTestId('activity-continue'));

    // Sequence (guided build mode): pick steps in the right order.
    expect(await screen.findByTestId('activity-sequence')).toBeInTheDocument();
    for (const id of ['harvest', 'process', 'ship', 'roast', 'rest', 'grind', 'brew']) {
      await user.click(document.querySelector(`.act-seq-pool [data-step="${id}"]`) as HTMLElement);
    }
    await user.click(screen.getByTestId('activity-continue'));

    // Quiz: wrong first on question 1, then right.
    expect(await screen.findByTestId('activity-quiz')).toBeInTheDocument();
    await user.click(document.querySelector('[data-option="legume"]') as HTMLElement);
    expect(screen.getByText(/not a legume/)).toBeInTheDocument();
    for (const id of ['seed', 'a', 'flavor', 'acidity']) {
      await user.click(document.querySelector(`[data-option="${id}"]`) as HTMLElement);
      await user.click(screen.getByTestId('quiz-next'));
    }
    await user.click(screen.getByTestId('activity-continue'));

    // Reflection is optional.
    await user.click(await screen.findByTestId('reflect-skip'));

    expect(await screen.findByTestId('lesson-complete')).toHaveAttribute('data-status', 'completed');
    expect(screen.getByRole('heading', { name: /Lesson complete/ })).toBeInTheDocument();

    const events = getLearnerState().events;
    const quizEvent = events.find((e) => e.activityId === 'lit-what-is-coffee-quiz');
    expect(quizEvent).toMatchObject({ evidence: 'assessed_answer', outcome: 'completed', guidance: 'guided', mode: 'desktop', score: 0.75 });
    expect(events.find((e) => e.activityId === 'lit-what-is-coffee-cards')?.evidence).toBe('observed_by_app');
    expect(events.some((e) => e.activityId === 'lit-what-is-coffee-reflect')).toBe(false); // skipped → not recorded
    expect(lessonStatus(getLesson('lit-what-is-coffee')!, events)).toBe('completed');
    expect(screen.getByTestId('next-lesson')).toHaveAttribute('href', '#/learn/lit-tools-safety');
    // QA-08: guided completion is "completed with guidance", not "mastered"; offers the Independent tier.
    expect(screen.getByTestId('lesson-autonomy')).toHaveAttribute('data-autonomy', 'guided');
    expect(screen.getByTestId('lesson-autonomy')).toHaveTextContent('Completed with guidance');
    expect(screen.getByTestId('lesson-complete')).not.toHaveTextContent(/Mastered independently/);
    await user.click(screen.getByTestId('try-independent'));
    expect(window.location.hash).toMatch(/step=2&g=independent/); // first check = the sequence
    expect(await screen.findByTestId('activity-sequence')).toHaveAttribute('data-mode', 'reorder');
  });

  it('an in-progress lesson resumes at the exact activity the learner was on (after reload / coming back)', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/learn/lit-what-is-coffee?step=1&g=assisted';
    const first = render(<App />);
    expect(await screen.findByTestId('activity-explain')).toBeInTheDocument();
    for (let i = 0; i < 10 && screen.queryByTestId('explain-next'); i++) await user.click(screen.getByTestId('explain-next'));
    await user.click(screen.getByTestId('activity-continue')); // records the cards → lesson in progress
    expect(await screen.findByTestId('activity-sequence')).toBeInTheDocument();
    await user.click(screen.getByTestId('lesson-next')); // skip ahead to activity 3 (the quiz)
    expect(await screen.findByTestId('activity-quiz')).toBeInTheDocument();
    expect(getLearnerState().lastLocation?.route).toBe('/learn/lit-what-is-coffee?step=3&g=assisted');
    first.unmount();

    // "Reload" / relaunch: come back through the course-map link (no step in the URL).
    window.location.hash = '#/learn/lit-what-is-coffee';
    render(<App />);
    const cta = await screen.findByTestId('lesson-start');
    expect(cta).toHaveTextContent('Back to where you were: activity 3');
    expect(screen.getByRole('radio', { name: /Assisted/ })).toHaveAttribute('aria-checked', 'true'); // tier restored too
    await user.click(cta);
    expect(await screen.findByTestId('activity-quiz')).toBeInTheDocument();
    expect(window.location.hash).toContain('step=3');
  });

  it('H toggles the hint (assisted) and changing support restarts the activity with the new tier', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/learn/lit-what-is-coffee?step=2&g=assisted';
    render(<App />);
    expect(await screen.findByTestId('activity-sequence')).toHaveAttribute('data-mode', 'reorder');
    expect(screen.queryByText(/after which step does coffee first smell/)).not.toBeInTheDocument();
    document.body.focus();
    await user.keyboard('h');
    expect(screen.getByText(/after which step does coffee first smell/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Guided/ }));
    expect(await screen.findByTestId('activity-sequence')).toHaveAttribute('data-mode', 'build');
  });
});
