import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/**
 * DTO for exercise:change event payload.
 * Used when the session moves to the next exercise after both participants
 * complete all sets for the current exercise.
 */
export class ExerciseChangeDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  /** Index of the new current exercise */
  @IsInt()
  @Min(0)
  exerciseIndex!: number;

  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @IsString()
  @IsNotEmpty()
  exerciseName!: string;
}
