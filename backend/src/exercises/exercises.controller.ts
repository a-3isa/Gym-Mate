import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { GetExercisesQueryDto } from './dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { Exercise } from '../common/interfaces/exercise.interface';

/**
 * Controller for exercise library endpoints
 * Provides read-only access to exercises
 * Exercise management is done via seed script
 */
@Controller('exercises')
export class ExercisesController {
  private readonly logger = new Logger(ExercisesController.name);

  constructor(private readonly exercisesService: ExercisesService) {}

  /**
   * Get all exercises or filter by category
   * @param query Query parameters for filtering
   * @returns Array of Exercise objects
   *
   * @example GET /api/exercises
   * @example GET /api/exercises?category=chest
   *
   * Response format:
   * [
   *   {
   *     id: "abc123",
   *     name: "Bench Press",
   *     category: "chest",
   *     muscleGroups: ["pectoralis major", "triceps"],
   *     instructions: "...",
   *     difficulty: "intermediate",
   *     equipment: ["barbell", "bench"],
   *     createdAt: "2024-01-01T00:00:00.000Z"
   *   }
   * ]
   *
   * Requires authentication token
   */
  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getExercises(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetExercisesQueryDto,
  ): Promise<Exercise[]> {
    try {
      if (query.category) {
        return await this.exercisesService.getExercisesByCategory(query.category);
      } else {
        return await this.exercisesService.getAllExercises();
      }
    } catch (error: any) {
      this.logger.error('Failed to get exercises', (error as Error)?.stack);
      throw new HttpException('Failed to retrieve exercises', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a single exercise by ID
   * @param id The exercise ID
   * @returns Single Exercise object
   * @throws 404 if exercise not found
   *
   * @example GET /api/exercises/abc123
   *
   * Response format:
   * {
   *   id: "abc123",
   *   name: "Bench Press",
   *   category: "chest",
   *   muscleGroups: ["pectoralis major", "triceps"],
   *   instructions: "...",
   *   difficulty: "intermediate",
   *   equipment: ["barbell", "bench"],
   *   createdAt: "2024-01-01T00:00:00.000Z"
   * }
   *
   * Requires authentication token
   */
  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async getExerciseById(@Param('id') id: string): Promise<Exercise> {
    try {
      const exercise = await this.exercisesService.getExerciseById(id);

      if (!exercise) {
        throw new HttpException('Exercise not found', HttpStatus.NOT_FOUND);
      }

      return exercise;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to get exercise with ID: ${id}`, (error as Error)?.stack);
      throw new HttpException('Failed to retrieve exercise', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
