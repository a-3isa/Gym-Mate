import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { ExercisesService } from './exercises.service';
import { ExercisesController } from './exercises.controller';

/**
 * Module for exercise library management
 * Provides read-only access to the curated exercise collection
 * Exercises are populated via seed script rather than API endpoints
 */
@Module({
  imports: [FirebaseModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService], // Export for potential use by other modules (e.g., sessions module)
})
export class ExercisesModule {}
