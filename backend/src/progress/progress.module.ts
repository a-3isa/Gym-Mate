import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { ProgressService } from './progress.service';
import { AvatarService } from './avatar.service';

/**
 * Module for workout progress tracking and avatar evolution
 *
 * This module provides services for:
 * - Tracking user workout progress, streaks, and personal records
 * - Calculating avatar state based on workout data
 * - Managing avatar evolution and level-up events
 * - Computing muscle group development from exercise categories
 *
 * The module depends on FirebaseModule for Firestore database access
 * and exports its services for use by other modules (particularly SessionsModule)
 */
@Module({
  imports: [FirebaseModule],
  providers: [ProgressService, AvatarService],
  exports: [ProgressService, AvatarService],
})
export class ProgressModule {}
