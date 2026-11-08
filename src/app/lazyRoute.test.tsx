import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage, initLearnerStore, learnerActions } from '../state';
import { ErrorBoundary } from './ErrorBoundary';
import { isChunkLoadError, lazyRoute, retryFailedRoutes } from './lazyRoute';

const chunkError = () => new TypeError('Failed to fetch dynamically imported module: http://x/assets/practice-abc.js');

function Page() {
  return <h1>Kitchen mode</h1>;
}

/** A factory that fails `failures` times (like a dropped connection), then succeeds. */
function flakyFactory(failures: number) {
  let calls = 0;
  const factory = vi.fn(() => {
    calls += 1;
    return calls <= failures ? Promise.reject(chunkError()) : Promise.resolve({ default: Page });
  });
  return factory;
}

function Harness({ Route, routeKey = 'a' }: { Route: React.ComponentType; routeKey?: string }) {
  return (
    <ErrorBoundary resetKey={routeKey}>
      <Suspense fallback={<p>Loading…</p>}>
        <Route />
      </Suspense>
    </ErrorBoundary>
  );
}

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  initLearnerStore(createMemoryStorage());
  act(() => learnerActions.updatePrefs({ locale: 'en' }));
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  retryFailedRoutes();
  errorSpy.mockRestore();
});

describe('lazyRoute + ErrorBoundary (QA-01)', () => {
  it('"Try again" downloads the screen again after a failed chunk load', async () => {
    const user = userEvent.setup();
    const factory = flakyFactory(1);
    const Route = lazyRoute(factory);
    render(<Harness Route={Route} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    // Download-specific copy, not a generic crash message.
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn’t be downloaded|seem to be offline/);
    expect(screen.getByTestId('error-boundary')).toHaveAttribute('data-kind', 'download');
    // No automatic retry loop while the error is on screen.
    expect(factory).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Kitchen mode' })).toBeInTheDocument();
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('navigating away and back re-arms a failed screen (no sticky error)', async () => {
    const factory = flakyFactory(1);
    const Route = lazyRoute(factory);
    const Other = () => <h1>Home</h1>;
    const { rerender } = render(<Harness Route={Route} routeKey="/practice" />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    rerender(<Harness Route={Other} routeKey="/" />);
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    rerender(<Harness Route={Route} routeKey="/practice" />);
    expect(await screen.findByRole('heading', { name: 'Kitchen mode' })).toBeInTheDocument();
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('after repeated failed retries it recommends reloading the page', async () => {
    const user = userEvent.setup();
    const factory = flakyFactory(10);
    const Route = lazyRoute(factory);
    render(<Harness Route={Route} />);
    await screen.findByRole('alert');
    expect(screen.queryByTestId('error-reload-hint')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('alert');
    expect(screen.queryByTestId('error-reload-hint')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('error-reload-hint')).toHaveTextContent(/reload the whole page/);
    expect(screen.getByRole('button', { name: 'Reload page' })).toHaveAttribute('data-variant', 'primary');
    expect(factory).toHaveBeenCalledTimes(3);
  });

  it('a plain render crash keeps the generic copy', () => {
    const Boom = () => {
      throw new Error('kaboom');
    };
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toHaveAttribute('data-kind', 'crash');
    expect(screen.getByRole('alert')).toHaveTextContent('This page hit an error');
  });

  it('recognises chunk-load errors from Chromium, Firefox, Safari and Vite', () => {
    expect(isChunkLoadError(chunkError())).toBe(true);
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module: x.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/a.css'))).toBe(true);
    expect(isChunkLoadError(new Error('kaboom'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});
