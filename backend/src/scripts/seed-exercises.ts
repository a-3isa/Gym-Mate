/* eslint-disable no-console */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, BulkWriter } from 'firebase-admin/firestore';
import { exercisesData } from './seed-exercises.data';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import { Exercise } from '../common/interfaces/exercise.interface';

/**
 * Type for writing exercise data to Firestore
 * Omits id and uses FieldValue for createdAt to match Firestore API
 */
type ExerciseWrite = Omit<Exercise, 'id' | 'createdAt'> & {
  createdAt: FirebaseFirestore.FieldValue;
};

/**
 * Seed script for populating the exercises collection in Firestore
 *
 * Usage:
 * - Development: npm run seed:exercises
 * - Production: NODE_ENV=production node dist/scripts/seed-exercises.js --force
 *
 * Environment Variables Required:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 *
 * Or use Application Default Credentials if running in Google Cloud
 *
 * Safety:
 * - Will not run in production unless --force flag is provided
 * - Supports Firebase Emulator via FIRESTORE_EMULATOR_HOST
 */

// Check if running against emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('🔧 Running against Firestore Emulator:', process.env.FIRESTORE_EMULATOR_HOST);
} else {
  console.log('☁️  Running against Production Firestore');
}

// Safety check for production
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('⚠️  WARNING: Attempting to seed production database!');
  console.error('Use --force flag to confirm: npm run seed:exercises -- --force');
  process.exit(1);
}

// Initialize Firebase Admin
const apps = getApps();
if (!apps.length) {
  if (
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PROJECT_ID
  ) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Use Application Default Credentials
    initializeApp();
  }
}
const firestore = getFirestore();

/**
 * Creates a deterministic slug from exercise category and name for use as document ID
 * Format: {category}-{slugified-name}
 * @param category Exercise category
 * @param name Exercise name
 * @returns Normalized slug with category prefix
 */
function createExerciseSlug(category: string, name: string): string {
  const slugifiedName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  const slugifiedCategory = category.toLowerCase().replace(/[^a-z0-9]/g, ''); // Keep only alphanumeric for category

  return `${slugifiedCategory}-${slugifiedName}`;
}

/**
 * Seeds exercises into Firestore using BulkWriter for efficient batch operations
 */
async function seedExercises(): Promise<void> {
  console.log(`📚 Preparing to seed ${exercisesData.length} exercises...`);

  const bulkWriter: BulkWriter = firestore.bulkWriter();

  // Configure error handling for retries
  bulkWriter.onWriteError((error) => {
    console.error('❌ Write error:', error);
    // Return true to retry transient errors up to the default/backoff limits
    // Log failures after exceeding retry attempts
    if (error.failedAttempts && error.failedAttempts >= 3) {
      console.error('❌ Write failed after maximum retries:', error);
      return false;
    }
    return true;
  });

  let successCount = 0;
  bulkWriter.onWriteResult(() => {
    successCount++;
    if (successCount % 10 === 0) {
      console.log(`  ✓ Processed ${successCount} exercises...`);
    }
  });

  try {
    // Preflight check: detect and log any duplicate slugs
    const slugCounts = new Map<string, number>();
    for (const exerciseData of exercisesData) {
      const exerciseSlug = createExerciseSlug(exerciseData.category, exerciseData.name);
      const currentCount = slugCounts.get(exerciseSlug) || 0;
      slugCounts.set(exerciseSlug, currentCount + 1);
      if (currentCount > 0) {
        console.error(
          `⚠️  Duplicate slug detected: "${exerciseSlug}" (${exerciseData.category}/${exerciseData.name})`,
        );
      }
    }

    const duplicates = Array.from(slugCounts.entries()).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      console.error(
        `❌ Found ${duplicates.length} duplicate slugs. Please rename exercises to avoid conflicts.`,
      );
      throw new Error('Duplicate exercise slugs detected');
    }

    // First, get all existing document IDs to check which are new
    const existingDocsSnapshot = await firestore.collection(COLLECTIONS.EXERCISES).get();
    const existingDocIds = new Set(existingDocsSnapshot.docs.map((doc) => doc.id));

    // Queue all exercise documents for creation/update
    for (const exerciseData of exercisesData) {
      const exerciseSlug = createExerciseSlug(exerciseData.category, exerciseData.name);
      const docRef = firestore.collection(COLLECTIONS.EXERCISES).doc(exerciseSlug);
      const isNewDocument = !existingDocIds.has(exerciseSlug);

      if (isNewDocument) {
        // New document: set with createdAt
        const exercise: ExerciseWrite = {
          ...exerciseData,
          createdAt: FieldValue.serverTimestamp(),
        };
        void bulkWriter.set(docRef, exercise);
      } else {
        // Existing document: update without overwriting createdAt
        const exercise: Omit<Exercise, 'id' | 'createdAt'> = {
          ...exerciseData,
        };
        void bulkWriter.set(docRef, exercise, { merge: true });
      }
    }

    console.log('⏳ Committing all writes to Firestore...');

    // Commit all writes with automatic batching and retry logic
    await bulkWriter.close();

    console.log(`✅ Successfully seeded ${successCount} exercises!`);

    // Verify the seed
    const exercisesCollection = await firestore.collection(COLLECTIONS.EXERCISES).get();
    console.log(`📊 Total exercises in collection: ${exercisesCollection.size}`);
  } catch (error) {
    console.error('❌ Failed to seed exercises:', error);
    throw error;
  }
}

// Execute the seed script
void (async () => {
  try {
    await seedExercises();
    console.log('🎉 Seed script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  }
})();
