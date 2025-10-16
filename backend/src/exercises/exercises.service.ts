import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../firebase/services/firestore.service';
import { Exercise } from '../common/interfaces/exercise.interface';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Service for managing exercise library operations
 * Provides read-only access to exercises stored in Firestore
 * Exercises are managed via seed script, not through API endpoints
 */
@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  /**
   * Converts Firestore Timestamp fields to ISO strings for consistent API responses
   * @param exercise The exercise object from Firestore
   * @returns Exercise with converted timestamps
   */
  private convertTimestamps(exercise: Exercise): Exercise {
    return {
      ...exercise,
      createdAt:
        exercise.createdAt instanceof Timestamp
          ? exercise.createdAt.toDate().toISOString()
          : exercise.createdAt,
    };
  }

  constructor(private readonly firestoreService: FirestoreService) {}

  /**
   * Retrieves all exercises from the collection
   * @returns Promise<Exercise[]> Array of all exercises sorted alphabetically by name
   */
  async getAllExercises(): Promise<Exercise[]> {
    try {
      const snapshot = await this.firestoreService.getCollection(COLLECTIONS.EXERCISES).get();

      const exercises: Exercise[] = snapshot.docs.map((doc) =>
        this.convertTimestamps({
          ...doc.data(),
          id: doc.id,
        } as Exercise),
      );

      // Sort alphabetically by name
      exercises.sort((a, b) => a.name.localeCompare(b.name));

      this.logger.log(`Retrieved ${exercises.length} exercises`);
      return exercises;
    } catch (error: any) {
      this.logger.error('Failed to retrieve exercises', (error as Error)?.stack);
      throw new Error('Failed to retrieve exercises');
    }
  }

  /**
   * Retrieves exercises filtered by category
   * @param category The exercise category to filter by
   * @returns Promise<Exercise[]> Array of filtered exercises sorted alphabetically
   */
  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    try {
      const snapshot = await this.firestoreService.queryDocuments<Exercise>(COLLECTIONS.EXERCISES, [
        { field: 'category', operator: '==', value: category },
      ]);

      const exercises: Exercise[] = snapshot.docs.map((doc) =>
        this.convertTimestamps({
          ...doc.data(),
          id: doc.id,
        } as Exercise),
      );

      // Sort alphabetically by name
      exercises.sort((a, b) => a.name.localeCompare(b.name));

      this.logger.log(`Retrieved ${exercises.length} exercises for category: ${category}`);
      return exercises;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve exercises for category: ${category}`,
        (error as Error)?.stack,
      );
      throw new Error(`Failed to retrieve exercises for category: ${category}`);
    }
  }

  /**
   * Retrieves a single exercise by ID
   * @param id The exercise ID
   * @returns Promise<Exercise | null> The exercise object or null if not found
   */
  async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      const doc = await this.firestoreService.getCollection(COLLECTIONS.EXERCISES).doc(id).get();

      if (!doc.exists) {
        this.logger.log(`Exercise not found with ID: ${id}`);
        return null;
      }

      const exercise = this.convertTimestamps({
        ...doc.data(),
        id: doc.id,
      } as Exercise);

      this.logger.log(`Retrieved exercise: ${exercise.name}`);
      return exercise;
    } catch (error: any) {
      this.logger.error(`Failed to retrieve exercise with ID: ${id}`, (error as Error)?.stack);
      throw new Error(`Failed to retrieve exercise with ID: ${id}`);
    }
  }
}
