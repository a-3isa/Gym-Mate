import { Timestamp } from 'firebase-admin/firestore';

/**
 * User interface representing a user document in Firestore users collection
 */
export interface User {
  /**
   * Firebase Auth UID used as document ID
   */
  uid: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * Lowercased email used for case-insensitive lookups
   */
  emailLower?: string;

  /**
   * User's display name
   */
  displayName: string;

  /**
   * Firebase Storage download URL for avatar (optional)
   */
  photoURL?: string;

  /**
   * User's height in centimeters (optional)
   */
  height?: number;

  /**
   * User's weight in kilograms (optional)
   */
  weight?: number;

  /**
   * Timestamp when the user was created
   */
  createdAt: Timestamp;

  /**
   * Timestamp when the user was last updated
   */
  updatedAt: Timestamp;

  /**
   * Array of UIDs for friend relationships (optional)
   */
  friends?: string[];

  /**
   * Avatar level (1-50) representing overall progression
   * Default: 1, increases based on XP accumulation from workouts
   */
  avatarLevel?: number;

  /**
   * Total experience points accumulated from workouts
   * Used to calculate avatar level and progression
   */
  avatarXP?: number;

  /**
   * Muscle group development levels (1-10) for each body part
   * Each muscle group evolves independently based on targeted exercises
   * Higher levels represent greater muscle definition/size in avatar rendering
   */
  avatarMuscleGroups?: {
    chest: number;
    back: number;
    legs: number;
    shoulders: number;
    arms: number;
    core: number;
  };

  /**
   * Timestamp of the last avatar level-up event
   * Used for triggering evolution notifications and tracking progression milestones
   */
  lastEvolution?: Timestamp;
}
