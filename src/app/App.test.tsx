import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage, getLearnerState, initLearnerStore, learnerActions } from '../state';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';

beforeEach(() => {
  initLearnerStore(createMemoryStorage());
  act(() => learnerActions.updatePrefs({ locale: 'en' }));
  window.location.hash = '#/';
});

describe('App shell', () => {
  it('redirects to onboarding without a profile, then lands home after defaults', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome to Coffee Lab' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/onboarding');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start with defaults' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Your coffee course' })).toBeInTheDocument();
    expect(getLearnerState().profile?.goal).toBe('espresso');
  });

  it('language toggle switches UI text and <html lang>', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByText('Learn')).toBeInTheDocument();
    await user.click(screen.getByTestId('locale-toggle'));
    expect(within(screen.getByRole('navigation', { name: '主导航' })).getByText('学习')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(getLearnerState().prefs.locale).toBe('zh');
  });

  it('sound toggles are bound to prefs', async () => {
    const user = userEvent.setup();
    render(<App />);
    const sfx = screen.getByTestId('sfx-toggle');
    expect(sfx).toHaveAttribute('aria-pressed', 'true');
    await user.click(sfx);
    expect(getLearnerState().prefs.sfx).toBe(false);
    await user.click(screen.getByTestId('music-toggle'));
    expect(getLearnerState().prefs.music).toBe(true);
  });

  it('unknown routes show a 404 with a way home', async () => {
    window.location.hash = '#/definitely-not-a-page';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: "We couldn't find that page" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the course map' })).toBeInTheDocument();
  });

  it('a crashing page is contained by the error boundary', () => {
    const Boom = () => {
      throw new Error('kaboom');
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    spy.mockRestore();
  });
});
