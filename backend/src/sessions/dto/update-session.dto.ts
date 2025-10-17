import { IsOptional, IsEnum, IsString, Min, IsInt } from 'class-validator';

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
 * DTO for updating the session status
 */
export class UpdateSessionDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  currentTurn?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentExerciseIndex?: number;
}
