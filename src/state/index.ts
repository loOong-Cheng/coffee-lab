/** Public state API (CONTRACTS.md §3). Import from 'src/state', not from the internal files. */
export {
  useLearner,
  getLearnerState,
  learnerActions,
  subscribeLearner,
  usePersistenceStatus,
  getPersistenceStatus,
  initLearnerStore,
  type LearnerActions,
  type PersistenceStatus,
} from './store';
export { migrate, migrateWithReport, loadState, createDefaultState, createDefaultPrefs, type LoadStatus } from './migrate';
export {
  STORAGE_KEY,
  CORRUPT_BACKUP_KEY,
  RESET_BACKUP_KEY,
  createMemoryStorage,
  type StorageLike,
} from './storage';
// Pure derived selectors live in the domain layer; re-exported here for convenience.
export {
  lessonStatus,
  lessonProgress,
  lessonStatusMap,
  completedActivityIds,
  touchedActivityIds,
  requiredActivityIds,
  nextRecommendedLesson,
  lastEventFor,
  TRACK_PRIORITY,
  type LessonStatus,
  type LessonProgress,
  type LessonLike,
} from '../domain/progress';
