/**
 * Firestore collection name constants
 * These constants ensure consistency across the application and prevent typos
 */

/**
 * Main collection names
 */
export const COLLECTIONS = {
  /**
   * Users collection - stores user profiles
   */
  USERS: 'users',

  /**
   * Exercises collection - stores exercise library
   */
  EXERCISES: 'exercises',

  /**
   * Sessions collection - stores workout sessions
   */
  SESSIONS: 'sessions',

  /**
   * Progress collection - stores user progress and statistics
   */
  PROGRESS: 'progress',
} as const;

/**
 * Subcollection names (for nested collections in Phase 2)
 */
export const SUBCOLLECTIONS = {
  /**
   * Body metrics subcollection under user documents
   */
  BODY_METRICS: 'bodyMetrics',

  /**
   * Workout history subcollection under user documents
   */
  WORKOUT_HISTORY: 'workoutHistory',
} as const;
