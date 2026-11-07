import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

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
