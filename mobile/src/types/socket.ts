/**
 * WebSocket event payload types
 * These should match the DTOs defined in the backend
 */

/**
 * Avatar evolution event payload
 * Sent when a user's avatar levels up after session completion
 */
export interface AvatarEvolutionPayload {
  sessionId: string;
  userId: string;
  previousLevel: number;
  newLevel: number;
  muscleGroupsGained: string[];
  timestamp: string;
}
