import { defineConfig, devices } from '@playwright/test';

// Concurrent runs (e.g. parallel agents) must isolate port, build dir and output dirs:
//   E2E_PORT=4175 E2E_DIST=.e2e/dist-a E2E_OUT=.e2e/out-a npm run test:e2e
const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DIST = process.env.E2E_DIST ?? 'dist';
const OUT = process.env.E2E_OUT ?? 'test-results';

/**
 * Smoke tests run against the PRODUCTION build (vite build + vite preview) on a fixed port.
 * If a server is already listening on 4173 it is reused (locally) — make sure it is a fresh build.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  outputDir: OUT,
  reporter: [['list'], ['html', { open: 'never', outputFolder: `${OUT}-report` }]],
  use: {
    baseURL: BASE_URL,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx vite build --outDir ${DIST} --emptyOutDir && npx vite preview --outDir ${DIST} --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-chromium',
      // Pixel 7 descriptor: isMobile + hasTouch, Chromium engine.
      use: { ...devices['Pixel 7'] },
    },
  ],
});
