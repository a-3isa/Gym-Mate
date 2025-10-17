import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayUnique,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for exercise within a session
 * Contains exercise details and target sets for the workout
 */
export class SessionExerciseDto {
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @IsString()
  @IsNotEmpty()
  exerciseName!: string; // Denormalized for quick access

  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  targetSets!: number;
}

/**
 * DTO for creating a new workout session with a friend
 * Exercises must be pre-selected by the creator
 * Collaborative confirmation happens in a separate step
 */
export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  friendUid!: string; // The friend to invite

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((exercise: SessionExerciseDto) => exercise.exerciseId, {
    message: 'Exercises must have unique exerciseIds',
  })
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseDto)
  exercises!: SessionExerciseDto[];
}
