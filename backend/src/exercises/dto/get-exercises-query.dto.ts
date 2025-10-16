import { IsOptional, IsString, IsIn } from 'class-validator';

/**
 * DTO for validating query parameters for the GET /exercises endpoint
 * Allows optional category filtering with validation against allowed categories
 */
export class GetExercisesQueryDto {
  /**
   * Optional category filter
   * Must be one of the valid exercise categories if provided
   */
  @IsOptional()
  @IsString()
  @IsIn(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'])
  category?: string;
}
