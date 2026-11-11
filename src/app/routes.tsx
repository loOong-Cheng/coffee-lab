/**
 * The ONE route table (CONTRACTS.md §8). Hash routing (works on any static host, no server rewrites).
 * Every page is a lazily loaded chunk; /xr is the only chunk allowed to pull in Babylon.js.
 * lazyRoute() (not bare React.lazy) so a chunk that failed to download can be retried (QA-01).
 */
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import NotFound from './NotFound';
import { lazyRoute } from './lazyRoute';
import { RequireProfile } from './RequireProfile';
import { RouteFallback } from './RouteFallback';

const Home = lazyRoute(() => import('../features/home'));
const Onboarding = lazyRoute(() => import('../features/onboarding'));
const Lesson = lazyRoute(() => import('../features/lesson'));
const Practice = lazyRoute(() => import('../features/practice'));
const Journal = lazyRoute(() => import('../features/journal'));
const Atlas = lazyRoute(() => import('../features/atlas'));
const Settings = lazyRoute(() => import('../features/settings'));
const Cafe = lazyRoute(() => import('../features/cafe'));
const Culture = lazyRoute(() => import('../features/culture'));
const Brands = lazyRoute(() => import('../features/brands'));
const XrRoute = lazyRoute(() => import('../xr/XrRoute'));
/** DEV-ONLY UI gallery. `import.meta.env.DEV` is statically false in production builds, so the chunk is dropped. */
const UiGallery = import.meta.env.DEV ? lazy(() => import('../ui/Gallery')) : null;

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
  cafe: '/cafe',
  culture: '/culture',
  brands: '/brands',
  brand: (brandId: string) => `/brands/${encodeURIComponent(brandId)}`,
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
        <Route path="/cafe" element={<Cafe />} />
        <Route path="/culture" element={<Culture />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/brands/:brandId" element={<Brands />} />
        {UiGallery && <Route path="/dev/ui" element={<UiGallery />} />}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
