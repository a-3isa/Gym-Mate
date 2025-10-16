import apiClient from './client';
import { Session, SessionExercise } from '../../types/models';

/**
 * Creates a new workout session with a friend
 * @param friendUid - UID of the friend to invite
 * @param exercises - Array of exercises with target sets
 * @returns The created session
 */
export async function createSession(
  friendUid: string,
  exercises: { exerciseId: string; exerciseName: string; targetSets: number }[],
): Promise<Session> {
  try {
    const response = await apiClient.post('/sessions', {
      friendUid,
      exercises,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating session:', error);
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'You can only create sessions with your friends');
    }
    throw new Error('Failed to create session');
  }
}

/**
 * Retrieves all sessions for the authenticated user
 * @param status - Optional status filter
 * @returns Array of user's sessions
 */
export async function getUserSessions(status?: string): Promise<Session[]> {
  try {
    const params = status ? { status } : undefined;
    const response = await apiClient.get('/sessions', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user sessions:', error);
    throw new Error('Failed to fetch sessions');
  }
}

/**
 * Retrieves a specific session by ID
 * @param sessionId - Session ID
 * @returns The requested session
 */
export async function getSessionById(sessionId: string): Promise<Session> {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching session ${sessionId}:`, error);
    if (error.response?.status === 404) {
      throw new Error('Session not found');
    }
    if (error.response?.status === 403) {
      throw new Error('You are not authorized to access this session');
    }
    throw new Error('Failed to fetch session');
  }
}

/**
 * Accepts or declines a session invitation
 * @param sessionId - Session ID
 * @param accepted - Whether to accept or decline
 * @param exercises - Optional exercise modifications
 * @returns The updated session
 */
export async function acceptSession(
  sessionId: string,
  accepted: boolean,
  exercises?: { exerciseId: string; exerciseName: string; targetSets: number }[],
): Promise<Session> {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/accept`, {
      accepted,
      exercises,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error accepting session ${sessionId}:`, error);
    if (error.response?.status === 403) {
      throw new Error('You are not authorized to accept this session');
    }
    if (error.response?.status === 404) {
      throw new Error('Session not found');
    }
    throw new Error('Failed to accept session');
  }
}

/**
 * Updates the status of a session
 * @param sessionId - Session ID
 * @param status - New status
 * @returns The updated session
 */
export async function updateSessionStatus(
  sessionId: string,
  status: string,
): Promise<Session> {
  try {
    const response = await apiClient.patch(`/sessions/${sessionId}/status`, {
      status,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error updating session ${sessionId} status:`, error);
    if (error.response?.status === 403) {
      throw new Error('You are not authorized to update this session');
    }
    if (error.response?.status === 404) {
      throw new Error('Session not found');
    }
    if (error.response?.status === 409) {
      throw new Error('Invalid session state transition');
    }
    throw new Error('Failed to update session status');
  }
}

/**
 * Records a completed set in the session
 * @param sessionId - Session ID
 * @param exerciseId - Exercise ID
 * @param setNumber - Set number (1-based)
 * @param weight - Weight in kilograms
 * @param reps - Number of repetitions
 * @returns The updated session with the new set recorded
 */
export async function recordSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
): Promise<Session> {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/sets`, {
      exerciseId,
      setNumber,
      weight,
      reps,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error recording set for session ${sessionId}:`, error);
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'It is not your turn to record a set');
    }
    if (error.response?.status === 403) {
      throw new Error('You are not authorized to record sets in this session');
    }
    if (error.response?.status === 404) {
      throw new Error('Session not found');
    }
    if (error.response?.status === 409) {
      throw new Error('Session must be active to record sets');
    }
    throw new Error('Failed to record set');
  }
}

/**
 * Manually switches turn to the other participant
 * @param sessionId - Session ID
 * @returns The updated session with toggled turn
 */
export async function switchTurn(sessionId: string): Promise<Session> {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/turn`);
    return response.data;
  } catch (error: any) {
    console.error(`Error switching turn for session ${sessionId}:`, error);
    if (error.response?.status === 403) {
      throw new Error('You are not authorized to switch turns in this session');
    }
    if (error.response?.status === 404) {
      throw new Error('Session not found');
    }
    if (error.response?.status === 409) {
      throw new Error('Session must be active to switch turns');
    }
    throw new Error('Failed to switch turn');
  }
}

/**
 * Completes a session early
 * @param sessionId - Session ID
 * @returns The completed session
 */
export async function completeSession(sessionId: string): Promise<Session> {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/complete`);
    return response.data;
  } catch (error: any) {
    console.error(`Error completing session ${sessionId}:`, error);
    if (error.response?.status === 403) {
      throw new Error('You are not authorized to complete this session');
    }
    if (error.response?.status === 404) {
      throw new Error('Session not found');
    }
    if (error.response?.status === 409) {
      throw new Error('Only active sessions can be completed');
    }
    throw new Error('Failed to complete session');
  }
}

// Note: Real-time synchronization via WebSocket is added in the next phase
