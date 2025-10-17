import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for session:start event payload.
 * Used when a session transitions from pending to active status,
 * notifying all participants that the workout has begun.
 */
export class SessionStartDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  /** UID of the user who started the session */
  @IsString()
  @IsNotEmpty()
  startedBy!: string;
}
