/**
 * WebSocket event name constants for Socket.IO communication
 * These constants ensure consistency between backend gateway and mobile client implementations
 */

export const SOCKET_EVENTS = {
  /**
   * Emitted when a user joins a workout session
   * Payload: { sessionId: string, userId: string }
   */
  SESSION_JOIN: 'session:join',

  /**
   * Emitted when a user leaves a workout session
   * Payload: { sessionId: string, userId: string }
   */
  SESSION_LEAVE: 'session:leave',

  /**
   * Emitted when a workout session starts
   * Payload: { sessionId: string, startedBy: string }
   */
  SESSION_START: 'session:start',

  /**
   * Emitted when session data is updated
   * Payload: Session object with updated data
   */
  SESSION_UPDATE: 'session:update',

  /**
   * Emitted when a participant completes a set
   * Payload: { sessionId: string, exerciseId: string, setNumber: number, weight: number, reps: number }
   */
  SET_COMPLETE: 'set:complete',

  /**
   * Emitted when it's the next participant's turn
   * Payload: { sessionId: string, nextUserId: string }
   */
  TURN_CHANGE: 'turn:change',

  /**
   * Emitted when moving to the next exercise
   * Payload: { sessionId: string, exerciseIndex: number, exerciseId: string }
   */
  EXERCISE_CHANGE: 'exercise:change',

  /**
   * Emitted when a participant's status changes
   * Payload: { sessionId: string, userId: string, status: string }
   */
  PARTICIPANT_STATUS: 'participant:status',

  /**
   * Emitted when a workout session ends
   * Payload: { sessionId: string, completedAt: string }
   */
  SESSION_END: 'session:end',

  /**
   * Emitted when an error occurs
   * Payload: { message: string, code?: string }
   */
  ERROR: 'error',
} as const;
