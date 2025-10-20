import { Injectable, Logger } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirestoreService } from '../firebase/services/firestore.service';
import { ProgressService } from './progress.service';
import { AvatarState, AvatarEvolution } from '../common/interfaces/avatar.interface';
import { User } from '../common/interfaces/user.interface';
import { UserProgress } from '../common/interfaces/progress.interface';
import { Exercise } from '../common/interfaces/exercise.interface';
import { Session } from '../common/interfaces/session.interface';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import { serializeTimestamp } from '../common/utils/serializeSession';

/**
 * Service for managing avatar state and evolution
 * Calculates avatar progression based on workout data and manages level-up events
 *
 * XP Calculation Formula:
 * - Base XP per workout: 100 points
 * - Streak multiplier: 1 + (currentStreak * 0.1)
 * - Volume bonus: totalVolume / 1000
 * - Final XP = baseXP * streakMultiplier + volumeBonus
 *
 * Level Thresholds:
 * - Level 1: 0 XP
 * - Level 2: 500 XP
 * - Exponential growth: XP_required = 500 * (level ^ 1.5)
 *
 * Muscle Group Calculation:
 * - Maps exercise categories to muscle groups
 * - Analyzes volume and frequency per muscle group
 * - Scales from 1-10 based on cumulative volume
 */
@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  private readonly exerciseCache = new Map<string, { data: Exercise; timestamp: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly progressService: ProgressService,
  ) {}

  /**
   * Calculates the current avatar state based on user progress
   * @param userId - The user's UID
   * @returns Current avatar state with level, XP, and muscle groups
   */
  async calculateAvatarState(userId: string): Promise<AvatarState> {
    try {
      // Fetch user progress
      const progress = await this.progressService.getProgress(userId);

      if (!progress) {
        // Return default avatar state if no progress exists
        return {
          level: 1,
          xp: 0,
          xpToNextLevel: 500,
          muscleGroups: {
            chest: 1,
            back: 1,
            legs: 1,
            shoulders: 1,
            arms: 1,
            core: 1,
          },
          totalWorkouts: 0,
          currentStreak: 0,
          lastUpdated: serializeTimestamp(Timestamp.now()),
        };
      }

      // Calculate total XP
      const xp = this.calculateTotalXP(progress);

      // Determine level from XP
      const level = this.getLevelFromXP(xp);
      const xpToNextLevel = level >= 50 ? 0 : this.getXPForLevel(level + 1) - xp;

      // Calculate muscle group levels
      const muscleGroups = await this.calculateMuscleGroups(progress);

      return {
        level,
        xp,
        xpToNextLevel,
        muscleGroups,
        totalWorkouts: progress.totalWorkouts || 0,
        currentStreak: progress.currentStreak || 0,
        lastUpdated: serializeTimestamp(Timestamp.now()),
      };
    } catch (error) {
      this.logger.error(`Failed to calculate avatar state for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Updates avatar after a workout session is completed
   * Triggers avatar evolution if level increases
   * @param userId - The user's UID
   * @param sessionId - The completed session ID
   * @returns Avatar evolution data if level-up occurred, null otherwise
   */
  async updateAvatarAfterSession(
    userId: string,
    sessionId: string,
  ): Promise<AvatarEvolution | null> {
    try {
      // Fetch session data
      const sessionDoc = await this.firestoreService
        .getCollection(COLLECTIONS.SESSIONS)
        .doc(sessionId)
        .get();

      if (!sessionDoc.exists) {
        this.logger.error(`Session ${sessionId} not found`);
        return null;
      }

      const session = {
        id: sessionDoc.id,
        ...sessionDoc.data(),
      } as Session;

      // Update progress first
      await this.progressService.updateProgressAfterSession(userId, session);

      // Get current user avatar state
      const userDoc = await this.firestoreService
        .getCollection(COLLECTIONS.USERS)
        .doc(userId)
        .get();

      const userData = userDoc.data() as User;
      const previousLevel = userData?.avatarLevel || 1;
      const previousMuscleGroups = userData?.avatarMuscleGroups || {
        chest: 1,
        back: 1,
        legs: 1,
        shoulders: 1,
        arms: 1,
        core: 1,
      };

      // Calculate new avatar state
      const newAvatarState = await this.calculateAvatarState(userId);

      // Compare muscle groups to detect gains
      const muscleGroupsGained: string[] = [];
      for (const [muscle, level] of Object.entries(newAvatarState.muscleGroups)) {
        if (level > previousMuscleGroups[muscle as keyof typeof previousMuscleGroups]) {
          muscleGroupsGained.push(muscle);
        }
      }

      // Update user document with new avatar fields
      const updateData: Partial<User> = {
        avatarLevel: newAvatarState.level,
        avatarXP: newAvatarState.xp,
        avatarMuscleGroups: newAvatarState.muscleGroups,
        updatedAt: Timestamp.now(),
      };

      // Check if level increased
      if (newAvatarState.level > previousLevel) {
        updateData.lastEvolution = Timestamp.now();
      }

      await this.firestoreService.getCollection(COLLECTIONS.USERS).doc(userId).update(updateData);

      // Return evolution data if level increased
      if (newAvatarState.level > previousLevel) {
        const evolution: AvatarEvolution = {
          previousLevel,
          newLevel: newAvatarState.level,
          muscleGroupsGained,
          timestamp: Timestamp.now(),
        };

        this.logger.log(
          `Avatar evolution for user ${userId}: Level ${previousLevel} → ${newAvatarState.level}`,
        );

        return evolution;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to update avatar for user ${userId} after session ${sessionId}`,
        error,
      );
      // Don't throw error to prevent breaking session completion
      return null;
    }
  }

  /**
   * Calculates total XP from user progress
   * @param progress - User progress data
   * @returns Total XP accumulated
   */
  private calculateTotalXP(progress: UserProgress): number {
    const baseXPPerWorkout = 100;
    const totalWorkouts = progress.totalWorkouts || 0;

    // Base XP from workouts
    let totalXP = totalWorkouts * baseXPPerWorkout;

    // Add streak multiplier bonus (applied to recent workouts)
    const streakMultiplier = 1 + (progress.currentStreak || 0) * 0.1;
    const recentWorkouts = Math.min(progress.currentStreak || 0, totalWorkouts);
    totalXP += recentWorkouts * baseXPPerWorkout * (streakMultiplier - 1);

    // Add volume bonus
    const totalVolume = progress.lifetimeVolume || 0;
    const volumeBonus = totalVolume / 1000;
    totalXP += volumeBonus;

    return Math.floor(totalXP);
  }

  /**
   * Determines avatar level from total XP
   * @param xp - Total experience points
   * @returns Avatar level (1-50)
   */
  private getLevelFromXP(xp: number): number {
    // Start from level 1 and find the highest level the user has reached
    for (let level = 1; level <= 50; level++) {
      if (xp < this.getXPForLevel(level)) {
        return Math.max(1, level - 1);
      }
    }
    return 50; // Max level
  }

  /**
   * Calculates XP required for a specific level
   * @param level - Target level
   * @returns XP threshold for that level
   */
  getXPForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level === 2) return 500;

    // Exponential growth formula: 500 * (level ^ 1.5)
    return Math.floor(500 * Math.pow(level, 1.5));
  }

  /**
   * Calculates muscle group levels based on exercise progress
   * @param progress - User progress data
   * @returns Muscle group levels (1-10 for each group)
   */
  private async calculateMuscleGroups(progress: UserProgress): Promise<{
    chest: number;
    back: number;
    legs: number;
    shoulders: number;
    arms: number;
    core: number;
  }> {
    const muscleGroups = {
      chest: 1,
      back: 1,
      legs: 1,
      shoulders: 1,
      arms: 1,
      core: 1,
    };

    if (!progress.exerciseProgress) {
      return muscleGroups;
    }

    // Group exercises by muscle category
    const muscleVolumes: Record<string, number> = {
      chest: 0,
      back: 0,
      legs: 0,
      shoulders: 0,
      arms: 0,
      core: 0,
    };

    // Clean expired cache entries periodically
    this.cleanExpiredCache();

    // Pre-scan to collect missing exercise IDs that need category resolution
    const missingIds: string[] = [];
    for (const [exerciseId, exerciseProgress] of Object.entries(progress.exerciseProgress)) {
      if (!exerciseProgress.category) {
        missingIds.push(exerciseId);
      }
    }

    // Resolve categories for missing IDs in parallel
    const categoryMap = new Map<string, string | null>();
    if (missingIds.length > 0) {
      try {
        const startTime = Date.now();
        const exercises = await Promise.all(missingIds.map((id) => this.getCachedExercise(id)));
        const endTime = Date.now();
        this.logger.log(
          `Resolved ${missingIds.length} exercise categories in ${endTime - startTime}ms`,
        );

        missingIds.forEach((id, index) => {
          categoryMap.set(id, exercises[index]?.category || null);
        });
      } catch (error) {
        this.logger.warn('Failed to batch resolve exercise categories', error);
        // Fall back to empty map, will use individual lookups
      }
    }

    // Process exercise progress with cached data
    for (const [exerciseId, exerciseProgress] of Object.entries(progress.exerciseProgress)) {
      const ep = exerciseProgress;
      const volume = ep.totalVolume || 0;

      let category = ep.category;

      if (!category) {
        // Use parallel-resolved category or fall back to individual lookup
        category =
          categoryMap.get(exerciseId) || (await this.getCachedExercise(exerciseId))?.category;
      }

      if (category) {
        if (category.toLowerCase().includes('cardio')) {
          // Distribute cardio volume across all muscle groups (small fraction)
          const cardioFraction = volume * 0.1; // 10% of cardio volume
          const perMuscleGroup = cardioFraction / 6; // Divide among 6 muscle groups

          muscleVolumes.chest += perMuscleGroup;
          muscleVolumes.back += perMuscleGroup;
          muscleVolumes.legs += perMuscleGroup;
          muscleVolumes.shoulders += perMuscleGroup;
          muscleVolumes.arms += perMuscleGroup;
          muscleVolumes.core += perMuscleGroup;
        } else {
          const muscleGroup = this.getMuscleGroupFromCategory(category);

          if (muscleGroup in muscleVolumes) {
            muscleVolumes[muscleGroup] += volume;
          }
        }
      } else {
        this.logger.warn(`Exercise category not found for ${exerciseId}`);
      }
    }

    // Calculate muscle levels (1-10) based on volume
    // Scale: every 10,000 volume units = 1 level (max 10)
    for (const [muscle, volume] of Object.entries(muscleVolumes)) {
      const level = Math.min(10, Math.max(1, Math.floor(volume / 10000) + 1));
      muscleGroups[muscle as keyof typeof muscleGroups] = level;
    }

    return muscleGroups;
  }

  /**
   * Gets exercise data from cache or fetches from Firestore
   * @param exerciseId - Exercise ID
   * @returns Exercise data or null if not found
   */
  private async getCachedExercise(exerciseId: string): Promise<Exercise | null> {
    const now = Date.now();
    const cached = this.exerciseCache.get(exerciseId);

    // Return cached data if valid and not expired
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      // Fetch from Firestore
      const doc = await this.firestoreService
        .getCollection(COLLECTIONS.EXERCISES)
        .doc(exerciseId)
        .get();

      if (doc.exists) {
        const exerciseData = doc.data() as Exercise;

        // Cache the data
        this.exerciseCache.set(exerciseId, {
          data: exerciseData,
          timestamp: now,
        });

        return exerciseData;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch exercise ${exerciseId}`, error);
    }

    return null;
  }

  /**
   * Cleans expired entries from the exercise cache
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.exerciseCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL_MS) {
        this.exerciseCache.delete(key);
      }
    }
  }

  /**
   * Maps exercise category to primary muscle group
   * @param category - Exercise category string
   * @returns Primary muscle group name
   */
  getMuscleGroupFromCategory(category: string): string {
    const categoryLower = category.toLowerCase();

    if (categoryLower.includes('chest') || categoryLower.includes('pec')) {
      return 'chest';
    }
    if (
      categoryLower.includes('back') ||
      categoryLower.includes('lat') ||
      categoryLower.includes('row')
    ) {
      return 'back';
    }
    if (
      categoryLower.includes('leg') ||
      categoryLower.includes('squat') ||
      categoryLower.includes('quad') ||
      categoryLower.includes('hamstring') ||
      categoryLower.includes('calf') ||
      categoryLower.includes('glute') ||
      categoryLower.includes('hip')
    ) {
      return 'legs';
    }
    if (categoryLower.includes('shoulder') || categoryLower.includes('delt')) {
      return 'shoulders';
    }
    if (
      categoryLower.includes('arm') ||
      categoryLower.includes('bicep') ||
      categoryLower.includes('tricep')
    ) {
      return 'arms';
    }
    if (
      categoryLower.includes('core') ||
      categoryLower.includes('abs') ||
      categoryLower.includes('abdominal')
    ) {
      return 'core';
    }

    // Note: Cardio is now handled in calculateMuscleGroups method
    // Unknown categories are intentionally ignored to avoid bias in muscle distribution
    return '';
  }
}
