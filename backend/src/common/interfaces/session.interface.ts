import { Timestamp } from 'firebase-admin/firestore';

/**
 * SessionParticipant interface representing a participant in a workout session
 */
export interface SessionParticipant {
  /**
   * User ID of the participant
   */
  uid: string;

  /**
   * Display name of the participant
   */
  displayName: string;

  /**
   * Current status of the participant in the session
   */
  status: 'invited' | 'accepted' | 'declined' | 'active' | 'resting';
}

/**
 * SessionExercise interface representing an exercise within a workout session
 */
export interface SessionExercise {
  /**
   * Reference to the exercises collection document
   */
  exerciseId: string;

  /**
   * Exercise name (denormalized for quick access)
   */
  exerciseName: string;

  /**
   * Target number of sets for this exercise
   */
  targetSets: number;

  /**
   * Number of completed sets (default: 0)
   */
  completedSets: number;
}

/**
 * SetRecord interface representing a completed set in a workout session
 */
export interface SetRecord {
  /**
   * User ID of the participant who completed the set
   */
  participantUid: string;

  /**
   * Reference to the exercise
   */
  exerciseId: string;

  /**
   * Set number (1-based)
   */
  setNumber: number;

  /**
   * Weight used in kilograms
   */
  weight: number;

  /**
   * Number of repetitions completed
   */
  reps: number;

  /**
   * Timestamp when the set was completed
   */
  completedAt: Timestamp;
}

/**
 * Session interface representing a workout session document in Firestore sessions collection
 * Supports collaborative workouts between two users with real-time synchronization
 */
export interface Session {
  /**
   * Document ID
   */
  id: string;

  /**
   * Array of participants (max 2 for Phase 1)
   */
  participants: SessionParticipant[];

  participantUids: string[]; // maintained in parallel with `participants`

  /**
   * Array of exercises planned for this session
   */
  exercises: SessionExercise[];

  /**
   * Current status of the session
   */
  status: 'pending' | 'active' | 'completed' | 'cancelled';

  /**
   * UID of the participant whose turn it is to perform
   */
  currentTurn: string;

  /**
   * Index of the current exercise being performed
   */
  currentExerciseIndex: number;

  /**
   * Array of all completed sets in this session
   */
  sets: SetRecord[];

  /**
   * UID of the user who created the session
   */
  createdBy: string;

  /**
   * Timestamp when the session was created
   */
  createdAt: Timestamp;

  /**
   * Timestamp when the session was started (optional)
   */
  startedAt?: Timestamp;

  /**
   * Timestamp when the session was completed (optional)
   */
  completedAt?: Timestamp;
}
