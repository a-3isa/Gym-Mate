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
}
