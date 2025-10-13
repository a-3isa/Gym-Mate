import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BACKEND_API_URL } from '@env';

if (!BACKEND_API_URL) {
  throw new Error('BACKEND_API_URL is not set. Please configure it in your .env file.');
}

const apiClient = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // TODO: Attach authentication token when auth is implemented
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
