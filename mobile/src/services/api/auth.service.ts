import apiClient from './client';
import { User } from '../../types/models';

/**
 * Auth API service for backend communication.
 * Handles authentication-related API calls to the backend.
 */

/**
 * Get the authenticated user's profile from the backend.
 * This function is called by AuthProvider after successful Firebase authentication
 * to sync user profile with backend.
 * 
 * @returns Promise that resolves with the user profile data
 * @throws Error if the API request fails
 */
export async function getUserProfile(): Promise<User> {
  try {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  } catch (error: any) {
    console.error('Failed to get user profile:', error);
    throw new Error('Failed to retrieve user profile');
  }
}
