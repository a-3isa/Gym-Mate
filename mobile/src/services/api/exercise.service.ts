import apiClient from './client';
import { Exercise } from '../../types/models';

/**
 * Fetches all exercises from the backend API
 * @returns Promise<Exercise[]> Array of all exercises in the library
 * @throws Error if the request fails
 */
export async function getAllExercises(): Promise<Exercise[]> {
  try {
    const response = await apiClient.get<Exercise[]>('/exercises');
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch exercises:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch exercises');
  }
}

/**
 * Fetches exercises filtered by category
 * @param category The exercise category to filter by
 * @returns Promise<Exercise[]> Array of exercises in the specified category
 * @throws Error if the request fails
 */
export async function getExercisesByCategory(category: string): Promise<Exercise[]> {
  try {
    const response = await apiClient.get<Exercise[]>('/exercises', {
      params: { category }
    });
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch exercises for category ${category}:`, error);
    throw new Error(error.response?.data?.message || `Failed to fetch exercises for category: ${category}`);
  }
}

/**
 * Fetches a single exercise by ID
 * @param id The exercise ID
 * @returns Promise<Exercise> The exercise object
 * @throws Error if the exercise is not found or request fails
 */
export async function getExerciseById(id: string): Promise<Exercise> {
  try {
    const response = await apiClient.get<Exercise>(`/exercises/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch exercise with ID ${id}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Exercise not found');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to fetch exercise details');
  }
}
