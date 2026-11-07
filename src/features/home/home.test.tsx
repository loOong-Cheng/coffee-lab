import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../app/App';
import { isCoreTrack, lessons, tracks } from '../../content';
import type { LearningEvent } from '../../domain/contracts';
import { createMemoryStorage, initLearnerStore, learnerActions } from '../../state';
import { orderTracks, pickPracticeActivity, progressSummary } from './summary';
import { applyQuickPick, defaultProfile, groupEquipment, toggle } from '../onboarding/profileDraft';
import { equipment } from '../../content';

const ev = (activityId: string, lessonId: string, evidence: LearningEvent['evidence'] = 'assessed_answer'): LearningEvent => ({
  id: activityId,
  activityId,
  lessonId,
  mode: 'desktop',
  guidance: 'guided',
  evidence,
  outcome: 'completed',
  recordedAt: '2026-11-07T00:00:00Z',
});

describe('progress summary', () => {
  it('counts mastered core lessons from checks, cups from the journal, sims separately', () => {
    const lesson = lessons.find((l) => l.id === 'lit-what-is-coffee')!;
    const events = [...lesson.checkForUnderstanding.map((id) => ev(id, lesson.id)), ev('esp-workflow-xr', 'esp-workflow', 'simulated')];
    const s = progressSummary(lessons, events, [{ id: 'b', evidence: 'self_report', drinkId: 'espresso', createdAt: '' }], isCoreTrack);
    expect(s.coreMastered).toBe(1);
    expect(s.coreTotal).toBe(lessons.filter((l) => isCoreTrack(l.track)).length);
    expect(s.cupsLogged).toBe(1);
    expect(s.simulatedDone).toBe(1);
    expect(s.optionalMastered).toBe(0);
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
