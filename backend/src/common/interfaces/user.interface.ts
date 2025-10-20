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
   * Avatar visual customization configuration.
   * Stores user's visual preferences for their avatar appearance.
   * This is separate from progression data (avatarLevel, avatarMuscleGroups).
   * These choices are applied as overlays/modifications to the base avatar rendering.
   */
  avatarConfig?: {
    /** Body type: affects base avatar proportions */
    bodyType?: 'slim' | 'athletic' | 'muscular' | 'heavy';
    /** Skin tone: hex color code for avatar skin color */
    skinTone?: string;
    /** Hair style: determines hair shape/length */
    hairStyle?: 'bald' | 'short' | 'medium' | 'long' | 'curly' | 'buzz';
    /** Hair color: hex color code for hair */
    hairColor?: string;
    /** Clothing style: determines outfit type */
    clothingStyle?: 'tank' | 'tshirt' | 'hoodie' | 'sports-bra' | 'compression';
    /** Clothing color: hex color code for outfit */
    clothingColor?: string;
  };

  /**
   * Timestamp of the last avatar level-up event
   * Used for triggering evolution notifications and tracking progression milestones
   */
  lastEvolution?: Timestamp;
}
