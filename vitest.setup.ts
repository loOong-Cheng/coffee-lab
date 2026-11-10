import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// Lazily loaded routes are transformed on first import; on a cold run that can exceed RTL's 1 s default for findBy*/waitFor
// (App/home/lesson/cafe tests failed only on the first run). Give async queries more headroom.
configure({ asyncUtilTimeout: 5000 });

// jsdom does not implement scrolling; the shell scrolls to top on navigation.
if (typeof window !== 'undefined') window.scrollTo = (() => {}) as typeof window.scrollTo;

beforeEach(() => {
  try {
    globalThis.localStorage?.clear();
  } catch {
    /* storage unavailable in this test — fine */
  }
});

afterEach(() => {
  cleanup();
});
