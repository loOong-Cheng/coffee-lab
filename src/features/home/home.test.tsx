import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../app/App';
import { isCoreTrack, lessons, tracks } from '../../content';
import type { LearningEvent } from '../../domain/contracts';
import { createMemoryStorage, initLearnerStore, learnerActions } from '../../state';
import { lessonAutonomy } from '../lesson/autonomy';
import { orderTracks, pickPracticeActivity, progressSummary } from './summary';
import { applyQuickPick, defaultProfile, groupEquipment, toggle } from '../onboarding/profileDraft';
import { equipment } from '../../content';

const ev = (
  activityId: string,
  lessonId: string,
  evidence: LearningEvent['evidence'] = 'assessed_answer',
  guidance: LearningEvent['guidance'] = 'guided',
): LearningEvent => ({
  id: `${activityId}-${guidance}`,
  activityId,
  lessonId,
  mode: 'desktop',
  guidance,
  evidence,
  outcome: 'completed',
  recordedAt: '2026-11-07T00:00:00Z',
});

describe('progress summary', () => {
  it('counts completed core lessons from checks, cups from the journal, sims separately', () => {
    const lesson = lessons.find((l) => l.id === 'lit-what-is-coffee')!;
    const events = [...lesson.checkForUnderstanding.map((id) => ev(id, lesson.id)), ev('esp-workflow-xr', 'esp-workflow', 'simulated')];
    const s = progressSummary(lessons, events, [{ id: 'b', evidence: 'self_report', drinkId: 'espresso', createdAt: '' }], isCoreTrack);
    expect(s.coreCompleted).toBe(1);
    expect(s.coreIndependent).toBe(0); // guided completion is NOT "mastered" (QA-08)
    expect(s.coreTotal).toBe(lessons.filter((l) => isCoreTrack(l.track)).length);
    expect(s.cupsLogged).toBe(1);
    expect(s.simulatedDone).toBe(1);
    expect(s.optionalCompleted).toBe(0);
  });

  it('lesson autonomy = the weakest tier any check was completed at; only Independent counts as mastered (QA-08)', () => {
    const lesson = lessons.find((l) => l.id === 'esp-workflow')!;
    const checks = lesson.checkForUnderstanding;
    expect(checks.length).toBeGreaterThan(1);
    expect(lessonAutonomy(lesson, [])).toBeNull();
    expect(lessonAutonomy(lesson, checks.slice(1).map((id) => ev(id, lesson.id)))).toBeNull(); // one check open
    const guided = checks.map((id) => ev(id, lesson.id, 'assessed_answer', 'guided'));
    expect(lessonAutonomy(lesson, guided)).toBe('guided');
    const mixed = [...guided, ...checks.slice(1).map((id) => ev(id, lesson.id, 'assessed_answer', 'independent'))];
    expect(lessonAutonomy(lesson, mixed)).toBe('guided'); // weakest link
    const allIndependent = [...guided, ...checks.map((id) => ev(id, lesson.id, 'assessed_answer', 'independent'))];
    expect(lessonAutonomy(lesson, allIndependent)).toBe('independent');
    const s = progressSummary(lessons, allIndependent, [], isCoreTrack);
    expect(s).toMatchObject({ coreCompleted: 1, coreIndependent: 1 });
    // Reading-only checks have no tiers → plain "completed", never "mastered".
    expect(lessonAutonomy({ activityIds: ['a'], checkForUnderstanding: ['a'] }, [ev('a', 'x')], () => 'explain')).toBe('untiered');
  });

  it('orders core tracks by goal and puts optional tracks last', () => {
    const ordered = orderTracks(tracks, ['literacy', 'pourover', 'espresso', 'explore', 'culture']).map((t) => t.id);
    expect(ordered.slice(0, 3)).toEqual(['literacy', 'pourover', 'espresso']);
    expect(ordered.slice(3).every((id) => tracks.find((t) => t.id === id)?.optional)).toBe(true);
  });

  it('picks the real-cup guide by goal, then by owned gear', () => {
    expect(pickPracticeActivity('espresso', [])).toBe('esp-first-real-shot-guide');
    expect(pickPracticeActivity('pourover', ['espresso-machine'])).toBe('po-first-real-cup-guide');
    expect(pickPracticeActivity('explore', ['espresso-machine'])).toBe('esp-first-real-shot-guide');
    expect(pickPracticeActivity('explore', ['dripper'])).toBe('po-first-real-cup-guide');
  });
});

describe('onboarding helpers', () => {
  it('quick picks add catalog ids and remove them from the wishlist', () => {
    const catalog = new Set(equipment.map((e) => e.id));
    const r = applyQuickPick([], ['grinder', 'kettle'], ['espresso-machine', 'grinder', 'not-a-thing'], catalog);
    expect(r.owned).toEqual(['espresso-machine', 'grinder']);
    expect(r.wishlist).toEqual(['kettle']);
    expect(toggle(['a'], 'a')).toEqual([]);
    expect(groupEquipment(equipment)[0]!.category).toBe('espresso');
    expect(defaultProfile(null, 'desktop')).toMatchObject({ goal: 'espresso', experience: 'new', devices: ['pc'] });
  });
});

describe('home page', () => {
  beforeEach(() => {
    initLearnerStore(createMemoryStorage());
    act(() => {
      learnerActions.updatePrefs({ locale: 'en' });
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

  it('desktop: course map with core + optional tracks, recommended lesson and honest stats', async () => {
    window.location.hash = '#/';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Your coffee course' })).toBeInTheDocument();
    expect(screen.getByTestId('home-next-lesson')).toHaveAttribute('href', '#/learn/lit-what-is-coffee');
    const map = screen.getByRole('region', { name: 'Course map' });
    for (const t of tracks) expect(within(map).getByRole('heading', { level: 3, name: new RegExp(t.title.en) })).toBeInTheDocument();
    expect(within(map).getAllByText('Optional').length).toBeGreaterThan(0);
    expect(screen.getByTestId('stat-cups')).toHaveTextContent('0');
    expect(screen.getAllByText('Self-reported').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Core lessons completed').length).toBeGreaterThan(0);
    expect(screen.queryByText(/mastered/i)).not.toBeInTheDocument();
  });

  it('a guided completion says "Completed with guidance", an independent one "Mastered independently" (QA-08)', async () => {
    const guided = lessons.find((l) => l.id === 'lit-what-is-coffee')!;
    const indep = lessons.find((l) => l.id === 'esp-workflow')!;
    act(() => {
      for (const id of guided.checkForUnderstanding)
        learnerActions.recordEvent({ activityId: id, lessonId: guided.id, mode: 'desktop', guidance: 'guided', evidence: 'assessed_answer', outcome: 'completed', score: 1 });
      for (const id of indep.checkForUnderstanding)
        learnerActions.recordEvent({ activityId: id, lessonId: indep.id, mode: 'desktop', guidance: 'independent', evidence: 'assessed_answer', outcome: 'completed', score: 1 });
    });
    window.location.hash = '#/';
    render(<App />);
    await screen.findByRole('heading', { level: 1, name: 'Your coffee course' });
    const g = document.querySelector(`.home-lesson[data-lesson="${guided.id}"]`)!;
    const i = document.querySelector(`.home-lesson[data-lesson="${indep.id}"]`)!;
    expect(g).toHaveTextContent('Completed with guidance');
    expect(g).not.toHaveTextContent(/mastered/i);
    expect(i).toHaveTextContent('Mastered independently');
    expect(screen.getByTestId('stat-mastered')).toHaveTextContent('2/');
    expect(screen.getByTestId('stat-independent')).toHaveTextContent('1 mastered independently');
  });

  it('phone mode: a short "today" focus with a big real-cup button', async () => {
    act(() => learnerActions.setProfile({ ...JSON.parse(JSON.stringify(defaultProfile(null, 'mobile'))) }));
    window.location.hash = '#/';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Your coffee course' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Today’s focus' })).toBeInTheDocument();
    expect(screen.getByTestId('home-real-cup')).toHaveAttribute('href', '#/practice/esp-first-real-shot-guide');
    expect(screen.queryByRole('region', { name: 'Course map' })).not.toBeInTheDocument();
  });
});
