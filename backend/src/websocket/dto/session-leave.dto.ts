import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * SessionLeaveDto
 * Payload for session:leave event.
 */
export class SessionLeaveDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
