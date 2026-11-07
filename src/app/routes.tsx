/**
 * The ONE route table (CONTRACTS.md §8). Hash routing (works on any static host, no server rewrites).
 * Every page is a lazily loaded chunk; /xr is the only chunk allowed to pull in Babylon.js.
 */
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import NotFound from './NotFound';
import { RequireProfile } from './RequireProfile';
import { RouteFallback } from './RouteFallback';

const Home = lazy(() => import('../features/home'));
const Onboarding = lazy(() => import('../features/onboarding'));
const Lesson = lazy(() => import('../features/lesson'));
const Practice = lazy(() => import('../features/practice'));
const Journal = lazy(() => import('../features/journal'));
const Atlas = lazy(() => import('../features/atlas'));
const Settings = lazy(() => import('../features/settings'));
const XrRoute = lazy(() => import('../xr/XrRoute'));

export const ROUTE_PATHS = {
  home: '/',
  onboarding: '/onboarding',
  lesson: (lessonId: string) => `/learn/${encodeURIComponent(lessonId)}`,
  practice: (activityId: string) => `/practice/${encodeURIComponent(activityId)}`,
  journal: '/journal',
  atlas: '/atlas',
  drink: (drinkId: string) => `/atlas/${encodeURIComponent(drinkId)}`,
  xr: '/xr',
  settings: '/settings',
} as const;

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireProfile>
              <Home />
            </RequireProfile>
          }
        />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/learn/:lessonId" element={<Lesson />} />
        <Route path="/practice/:activityId" element={<Practice />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/atlas" element={<Atlas />} />
        <Route path="/atlas/:drinkId" element={<Atlas />} />
        <Route path="/xr" element={<XrRoute />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
