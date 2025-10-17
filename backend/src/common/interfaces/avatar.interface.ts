import { Timestamp } from 'firebase-admin/firestore';

/**
 * Represents the calculated state of a user's avatar
 * This is computed dynamically based on workout progress and achievements
 *
 * The avatar progression system uses an XP-based algorithm where:
 * - Base XP is earned per workout (100 points)
 * - Streak multiplier increases XP (1 + currentStreak * 0.1)
 * - Volume bonus adds extra XP (totalVolume / 1000)
 * - Levels follow exponential growth: XP_required = 500 * (level ^ 1.5)
 *
 * Muscle groups evolve independently based on exercise categories:
 * - Each exercise category maps to a primary muscle group
 * - Volume and frequency determine muscle level (1-10)
 * - Higher levels result in more pronounced visual representation
 */
export interface AvatarState {
  /**
   * Avatar level (1-50) representing overall progression
   * Calculated from total XP using exponential threshold formula
   */
  level: number;

  /**
   * Current experience points accumulated
   * Increases with each workout based on volume, duration, and consistency
   */
  xp: number;

  /**
   * Experience points required to reach the next level
   * Follows exponential growth pattern for balanced progression
   */
  xpToNextLevel: number;

  /**
   * Individual muscle group development levels (1-10)
   * Each muscle group evolves based on targeted exercise volume and frequency
   */
  muscleGroups: {
    chest: number;
    back: number;
    legs: number;
    shoulders: number;
    arms: number;
    core: number;
  };

  /**
   * Total number of completed workouts
   * Used for statistics and achievement tracking
   */
  totalWorkouts: number;

  /**
   * Current consecutive workout day streak
   * Provides XP multiplier bonus for consistency
   */
  currentStreak: number;

  /**
   * Timestamp of the last avatar state calculation
   * Used for cache validation and update tracking
   */
  lastUpdated: Timestamp;
}

/**
 * Represents an avatar level-up event
 * Generated when a user's avatar advances to a new level after completing a session
 * Used to trigger celebration animations and notifications in the mobile app
 */
export interface AvatarEvolution {
  /**
   * The avatar level before the evolution
   */
  previousLevel: number;

  /**
   * The new avatar level after evolution
   * Always greater than previousLevel (typically +1)
   */
  newLevel: number;

  /**
   * Array of muscle group names that increased in level
   * Used to highlight specific improvements in the evolution animation
   * Example: ['chest', 'arms'] if chest and arms muscle levels increased
   */
  muscleGroupsGained: string[];

  /**
   * Timestamp when the evolution occurred
   * Corresponds to session completion time
   */
  timestamp: Timestamp;
}
