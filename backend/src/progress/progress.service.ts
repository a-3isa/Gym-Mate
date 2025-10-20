import { Injectable, Logger } from '@nestjs/common';
import { Timestamp, Transaction } from 'firebase-admin/firestore';
import { FirestoreService } from '../firebase/services/firestore.service';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import {
  UserProgress,
  WorkoutSummary,
  ExerciseProgress,
} from '../common/interfaces/progress.interface';
import { Session, SetRecord } from '../common/interfaces/session.interface';
import { Exercise } from '../common/interfaces/exercise.interface';

/**
 * Service for tracking user workout progress and statistics
 * Manages UserProgress documents including workout history, streaks, and personal records
 */
@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly firestoreService: FirestoreService) {}

  /**
   * Retrieves or creates a UserProgress document for the given user
   * @param userId - The user's UID
   * @returns The user's progress document, created with defaults if it doesn't exist
   */
  async getOrCreateProgress(userId: string): Promise<UserProgress> {
    try {
      const progressRef = this.firestoreService.getCollection(COLLECTIONS.PROGRESS).doc(userId);

      const progressDoc = await progressRef.get();

      if (progressDoc.exists) {
        return { uid: progressDoc.id, ...progressDoc.data() } as UserProgress;
      }

      // Create new progress document with default values
      const newProgress: Omit<UserProgress, 'uid'> = {
        totalWorkouts: 0,
        currentStreak: 0,
        longestStreak: 0,
        workoutHistory: [],
        exerciseProgress: {},
        bodyMetricsHistory: [],
        lifetimeVolume: 0,
        updatedAt: Timestamp.now(),
      };

      await progressRef.set(newProgress);
      this.logger.log(`Created new progress document for user ${userId}`);

      return { uid: userId, ...newProgress } as UserProgress;
    } catch (error) {
      this.logger.error(`Failed to get or create progress for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Updates user progress after completing a workout session
   * Calculates workout metrics, updates streaks, and tracks personal records
   * @param userId - The user's UID
   * @param session - The completed workout session
   */
  async updateProgressAfterSession(userId: string, session: Session): Promise<void> {
    try {
      const duration =
        session.completedAt && session.startedAt
          ? (session.completedAt.toMillis() - session.startedAt.toMillis()) / 1000 / 60
          : 0;

      const userSets = session.sets?.filter((set) => set.participantUid === userId) || [];
      const exercisesCompleted = new Set(userSets.map((s) => s.exerciseId)).size;
      const totalSets = userSets.length;
      const totalVolume = userSets.reduce(
        (total, set: SetRecord) => total + set.weight * set.reps,
        0,
      );

      const workoutSummary: WorkoutSummary = {
        sessionId: session.id || '',
        date: session.completedAt || Timestamp.now(),
        duration,
        exercisesCompleted,
        totalSets,
        totalVolume,
      };

      const shouldIncrement = userSets.length > 0;
      const currentStreak = shouldIncrement
        ? await this.calculateStreak(userId, session.completedAt)
        : undefined;

      await this.firestoreService.runTransaction(async (transaction) => {
        const progressRef = this.firestoreService.getCollection(COLLECTIONS.PROGRESS).doc(userId);
        const progressSnap = await transaction.get(progressRef);

        let progressData: Omit<UserProgress, 'uid'>;

        if (progressSnap.exists) {
          progressData = progressSnap.data() as Omit<UserProgress, 'uid'>;
        } else {
          progressData = {
            totalWorkouts: 0,
            currentStreak: 0,
            longestStreak: 0,
            workoutHistory: [],
            exerciseProgress: {},
            bodyMetricsHistory: [],
            lifetimeVolume: 0,
            updatedAt: Timestamp.now(),
          };

          transaction.set(progressRef, progressData);
        }

        const exerciseProgress = { ...(progressData.exerciseProgress || {}) } as Record<
          string,
          ExerciseProgress
        >;

        if (shouldIncrement) {
          const updatedHistory = [
            workoutSummary,
            ...(progressData.workoutHistory || []).slice(0, 99),
          ];

          const categoryCache = new Map<string, string | null>();

          const sessionExerciseLookup = new Map(
            (session.exercises || []).map((exercise) => [
              exercise.exerciseId,
              exercise.exerciseName,
            ]),
          );

          for (const set of userSets) {
            const exerciseId = set.exerciseId;

            if (!exerciseProgress[exerciseId]) {
              exerciseProgress[exerciseId] = {
                exerciseId,
                exerciseName: sessionExerciseLookup.get(exerciseId) || '',
                category: undefined,
                totalVolume: 0,
                personalRecord: {
                  weight: 0,
                  reps: 0,
                },
                lastPerformed: Timestamp.now(),
              };
            }

            const ep = exerciseProgress[exerciseId];
            if (!ep.exerciseName) {
              ep.exerciseName = sessionExerciseLookup.get(exerciseId) || ep.exerciseName;
            }

            if (!ep.category) {
              const category = await this.resolveExerciseCategory(
                transaction,
                exerciseId,
                categoryCache,
              );
              if (category) {
                ep.category = category;
              }
            }

            ep.totalVolume += set.weight * set.reps;
            ep.lastPerformed = session.completedAt || Timestamp.now();

            if (set.weight > ep.personalRecord.weight) {
              ep.personalRecord.weight = set.weight;
              ep.personalRecord.reps = set.reps;
            } else if (
              set.weight === ep.personalRecord.weight &&
              set.reps > ep.personalRecord.reps
            ) {
              ep.personalRecord.reps = set.reps;
            }
          }

          const updates: Partial<Omit<UserProgress, 'uid'>> = {
            workoutHistory: updatedHistory,
            exerciseProgress,
            lifetimeVolume: (progressData.lifetimeVolume || 0) + totalVolume,
            updatedAt: Timestamp.now(),
          };

          if (typeof currentStreak === 'number') {
            updates.totalWorkouts = (progressData.totalWorkouts || 0) + 1;
            updates.currentStreak = currentStreak;
            updates.longestStreak = Math.max(currentStreak, progressData.longestStreak || 0);
          }

          transaction.update(progressRef, updates);
        } else {
          // No increments -> do not alter history or exercise progress
          transaction.update(progressRef, {
            updatedAt: Timestamp.now(),
          });
        }
      });

      this.logger.log(`Updated progress for user ${userId} after session ${session.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to update progress for user ${userId} after session ${session.id}`,
        error,
      );
      throw error;
    }
  }

  private async resolveExerciseCategory(
    transaction: Transaction,
    exerciseId: string,
    cache: Map<string, string | null>,
  ): Promise<string | null> {
    if (cache.has(exerciseId)) {
      return cache.get(exerciseId) ?? null;
    }

    try {
      const exerciseRef = this.firestoreService
        .getCollection<Exercise>(COLLECTIONS.EXERCISES)
        .doc(exerciseId);
      const exerciseSnap = await transaction.get(exerciseRef);

      if (exerciseSnap.exists) {
        const exerciseData = exerciseSnap.data() as Exercise;
        const category = exerciseData?.category ?? null;
        cache.set(exerciseId, category);
        return category;
      }
    } catch (error) {
      this.logger.warn(`Failed to resolve category for exercise ${exerciseId}`, error);
    }

    cache.set(exerciseId, null);
    return null;
  }

  /**
   * Calculates the current workout streak for a user
   * Streak rules:
   * - Same day workouts count as one day
   * - Next day workout continues the streak
   * - Gap of more than one day breaks the streak
   * @param userId - The user's UID
   * @param lastWorkoutDate - Optional date of the last workout
   * @returns Current streak count in days
   */
  async calculateStreak(userId: string, _lastWorkoutDate?: Timestamp | null): Promise<number> {
    try {
      // Query recent sessions to determine streak
      const sessionsRef = this.firestoreService
        .getCollection(COLLECTIONS.SESSIONS)
        .where('participantUids', 'array-contains', userId)
        .where('status', '==', 'completed')
        .orderBy('completedAt', 'desc')
        .limit(30); // Check last 30 sessions for streak

      const sessionsSnapshot = await sessionsRef.get();

      if (sessionsSnapshot.empty) {
        return 0;
      }

      const sessions = sessionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Session[];

      // Group sessions by UTC date (ignoring time) using ISO date strings
      const workoutDates = new Set<string>();

      sessions.forEach((session) => {
        if (session.completedAt) {
          // Use UTC date string to avoid timezone issues
          const isoDateString = session.completedAt.toDate().toISOString().slice(0, 10);
          workoutDates.add(isoDateString);
        }
      });

      // Convert to sorted array of UTC midnight epochs
      const sortedDateEpochs = Array.from(workoutDates)
        .map((dateStr) => {
          const [year, month, day] = dateStr.split('-').map(Number);
          // Use Date.UTC to get UTC midnight epoch
          return Date.UTC(year, month - 1, day); // month is 0-indexed in Date.UTC
        })
        .sort((a, b) => b - a); // Most recent first

      if (sortedDateEpochs.length === 0) {
        return 0;
      }

      // Calculate streak using UTC dates
      let streak = 1;
      const now = new Date();
      const todayUtcEpoch = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

      // Check if the most recent workout is today or yesterday
      const mostRecentWorkoutEpoch = sortedDateEpochs[0];
      const daysSinceLastWorkout = Math.floor(
        (todayUtcEpoch - mostRecentWorkoutEpoch) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastWorkout > 1) {
        // Streak is broken if last workout was more than 1 day ago
        return 0;
      }

      // Count consecutive days using UTC epochs
      for (let i = 1; i < sortedDateEpochs.length; i++) {
        const currentDateEpoch = sortedDateEpochs[i - 1];
        const previousDateEpoch = sortedDateEpochs[i];
        const daysDifference = Math.floor(
          (currentDateEpoch - previousDateEpoch) / (1000 * 60 * 60 * 24),
        );

        if (daysDifference === 1) {
          // Consecutive day, continue streak
          streak++;
        } else if (daysDifference > 1) {
          // Gap in days, streak ends
          break;
        }
        // If daysDifference === 0, it's the same day, don't increment streak
      }

      return streak;
    } catch (error) {
      this.logger.error(`Failed to calculate streak for user ${userId}`, error);
      return 0;
    }
  }

  /**
   * Retrieves progress data for a user
   * @param userId - The user's UID
   * @returns The user's progress document or null if not found
   */
  async getProgress(userId: string): Promise<UserProgress | null> {
    try {
      const progressRef = this.firestoreService.getCollection(COLLECTIONS.PROGRESS).doc(userId);

      const progressDoc = await progressRef.get();

      if (!progressDoc.exists) {
        return null;
      }

      return { uid: progressDoc.id, ...progressDoc.data() } as UserProgress;
    } catch (error) {
      this.logger.error(`Failed to get progress for user ${userId}`, error);
      throw error;
    }
  }
}
