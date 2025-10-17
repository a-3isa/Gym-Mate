import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for session:end event payload.
 * Used when a session is completed (either all exercises finished or manually ended),
 * notifying all participants that the workout has ended.
 */
export class SessionEndDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  /** ISO timestamp when session was completed */
  @IsString()
  @IsNotEmpty()
  completedAt!: string;
}
