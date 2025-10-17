import { IsString, IsNotEmpty } from 'class-validator';

/**
 * SessionJoinDto
 *
 * Data Transfer Object for session:join event payload.
 * Used when a user joins a workout session room.
 */
export class SessionJoinDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
