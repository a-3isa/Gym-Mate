import apiClient from './client';

type HealthResponse = { status: string; [key: string]: unknown };

export const checkHealth = async (): Promise<HealthResponse> => {
  try {
    const { data } = await apiClient.get<HealthResponse>('/health');
    return data;
  } catch (error) {
    console.warn('Health check failed:', error);
    throw error;
  }
};
