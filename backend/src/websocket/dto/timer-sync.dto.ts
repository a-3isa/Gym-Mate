import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { TimerType } from './timer-start.dto';

/**
 * DTO for timer:sync event payload.
 * Used for periodic timer synchronization between participants to ensure both clients
 * show the same countdown, sent every few seconds during an active timer.
 */
export class TimerSyncDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsEnum(TimerType)
  @IsNotEmpty()
  timerType!: TimerType;

  /** Remaining time in seconds */
  @IsInt()
  @Min(0)
  remainingSeconds!: number;
}
