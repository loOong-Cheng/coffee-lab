/**
 * Where the learner was inside a lesson, kept in the shared `lastLocation` (contract: "last place the
 * learner was, for continue") as the lesson URL itself, e.g. `/learn/esp-workflow?step=4&g=assisted`.
 * The URL already survives a reload; this also survives closing the app / coming back via the course map.
 */
import type { Guidance } from '../../domain/contracts';

const GUIDANCE: readonly Guidance[] = ['guided', 'assisted', 'independent'];

export function lessonPositionRoute(lessonId: string, index: number, guidance: Guidance): string {
  return `/learn/${encodeURIComponent(lessonId)}?step=${index + 1}&g=${guidance}`;
}

export function lessonDoneRoute(lessonId: string, guidance: Guidance): string {
  return `/learn/${encodeURIComponent(lessonId)}?done=1&g=${guidance}`;
}

/** The saved activity index (0-based) and tier for THIS lesson, or null if the saved place is elsewhere. */
export function parseLessonPosition(
  route: string | undefined | null,
  lessonId: string,
  activityCount: number,
): { index: number | null; guidance: Guidance | null } | null {
  if (!route) return null;
  const prefix = `/learn/${encodeURIComponent(lessonId)}`;
  const [path, query = ''] = route.split('?');
  if (path !== prefix) return null;
  const params = new URLSearchParams(query);
  const g = params.get('g');
  const guidance = GUIDANCE.includes(g as Guidance) ? (g as Guidance) : null;
  const step = Number.parseInt(params.get('step') ?? '', 10);
  const index = Number.isFinite(step) && step >= 1 && step <= activityCount ? step - 1 : null;
  return { index, guidance };
}
