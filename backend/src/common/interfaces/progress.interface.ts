import { Timestamp } from 'firebase-admin/firestore';

/**
 * BodyMetrics interface for tracking physical measurements over time
 */
export interface BodyMetrics {
  /**
   * Height in centimeters
   */
  height: number;

  /**
   * Weight in kilograms
   */
  weight: number;

  /**
   * Body fat percentage (optional)
   */
  bodyFat?: number;

  /**
   * Muscle mass in kilograms (optional)
   */
  muscleMass?: number;

  /**
   * Timestamp when the metrics were recorded
   */
  recordedAt: Timestamp;
}

/**
 * ExerciseProgress interface for tracking progress on individual exercises
 */
export interface ExerciseProgress {
  /**
   * Reference to the exercise
   */
  exerciseId: string;

  /**
   * Exercise name for quick reference
   */
  exerciseName: string;

  /**
   * Cached exercise category or primary muscle group for denormalized lookups
   */
  category?: string;

  /**
   * Personal record for this exercise
   */
  personalRecord: {
    weight: number;
    reps: number;
  };

  /**
   * Cumulative volume (weight × reps) for this exercise
   */
  totalVolume: number;

  /**
   * Timestamp when this exercise was last performed
   */
  lastPerformed: Timestamp;
}

/**
 * WorkoutSummary interface for session summaries
 */
export interface WorkoutSummary {
  /**
   * Reference to the session document
   */
  sessionId: string;

  /**
   * Date of the workout
   */
  date: Timestamp;

  /**
   * Duration of the workout in minutes
   */
  duration: number;

  /**
   * Number of exercises completed
   */
  exercisesCompleted: number;

  /**
   * Total number of sets completed
   */
  totalSets: number;

  /**
   * Total volume (weight × reps) for the workout
   */
  totalVolume: number;

  /**
   * UID of the workout partner (optional)
   */
  partnerUid?: string;
}

/**
 * UserProgress interface representing a user's progress document in Firestore progress collection
 * Tracks overall fitness journey including body metrics, exercise progress, and workout history
 */
export interface UserProgress {
  /**
   * User ID (document ID)
   */
  uid: string;

  /**
   * History of body metrics sorted by date
   */
  bodyMetricsHistory: BodyMetrics[];

  /**
   * Map of exerciseId to progress data
   */
  exerciseProgress: Record<string, ExerciseProgress>;

  /**
   * Array of workout summary references
   */
  workoutHistory: WorkoutSummary[];

  /**
   * Total number of workouts completed
   */
  totalWorkouts: number;

  /**
   * Current consecutive days streak
   */
  currentStreak: number;

  /**
   * Longest consecutive days streak
   */
  longestStreak: number;

  /**
   * Lifetime total volume (weight × reps) across all workouts
   */
  lifetimeVolume: number;

  /**
   * Timestamp when the progress was last updated
   */
  updatedAt: Timestamp;
}
