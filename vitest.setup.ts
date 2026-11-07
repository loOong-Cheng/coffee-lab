import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// jsdom does not implement scrolling; the shell scrolls to top on navigation.
window.scrollTo = (() => {}) as typeof window.scrollTo;

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* storage unavailable in this test — fine */
  }
});

afterEach(() => {
  cleanup();
});
