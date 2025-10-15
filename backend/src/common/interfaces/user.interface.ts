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
}
