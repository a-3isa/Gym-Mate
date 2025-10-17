/**
 * Session status enumeration
 */
export type SessionStatus = 'pending' | 'active' | 'completed' | 'cancelled';

/**
 * Muscle groups interface representing muscle development levels
 * Each muscle group has a level from 1-10 representing definition/size
 */
export interface MuscleGroups {
  chest: number;
  back: number;
  legs: number;
  shoulders: number;
  arms: number;
  core: number;
}

/**
 * Avatar state interface representing calculated avatar progression
 * Matches the backend AvatarState structure
 */
export interface AvatarState {
  /** Avatar level (1-50) representing overall progression */
  level: number;
  
  /** Current experience points accumulated */
  xp: number;
  
  /** Experience points required to reach the next level */
  xpToNextLevel: number;
  
  /** Individual muscle group development levels (1-10) */
  muscleGroups: MuscleGroups;
  
  /** Total number of completed workouts */
  totalWorkouts: number;
  
  /** Current consecutive workout day streak */
  currentStreak: number;
  
  /** Timestamp of the last avatar state calculation */
  lastUpdated: Date | string | { seconds: number; nanoseconds: number };
}

/**
 * User interface matching the backend User structure.
 * Represents a user profile stored in Firestore.
 */
export interface User {
  /** Firebase Auth UID */
  uid: string;
  
  /** User's email address */
  email: string;
  
  /** User's display name */
  displayName: string;
  
  /** URL to user's profile photo (optional) */
  photoURL?: string;
  
  /** User's height in centimeters (optional) */
  height?: number;
  
  /** User's weight in kilograms (optional) */
  weight?: number;
  
  /** Timestamp when the user was created */
  createdAt: Date | string | { seconds: number; nanoseconds: number };
  
  /** Timestamp when the user was last updated */
  updatedAt: Date | string | { seconds: number; nanoseconds: number };
  
  /** Array of friend UIDs (optional) */
  friends?: string[];
  
  /** Avatar level (1-50) representing overall progression */
  avatarLevel?: number;
  
  /** Total experience points accumulated from workouts */
  avatarXP?: number;
  
  /** Muscle group development levels (1-10) for each body part */
  avatarMuscleGroups?: MuscleGroups;
  
  /** Timestamp of the last avatar level-up event */
  lastEvolution?: Date | string | { seconds: number; nanoseconds: number };
}

/**
 * Exercise interface matching the backend Exercise structure.
 * Represents an exercise in the curated library.
 */
export interface Exercise {
  /** Unique exercise ID */
  id: string;
  
  /** Exercise name */
  name: string;
  
  /** Exercise category */
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';
  
  /** Muscle groups targeted by the exercise */
  muscleGroups: string[];
  
  /** Step-by-step instructions for performing the exercise */
  instructions: string;
  
  /** Optional video URL for demonstration */
  videoUrl?: string;
  
  /** Exercise difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  /** Equipment required for the exercise */
  equipment: string[];
  
  /** Timestamp when the exercise was created */
  createdAt: Date | string | { seconds: number; nanoseconds: number };
}

/**
 * Session participant interface matching the backend structure.
 * Represents a participant in a workout session.
 */
export interface SessionParticipant {
  /** User ID of the participant */
  uid: string;
  
  /** Display name of the participant */
  displayName: string;
  
  /** Participant's status in the session */
  status: 'invited' | 'accepted' | 'declined' | 'active' | 'resting';
}

/**
 * Session exercise interface matching the backend structure.
 * Represents an exercise within a workout session.
 */
export interface SessionExercise {
  /** Exercise ID */
  exerciseId: string;
  
  /** Exercise name (denormalized for quick access) */
  exerciseName: string;
  
  /** Number of sets to be performed */
  targetSets: number;
  
  /** Number of sets completed */
  completedSets: number;
}

/**
 * Set record interface matching the backend structure.
 * Represents a completed set in a workout session.
 */
export interface SetRecord {
  /** User ID of the participant who completed the set */
  participantUid: string;
  
  /** Exercise ID */
  exerciseId: string;
  
  /** Set number (1-based) */
  setNumber: number;
  
  /** Weight used in kilograms */
  weight: number;
  
  /** Number of repetitions performed */
  reps: number;
  
  /** Timestamp when the set was completed */
  completedAt: Date | string | { seconds: number; nanoseconds: number };
}

/**
 * Session interface matching the backend structure.
 * Represents a collaborative workout session between two users.
 */
export interface Session {
  /** Session ID */
  id: string;
  
  /** Array of session participants (max 2 for Phase 1) */
  participants: SessionParticipant[];
  
  /** Array of participant UIDs for quick access and queries */
  participantUids: string[];
  
  /** Exercises to be performed in the session */
  exercises: SessionExercise[];
  
  /** Optional proposed exercises from invited user awaiting creator confirmation */
  proposedExercises?: SessionExercise[];
  
  /** Flag indicating if session is awaiting creator confirmation of proposed exercises */
  awaitingCreatorConfirmation?: boolean;
  
  /** Current status of the session */
  status: SessionStatus;
  
  /** UID of the participant whose turn it is */
  currentTurn: string;
  
  /** Index of the current exercise being performed */
  currentExerciseIndex: number;
  
  /** Array of completed sets in the session */
  sets: SetRecord[];
  
  /** UID of the user who created the session */
  createdBy: string;
  
  /** Timestamp when the session was created */
  createdAt: Date | string | { seconds: number; nanoseconds: number };
  
  /** Timestamp when the session was started (optional) */
  startedAt?: Date | string | { seconds: number; nanoseconds: number };
  
  /** Timestamp when the session was completed (optional) */
  completedAt?: Date | string | { seconds: number; nanoseconds: number };
}
