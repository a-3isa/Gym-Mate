import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';

export enum TimerType {
  rest = 'rest',
  workout = 'workout',
}

/**
 * DTO for timer:start event payload.
 * Used when a participant starts a rest timer (between sets) or workout timer
 * (for timed exercises), broadcasting the timer state to the partner for synchronization.
 */
export class TimerStartDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsEnum(TimerType)
  @IsNotEmpty()
  timerType!: TimerType;

  /** Duration in seconds */
  @IsInt()
  @Min(1)
  @Max(600)
  duration!: number;

  /** UID of the user who started the timer (optional - derived from authenticated socket) */
  @IsOptional()
  @IsString()
  startedBy?: string;
}
