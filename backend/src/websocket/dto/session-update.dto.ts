import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SerializedSession } from '../../common/utils/serializeSession';

/**
 * DTO for session:update event payload.
 * Broadcasts complete session state updates to all participants, triggered after
 * any state mutation (set recording, turn change, exercise transition, status change).
 * The session object contains all current session data including participants,
 * exercises, sets, currentTurn, currentExerciseIndex, and status.
 */
export class SessionUpdateDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  /** Full Session object with updated state */
  @IsOptional()
  session?: SerializedSession;
}
