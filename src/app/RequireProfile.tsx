import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useLearner } from '../state';

/** Redirects first-time learners (no profile yet) to onboarding. */
export function RequireProfile({ children }: { children: ReactNode }) {
  const hasProfile = useLearner((s) => s.profile !== null);
  if (!hasProfile) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
