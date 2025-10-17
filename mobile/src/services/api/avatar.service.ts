import apiClient from './client';
import { AvatarState } from '../../types/models';

/**
 * Fetches the current avatar state from the backend
 * Includes avatar level, XP, muscle groups, and progression metrics
 * 
 * @returns Promise containing the calculated avatar state
 * @throws Error if the request fails
 */
export async function getAvatarState(): Promise<AvatarState> {
  try {
    const response = await apiClient.get<AvatarState>('/auth/avatar');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching avatar state:', error);
    
    // Provide user-friendly error messages
    if (error.response?.status === 401) {
      throw new Error('Please sign in to view your avatar');
    } else if (error.response?.status === 500) {
      throw new Error('Unable to load avatar data. Please try again later');
    } else if (error.message === 'Network Error') {
      throw new Error('No internet connection. Please check your network');
    }
    
    throw new Error('Failed to load avatar data');
  }
}
