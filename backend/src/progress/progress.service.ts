import { Injectable, Logger } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirestoreService } from '../firebase/services/firestore.service';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import {
  UserProgress,
  WorkoutSummary,
  ExerciseProgress,
} from '../common/interfaces/progress.interface';
import { Session, SetRecord } from '../common/interfaces/session.interface';

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
      // We'll use individual updates instead of batch for now

      const progress = await this.getOrCreateProgress(userId);

      // Calculate workout summary
      const duration =
        session.completedAt && session.startedAt
          ? (session.completedAt.toMillis() - session.startedAt.toMillis()) / 1000 / 60 // in minutes
          : 0;

      // Filter sets to include only the user's own sets
      const userSets = session.sets?.filter((set) => set.participantUid === userId) || [];

      const exercisesCompleted = new Set(userSets.map((s) => s.exerciseId)).size;

      const totalSets = userSets.length;

      const totalVolume = userSets.reduce((total, set: SetRecord) => {
        return total + set.weight * set.reps;
      }, 0);

      const workoutSummary: WorkoutSummary = {
        sessionId: session.id || '',
        date: session.completedAt || Timestamp.now(),
        duration,
        exercisesCompleted,
        totalSets,
        totalVolume,
      };

      // Update workout history (keep last 100 workouts)
      const updatedHistory = [workoutSummary, ...(progress.workoutHistory || []).slice(0, 99)];

      // Calculate and update streak
      const currentStreak = await this.calculateStreak(userId, session.completedAt);
      const longestStreak = Math.max(currentStreak, progress.longestStreak || 0);

      // Update exercise progress and personal records
      const exerciseProgress = { ...(progress.exerciseProgress || {}) };

      if (userSets.length > 0) {
        for (const set of userSets) {
          const exerciseId = set.exerciseId;

          if (!exerciseProgress[exerciseId]) {
            exerciseProgress[exerciseId] = {
              exerciseId,
              exerciseName: '', // Will be updated separately
              totalVolume: 0,
              personalRecord: {
                weight: 0,
                reps: 0,
              },
              lastPerformed: Timestamp.now(),
            };
          }

          const ep = exerciseProgress[exerciseId];
          ep.totalVolume += set.weight * set.reps;
          ep.lastPerformed = session.completedAt || Timestamp.now();

          // Update personal records
          if (set.weight > ep.personalRecord.weight) {
            ep.personalRecord.weight = set.weight;
            ep.personalRecord.reps = set.reps;
          } else if (set.weight === ep.personalRecord.weight && set.reps > ep.personalRecord.reps) {
            ep.personalRecord.reps = set.reps;
          }
        }
      }

      // Update progress document
      await this.firestoreService.updateDocument(COLLECTIONS.PROGRESS, userId, {
        totalWorkouts: (progress.totalWorkouts || 0) + 1,
        currentStreak,
        longestStreak,
        workoutHistory: updatedHistory,
        exerciseProgress,
        updatedAt: Timestamp.now(),
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

      // Group sessions by date (ignoring time)
      const workoutDates = new Set<string>();

      sessions.forEach((session) => {
        if (session.completedAt) {
          const date = session.completedAt.toDate();
          const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          workoutDates.add(dateString);
        }
      });

      // Convert to sorted array of dates
      const sortedDates = Array.from(workoutDates)
        .map((dateStr) => {
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month, day);
        })
        .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

      if (sortedDates.length === 0) {
        return 0;
      }

      // Calculate streak
      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if the most recent workout is today or yesterday
      const mostRecentWorkout = sortedDates[0];
      const daysSinceLastWorkout = Math.floor(
        (today.getTime() - mostRecentWorkout.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastWorkout > 1) {
        // Streak is broken if last workout was more than 1 day ago
        return 0;
      }

      // Count consecutive days
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = sortedDates[i - 1];
        const previousDate = sortedDates[i];
        const daysDifference = Math.floor(
          (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24),
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
