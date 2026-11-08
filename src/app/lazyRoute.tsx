/**
 * Retryable lazy routes (QA-01).
 *
 * React.lazy() remembers a rejected import forever, so one dropped connection (or a chunk that went
 * missing after a deploy) would leave that screen on the error page until a full reload. Each route
 * made with lazyRoute() records its failure here; the error boundary calls retryFailedRoutes() when the
 * learner presses "Try again", goes home or navigates, which swaps in a fresh lazy component so the
 * next render downloads the chunk again.
 *
 * Swapping happens ONLY on that explicit call — never automatically on failure — so React's own
 * re-render after an error can't turn into an endless download loop while offline.
 */
import { lazy, type ComponentProps, type ComponentType, type LazyExoticComponent } from 'react';

const pendingResets = new Set<() => void>();

/** Re-arms every route whose chunk failed to load. Returns how many were re-armed. */
export function retryFailedRoutes(): number {
  const resets = [...pendingResets];
  pendingResets.clear();
  for (const reset of resets) reset();
  return resets.length;
}

/** True for the errors browsers / Vite raise when a code-split chunk can't be downloaded. */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === 'ChunkLoadError') return true;
  return (
    typeof message === 'string' &&
    /dynamically imported module|Importing a module script failed|Unable to preload CSS|Loading (CSS )?chunk|error loading dynamically/i.test(message)
  );
}

// `any`: route components take arbitrary props; the wrapper forwards them unchanged.
export function lazyRoute<C extends ComponentType<any>>(factory: () => Promise<{ default: C }>): ComponentType<ComponentProps<C>> {
  let current: LazyExoticComponent<C>;
  const reset = () => {
    current = make();
  };
  const make = () =>
    lazy(() =>
      factory().catch((error: unknown) => {
        pendingResets.add(reset);
        throw error;
      }),
    );
  current = make();

  function LazyRoute(props: ComponentProps<C>) {
    const Current = current;
    return <Current {...props} />;
  }
  return LazyRoute;
}
