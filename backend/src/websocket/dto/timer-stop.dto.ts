import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TimerType } from './timer-start.dto';

/** DTO for timer:stop event payload. */
export class TimerStopDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsEnum(TimerType)
  @IsNotEmpty()
  timerType!: TimerType;
}
