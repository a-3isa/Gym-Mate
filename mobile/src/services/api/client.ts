import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BACKEND_API_URL } from '@env';
import { auth } from '../firebase';

if (!BACKEND_API_URL) {
  throw new Error('BACKEND_API_URL is not set. Please configure it in your .env file.');
}

const trimmedBaseUrl = BACKEND_API_URL.replace(/\/+$/, '');
const baseURL = trimmedBaseUrl.endsWith('/api') ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;

const apiClient = axios.create({
  baseURL: "http://192.168.1.49:3000/api",
  timeout: 10000,
});

// Flag to prevent infinite retry loops
interface RequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Request interceptor to attach Firebase ID token to authenticated requests.
 * Automatically adds the token to the Authorization header if user is authenticated.
 */
apiClient.interceptors.request.use(
  async (config: RequestConfig) => {
    // Check if user is authenticated
    if (auth.currentUser) {
      try {
        // Get the Firebase ID token
        const token = await auth.currentUser.getIdToken();

        // Attach token to Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get ID token:', error);
        // Continue without token if retrieval fails
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response interceptor to handle 401 errors and refresh tokens.
 * Automatically refreshes the token and retries the request once on 401 responses.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfig;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry && auth.currentUser) {
      originalRequest._retry = true; // Mark to prevent infinite loop

      try {
        // Force refresh the token
        const newToken = await auth.currentUser.getIdToken(true);

        // Update the Authorization header with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request with new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Token refresh failed, reject the original error
        return Promise.reject(error);
      }
    }

    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
