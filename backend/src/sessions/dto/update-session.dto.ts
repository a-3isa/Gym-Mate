import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';

/**
 * Session status enumeration
 */
export enum SessionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * DTO for updating session state during workout progression
 * Used for status changes, turn switches, and exercise transitions
 */
export class UpdateSessionDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  currentTurn?: string; // uid

  @IsOptional()
  @IsInt()
  @Min(0)
  currentExerciseIndex?: number;
}
