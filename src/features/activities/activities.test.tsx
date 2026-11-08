import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnoseActivity, LocalizedText, ParameterLabActivity, QuizActivity, SequenceActivity } from '../../domain/contracts';
import { createMemoryStorage, initLearnerStore, learnerActions } from '../../state';
import { ActivityRenderer } from './ActivityRenderer';

const L = (en: string): LocalizedText => ({ zh: en, en });

beforeEach(() => {
  initLearnerStore(createMemoryStorage());
  act(() => learnerActions.updatePrefs({ locale: 'en', sfx: false }));
});

const quiz: QuizActivity = {
  id: 'q-act',
  lessonId: 'l',
  kind: 'quiz',
  title: L('Quiz'),
  supportedModes: ['desktop'],
  questions: [
    {
      id: 'q1',
      prompt: L('Botanically, what is a coffee bean?'),
      hint: L('Think about fruit.'),
      options: [
        { id: 'legume', text: L('A legume'), correct: false, feedback: L('It is called a bean, but it is not a legume.') },
        { id: 'seed', text: L('The seed of a cherry'), correct: true, feedback: L('Right — we roast the seed.') },
      ],
      explanation: L('Bean = seed of the coffee cherry.'),
    },
  ],
};

const sequence: SequenceActivity = {
  id: 's-act',
  lessonId: 'l',
  kind: 'sequence',
  title: L('Order'),
  supportedModes: ['desktop'],
  prompt: L('Put it in order'),
  hint: L('Roast comes before grinding.'),
  steps: [
    { id: 'roast', text: L('Roast'), why: L('Creates aroma') },
    { id: 'grind', text: L('Grind'), why: L('Right before brewing') },
    { id: 'brew', text: L('Brew'), why: L('Hot water dissolves flavour') },
  ],
  misconceptions: [{ earlierStep: 'roast', laterStep: 'grind', feedback: L('Green beans must be roasted before grinding.') }],
};

const lab: ParameterLabActivity = {
  id: 'lab-act',
  lessonId: 'l',
  kind: 'parameter-lab',
  lab: 'espresso-ratio',
  title: L('Ratio dial'),
  supportedModes: ['desktop'],
  defaults: { doseG: 18, outG: 36 },
  ranges: { doseG: [7, 24], outG: [7, 80] },
  illustrativeNote: L('18 g → 36 g is only an illustrative starting point.'),
  challenges: [
    { id: 'c1', prompt: L('Make about 1:2.5'), target: { ratioMin: 2.4, ratioMax: 2.6 }, success: L('That is a longer shot.') },
  ],
};

const diagnose: DiagnoseActivity = {
  id: 'dx-act',
  lessonId: 'l',
  kind: 'diagnose',
  title: L('Shot scenarios'),
  supportedModes: ['desktop'],
  scenarios: [
    {
      id: 'fast',
      situation: L('Your shot ran fast and tastes sour.'),
      observations: { doseG: 18, outG: 36, timeSec: 15, taste: L('sour, thin') },
      choices: [
        { id: 'finer', text: L('Grind a little finer'), quality: 'best', feedback: L('Finer slows the flow and extracts more.') },
        { id: 'temp', text: L('Change the water temperature'), quality: 'reasonable', feedback: L('Can help, but grind is the first lever.') },
        { id: 'all', text: L('Change everything at once'), quality: 'unhelpful', feedback: L('You will not know what helped.') },
      ],
      caveat: L('Real results depend on beans and grinder.'),
    },
  ],
};

describe('DiagnoseView guidance tiers (QA-06)', () => {
  it('guided: numbers are annotated, the hint is shown, picks get instant feedback', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ActivityRenderer activity={diagnose} guidance="guided" onComplete={onComplete} />);
    expect(screen.getByText('Fast: quicker than the common 25–35 s')).toBeInTheDocument();
    expect(screen.getByText(/rules of thumb, not targets or taste predictions/)).toBeInTheDocument();
    expect(screen.getByText(/Find the clue that stands out/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Change the water temperature/ }));
    expect(screen.getByText('Can help, but grind is the first lever.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Grind a little finer/ }));
    await user.click(screen.getByTestId('diagnose-next'));
    await user.click(screen.getByTestId('activity-continue'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'completed', score: 0.5 });
  });

  it('assisted: raw numbers only; the hint waits for a request', async () => {
    const user = userEvent.setup();
    render(<ActivityRenderer activity={diagnose} guidance="assisted" onComplete={() => {}} />);
    expect(screen.queryByText(/quicker than the common/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Find the clue that stands out/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Show hint/ }));
    expect(screen.getByText(/Find the clue that stands out/)).toBeInTheDocument();
  });

  it('independent: no hint, no feedback until a change AND a short reason are committed', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ActivityRenderer activity={diagnose} guidance="independent" onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /Show hint/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/quicker than the common/)).not.toBeInTheDocument();
    // Committing with nothing chosen explains what is missing.
    await user.click(screen.getByTestId('diagnose-commit'));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick one change first.');
    // Selecting is not answering: no quality, no feedback yet.
    await user.click(screen.getByRole('button', { name: /Grind a little finer/ }));
    expect(screen.getByRole('button', { name: /Grind a little finer/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Finer slows the flow and extracts more.')).not.toBeInTheDocument();
    expect(screen.queryByText('A strong first move')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('diagnose-commit'));
    expect(screen.getByRole('alert')).toHaveTextContent('Add a short reason first');
    expect(screen.getByLabelText(/Why this change/)).toHaveFocus();
    expect(screen.queryByText('Finer slows the flow and extracts more.')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/Why this change/), 'shot ran fast');
    await user.click(screen.getByTestId('diagnose-commit'));
    expect(screen.getByText('Finer slows the flow and extracts more.')).toBeInTheDocument();
    expect(screen.getByText(/“shot ran fast”/)).toBeInTheDocument();
    await user.click(screen.getByTestId('diagnose-next'));
    await user.click(screen.getByTestId('activity-continue'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'completed', score: 1 });
  });
});

describe('QuizView', () => {
  it('guided: wrong pick shows option-specific misconception feedback, then the right pick explains why', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ActivityRenderer activity={quiz} guidance="guided" onComplete={onComplete} />);
    expect(screen.getByText('Think about fruit.')).toBeInTheDocument(); // hint visible up front in guided
    await user.click(screen.getByRole('button', { name: /A legume/ }));
    expect(screen.getByText('It is called a bean, but it is not a legume.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /A legume/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /A legume/ })).toHaveTextContent('Not this one'); // not colour-only
    await user.click(screen.getByRole('button', { name: /The seed of a cherry/ }));
    expect(screen.getByText('Bean = seed of the coffee cherry.')).toBeInTheDocument();
    await user.click(screen.getByTestId('quiz-next'));
    await user.click(screen.getByTestId('activity-continue'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'completed', score: 0 });
  });

  it('assisted: hint is hidden until requested and answers are checked on submit', async () => {
    const user = userEvent.setup();
    render(<ActivityRenderer activity={quiz} guidance="assisted" onComplete={() => {}} />);
    expect(screen.queryByText('Think about fruit.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Show hint/ }));
    expect(screen.getByText('Think about fruit.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /The seed of a cherry/ }));
    expect(screen.queryByText('Right — we roast the seed.')).not.toBeInTheDocument(); // not yet checked
    await user.click(screen.getByTestId('quiz-check'));
    expect(screen.getByText('Right — we roast the seed.')).toBeInTheDocument();
  });

  it('independent: no hints, feedback deferred to a review, misses can be retried', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ActivityRenderer activity={quiz} guidance="independent" onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /Show hint/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /A legume/ }));
    await user.click(screen.getByTestId('quiz-check'));
    // review shows the misconception + the explanation
    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument();
    expect(screen.getByText('It is called a bean, but it is not a legume.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Retry the ones I missed/ }));
    await user.click(screen.getByRole('button', { name: /The seed of a cherry/ }));
    await user.click(screen.getByTestId('quiz-check'));
    await user.click(screen.getByTestId('activity-continue'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'completed', score: 0 });
  });
});

describe('SequenceView', () => {
  it('guided: builds step by step with instant misconception feedback', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const { container } = render(<ActivityRenderer activity={sequence} guidance="guided" onComplete={onComplete} />);
    expect(container.querySelector('[data-mode="build"]')).not.toBeNull();
    const pool = () => container.querySelector('.act-seq-pool') as HTMLElement;
    await user.click(within(pool()).getByRole('button', { name: /Grind/ }));
    expect(screen.getByText('Green beans must be roasted before grinding.')).toBeInTheDocument();
    await user.click(within(pool()).getByRole('button', { name: /Roast/ }));
    expect(screen.getByText(/Creates aroma/)).toBeInTheDocument(); // the why appears as it lands
    await user.click(within(pool()).getByRole('button', { name: /Grind/ }));
    await user.click(within(pool()).getByRole('button', { name: /Brew/ }));
    await user.click(screen.getByTestId('activity-continue'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'completed', score: 2 / 3 });
  });

  it('assisted: reorder with up/down buttons and check on submit', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const { container } = render(<ActivityRenderer activity={sequence} guidance="assisted" onComplete={onComplete} />);
    expect(container.querySelector('[data-mode="reorder"]')).not.toBeNull();
    const order = () => [...container.querySelectorAll('.act-seq-list > li')].map((li) => li.getAttribute('data-step'));
    // Sort into the right order using only the move buttons (works without drag).
    for (let guard = 0; guard < 10 && order().join() !== 'roast,grind,brew'; guard++) {
      const cur = order();
      const target = ['roast', 'grind', 'brew'];
      const i = cur.findIndex((id, idx) => id !== target[idx]);
      const want = target[i]!;
      const from = cur.indexOf(want);
      const label = sequence.steps.find((s) => s.id === want)!.text.en;
      await user.click(screen.getByRole('button', { name: `Move up: ${label}` }));
      expect(order().indexOf(want)).toBe(from - 1);
    }
    await user.click(screen.getByTestId('sequence-check'));
    expect(screen.getByText(/All in order/)).toBeInTheDocument();
    await user.click(screen.getByTestId('activity-continue'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'completed', score: 1 });
  });
});

describe('ParameterLabView', () => {
  it('shows the live ratio, the illustrative note, and checks a challenge with a direction', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ActivityRenderer activity={lab} guidance="guided" onComplete={onComplete} />);
    expect(screen.getByText('18 g → 36 g is only an illustrative starting point.')).toBeInTheDocument();
    expect(screen.getByTestId('lab-ratio')).toHaveTextContent('1:2.0');
    await user.click(screen.getByTestId('lab-check'));
    expect(screen.getByText('Try more liquid out.')).toBeInTheDocument();
    const yieldInput = screen.getByRole('spinbutton', { name: /Yield/ });
    await user.clear(yieldInput);
    await user.type(yieldInput, '45');
    expect(screen.getByTestId('lab-ratio')).toHaveTextContent('1:2.5');
    await user.click(screen.getByTestId('lab-check'));
    expect(screen.getByText('That is a longer shot.')).toBeInTheDocument();
    await user.click(screen.getByTestId('lab-next'));
    await user.click(screen.getByTestId('activity-continue'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'completed', score: 0 });
  });

  it('independent: a failed check gives no direction', async () => {
    const user = userEvent.setup();
    render(<ActivityRenderer activity={lab} guidance="independent" onComplete={() => {}} />);
    await user.click(screen.getByTestId('lab-check'));
    expect(screen.queryByText('Try more liquid out.')).not.toBeInTheDocument();
    expect(screen.getByText('Not inside the target yet.')).toBeInTheDocument();
  });

  it('extraction explorer always labels its output as an illustrative model', () => {
    render(
      <ActivityRenderer
        activity={{ ...lab, lab: 'extraction-explorer', defaults: { doseG: 18, outG: 36, timeSec: 28, grind: 5 }, ranges: { ...lab.ranges, timeSec: [10, 60], grind: [1, 10] } }}
        guidance="guided"
        onComplete={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: /Illustrative model — not a taste prediction/ })).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Extraction tendency' })).toBeInTheDocument();
  });
});

describe('ReflectView', () => {
  it('saves notes or lets the learner skip', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <ActivityRenderer
        activity={{ id: 'r', lessonId: 'l', kind: 'reflect', title: L('Reflect'), supportedModes: ['desktop'], prompts: [L('What surprised you?')] }}
        guidance="guided"
        onComplete={onComplete}
      />,
    );
    expect(screen.getByTestId('reflect-save')).toBeDisabled();
    await user.type(screen.getByLabelText('What surprised you?'), 'Beans are seeds');
    await user.click(screen.getByTestId('reflect-save'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'completed', notes: 'What surprised you?\nBeans are seeds' });
  });
});

describe('support nudge + keyboard quick path', () => {
  it('assisted quiz: after two misses the app SUGGESTS more support; number keys pick options', async () => {
    const user = userEvent.setup();
    const onStepDown = vi.fn();
    const three: QuizActivity = {
      ...quiz,
      questions: [
        {
          ...quiz.questions[0]!,
          options: [...quiz.questions[0]!.options, { id: 'fruit', text: L('A whole dried fruit'), correct: false, feedback: L('Only the seed remains.') }],
        },
      ],
    };
    render(<ActivityRenderer activity={three} guidance="assisted" onComplete={() => {}} onStepDown={onStepDown} />);
    await user.keyboard('1');
    await user.click(screen.getByTestId('quiz-check'));
    expect(screen.queryByTestId('support-nudge')).not.toBeInTheDocument();
    await user.keyboard('3');
    await user.click(screen.getByTestId('quiz-check'));
    expect(screen.getByText('Only the seed remains.')).toBeInTheDocument();
    await user.click(screen.getByTestId('support-nudge'));
    expect(onStepDown).toHaveBeenCalledTimes(1);
  });

  it('guided mode never shows the nudge', async () => {
    const user = userEvent.setup();
    render(<ActivityRenderer activity={quiz} guidance="guided" onComplete={() => {}} onStepDown={() => {}} />);
    await user.click(screen.getByRole('button', { name: /A legume/ }));
    expect(screen.queryByTestId('support-nudge')).not.toBeInTheDocument();
  });
});

describe('SpatialPracticeCard', () => {
  const spatial = {
    id: 'esp-workflow-xr',
    lessonId: 'esp-workflow',
    kind: 'spatial-practice' as const,
    missionId: 'espresso-first-shot',
    title: L('Virtual bar'),
    supportedModes: ['xr' as const, 'desktop' as const],
    summary: L('Pick up the portafilter…'),
    limits: L('No real touch, force or taste.'),
  };

  it('deep-links to the mission, shows limits, never blocks, and is done only after a simulated completion', async () => {
    const { MemoryRouter } = await import('react-router');
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const { unmount } = render(
      <MemoryRouter>
        <ActivityRenderer activity={spatial} guidance="guided" onComplete={onComplete} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('open-xr')).toHaveAttribute('href', '/xr?mission=espresso-first-shot');
    expect(screen.getByText('No real touch, force or taste.')).toBeInTheDocument();
    expect(screen.queryByText('Completed in simulation')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('activity-continue'));
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'skipped' });
    unmount();

    const base = { activityId: 'esp-workflow-xr', lessonId: 'esp-workflow', mode: 'xr' as const, guidance: 'guided' as const, outcome: 'completed' as const };
    act(() => {
      learnerActions.recordEvent({ ...base, evidence: 'assessed_answer' });
    });
    render(
      <MemoryRouter>
        <ActivityRenderer activity={spatial} guidance="guided" onComplete={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Completed in simulation')).not.toBeInTheDocument();
    act(() => {
      learnerActions.recordEvent({ ...base, evidence: 'simulated', score: 0.9 });
    });
    expect(screen.getByText('Completed in simulation')).toBeInTheDocument();
  });
});
