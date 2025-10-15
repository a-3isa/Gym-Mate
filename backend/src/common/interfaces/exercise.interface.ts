import { Timestamp } from 'firebase-admin/firestore';

/**
 * Exercise interface representing an exercise document in Firestore exercises collection
 */
export interface Exercise {
  /**
   * Auto-generated document ID
   */
  id: string;

  /**
   * Exercise name (e.g., 'Bench Press')
   */
  name: string;

  /**
   * Exercise category
   */
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';

  /**
   * Primary and secondary muscles targeted
   */
  muscleGroups: string[];

  /**
   * Step-by-step guide for performing the exercise
   */
  instructions: string;

  /**
   * Demo video URL (optional)
   */
  videoUrl?: string;

  /**
   * Exercise difficulty level
   */
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  /**
   * Required equipment (e.g., 'barbell', 'dumbbells')
   */
  equipment: string[];

  /**
   * Timestamp when the exercise was created
   */
  createdAt: Timestamp;
}
