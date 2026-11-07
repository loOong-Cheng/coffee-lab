import { act, render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../app/App';
import { createMemoryStorage, getLearnerState, initLearnerStore, learnerActions } from '../../state';
import { EXTRAS, type CompleteBuild } from './model';
import { getBuildSpec } from './specs';

beforeEach(() => {
  initLearnerStore(createMemoryStorage());
  act(() => {
    learnerActions.updatePrefs({ locale: 'en', sfx: false, defaultGuidance: 'guided' });
    learnerActions.setProfile({
      goal: 'explore',
      experience: 'new',
      devices: ['pc'],
      equipment: [],
      wishlist: [],
      preferredMode: 'desktop',
      onboardedAt: new Date().toISOString(),
    });
  });
});

const station = (id: string) => screen.getByTestId(`station-${id}`);
const opt = (id: string, value: string) => station(id).querySelector(`[data-value="${value}"]`) as HTMLElement;

async function pick(user: UserEvent, id: string, value: string) {
  const el = opt(id, value);
  expect(el, `${id}=${value}`).toBeTruthy();
  if (el.getAttribute('aria-checked') !== 'true') await user.click(el);
}

/** Build a drink through the UI, station by station (clicks only). */
async function applyBuild(user: UserEvent, b: CompleteBuild) {
  await pick(user, 'method', b.method);
  if (b.method === 'espresso') {
    await pick(user, 'shots', String(b.shots));
    await pick(user, 'shots', b.shotStyle);
  }
  await pick(user, 'water', b.water);
  if (b.water !== 'none') await pick(user, 'water', String(b.waterMl));
  await pick(user, 'milk', b.milk);
  if (b.milk !== 'none') await pick(user, 'milk', String(b.milkMl));
  await pick(user, 'ice', b.ice ? 'yes' : 'no');
  for (const e of EXTRAS) {
    const chip = station('extras').querySelector(`[data-extra="${e}"]`) as HTMLElement;
    if ((chip.getAttribute('aria-pressed') === 'true') !== b.extras.includes(e)) await user.click(chip);
  }
  await pick(user, 'cup', b.cup);
}

const currentDrink = () => screen.getByTestId('cafe-ticket').getAttribute('data-drink')!;

describe('Café Counter', () => {
  it('lobby → shift: missing cup prompt, wrong serve explained, retry, keyboard serve, summary, mastered collection', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/cafe?seed=3';
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Café Counter' })).toBeInTheDocument();
    expect(screen.getByTestId('cafe-versions')).toHaveTextContent(/Definitions vary by café and region/);
    expect(screen.getByTestId('cafe-mastered-count')).toHaveTextContent('0 of 19 drinks mastered');
    expect(screen.getByRole('link', { name: 'Café' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByTestId('cafe-start-bar'));
    expect(await screen.findByTestId('cafe-ticket')).toBeInTheDocument();
    // Guided: recipe card + station hints are visible.
    expect(screen.getByTestId('cafe-recipe')).toBeInTheDocument();
    expect(screen.getByText(/Customer 1 of 5/)).toBeInTheDocument();

    // Serving without a cup asks for one instead of failing.
    await user.click(screen.getByTestId('cafe-serve'));
    expect(screen.getByTestId('cafe-missing')).toHaveTextContent('Before serving, choose: Cup.');
    expect(getLearnerState().events).toHaveLength(0);

    // 1st order: deliberately the wrong cup.
    const first = currentDrink();
    const firstSpec = getBuildSpec(first)!;
    const wrongCup = (['demitasse', 'small', 'medium', 'large'] as const).find((c) => !firstSpec.accept.cup.includes(c))!;
    await applyBuild(user, { ...firstSpec.canonical, cup: wrongCup });
    await user.click(screen.getByTestId('cafe-serve'));
    const fb = await screen.findByTestId('cafe-feedback');
    expect(fb).toHaveAttribute('data-status', 'partly');
    const diff = within(fb).getByText('Cup').closest('li')!;
    expect(diff).toHaveAttribute('data-component', 'cup');
    expect(within(diff).getByText(/Why:/)).toBeInTheDocument();
    expect(screen.getByTestId('cafe-cup-order')).toBeInTheDocument(); // guided shows the answer cup
    let events = getLearnerState().events;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      activityId: `cafe:${first}`,
      lessonId: '',
      evidence: 'assessed_answer',
      outcome: 'retry',
      guidance: 'guided',
      mode: 'desktop',
    });
    expect(events[0]!.score).toBeGreaterThan(0.8);
    expect(events[0]!.score).toBeLessThan(1);

    // Retry keeps the build; fix the cup.
    await user.click(screen.getByTestId('cafe-retry'));
    expect(station('cup')).toHaveAttribute('data-flagged', 'true');
    await pick(user, 'cup', firstSpec.canonical.cup);
    await user.click(screen.getByTestId('cafe-serve'));
    expect(await screen.findByTestId('cafe-feedback')).toHaveAttribute('data-status', 'correct');
    events = getLearnerState().events;
    expect(events[1]).toMatchObject({ activityId: `cafe:${first}`, outcome: 'completed', score: 1 });
    await user.click(screen.getByTestId('cafe-next'));

    // 2nd order via the keyboard: S serves, N moves on.
    expect(screen.getByText(/Customer 2 of 5/)).toBeInTheDocument();
    await applyBuild(user, getBuildSpec(currentDrink())!.canonical);
    await user.keyboard('s');
    expect(await screen.findByTestId('cafe-feedback')).toHaveAttribute('data-status', 'correct');
    await user.keyboard('n');

    // Remaining orders, perfect.
    for (let i = 3; i <= 5; i++) {
      expect(screen.getByText(new RegExp(`Customer ${i} of 5`))).toBeInTheDocument();
      await applyBuild(user, getBuildSpec(currentDrink())!.canonical);
      await user.click(screen.getByTestId('cafe-serve'));
      expect(await screen.findByTestId('cafe-feedback')).toHaveAttribute('data-status', 'correct');
      await user.click(screen.getByTestId('cafe-next'));
    }

    const summary = await screen.findByTestId('cafe-summary');
    expect(within(summary).getByRole('heading', { name: 'Shift complete!' })).toBeInTheDocument();
    expect(screen.getByTestId('cafe-first-try')).toHaveTextContent('4/5');
    expect(screen.getByTestId('cafe-newly-mastered')).toBeInTheDocument();
    expect(within(summary).getAllByRole('link', { name: /See it in the Drink Atlas/ })[0]).toHaveAttribute('href', expect.stringMatching(/^#\/atlas\//));
    expect(getLearnerState().events).toHaveLength(6);

    await user.click(screen.getByTestId('cafe-back'));
    expect(await screen.findByTestId('cafe-mastered-count')).toHaveTextContent('5 of 19 drinks mastered');
    expect(document.querySelectorAll('.cafe-collect[data-mastered="true"]')).toHaveLength(5);
  });

  it('independent tier: no recipe card, answer hidden until asked; world café requires choosing a brewer', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/cafe?level=world&g=independent&seed=11';
    render(<App />);
    expect(await screen.findByTestId('cafe-ticket')).toBeInTheDocument();
    expect(screen.queryByTestId('cafe-recipe')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cafe-recipe-toggle')).not.toBeInTheDocument();
    expect(screen.getByText(/build from memory/)).toBeInTheDocument();

    await pick(user, 'cup', 'large');
    await user.click(screen.getByTestId('cafe-serve'));
    expect(screen.getByTestId('cafe-missing')).toHaveTextContent('Before serving, choose: Brewer.');

    // A brewer this order doesn't use → method diff, answer hidden in independent mode.
    const wrongMethod = (['espresso', 'moka', 'phin', 'ibrik', 'pot'] as const).find((m) => !getBuildSpec(currentDrink())!.accept.method.includes(m))!;
    await pick(user, 'method', wrongMethod);
    await user.click(screen.getByTestId('cafe-serve'));
    const fb = await screen.findByTestId('cafe-feedback');
    expect(within(fb).getByText('Brewer').closest('li')).toHaveAttribute('data-component', 'method');
    expect(screen.queryByTestId('cafe-cup-order')).not.toBeInTheDocument();
    expect(within(fb).queryByText(/^Order:/)).not.toBeInTheDocument();
    await user.click(screen.getByTestId('cafe-reveal'));
    expect(screen.getByTestId('cafe-cup-order')).toBeInTheDocument();
    expect(within(fb).getAllByText(/^Order:/).length).toBeGreaterThan(0);
    expect(getLearnerState().events[0]).toMatchObject({ guidance: 'independent', outcome: 'retry' });
  });

  it('assisted tier: recipe card on request (H) and recorded as viewed', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/cafe?level=milk&g=assisted&seed=5';
    render(<App />);
    expect(await screen.findByTestId('cafe-ticket')).toBeInTheDocument();
    expect(screen.queryByTestId('cafe-recipe')).not.toBeInTheDocument();
    await user.keyboard('h');
    expect(screen.getByTestId('cafe-recipe')).toBeInTheDocument();
    await user.click(screen.getByTestId('cafe-recipe-toggle'));
    expect(screen.queryByTestId('cafe-recipe')).not.toBeInTheDocument();
    await applyBuild(user, getBuildSpec(currentDrink())!.canonical);
    await user.click(screen.getByTestId('cafe-serve'));
    expect(getLearnerState().events[0]).toMatchObject({ guidance: 'assisted', score: 1 });
    expect(getLearnerState().events[0]!.notes).toMatch(/recipe-card-viewed/);
  });

  it('zh locale renders the counter in Chinese', async () => {
    act(() => learnerActions.updatePrefs({ locale: 'zh' }));
    window.location.hash = '#/cafe';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: '咖啡馆吧台' })).toBeInTheDocument();
    expect(screen.getByTestId('cafe-versions')).toHaveTextContent(/定义并不一样/);
    expect(screen.getByTestId('cafe-mastered-count')).toHaveTextContent('19 款中已掌握 0 款');
  });
});
