import axios from 'axios';
import { logout, setCredentials } from '../store/authSlice';
import { disconnectSockets, syncSocketAuth } from '../lib/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let authStore = null;
let refreshPromise = null;
let refreshing = false;

export function bindAuthStore(store) {
  authStore = store;
}

function getAccessToken() {
  return authStore?.getState?.()?.auth?.accessToken || null;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshing) {
        refreshing = true;
        refreshPromise = refreshClient.post('/auth/refresh');
      }
      const response = await refreshPromise;
      refreshPromise = null;
      refreshing = false;

      const accessToken = response.data?.data?.access || response.data?.data?.accessToken || response.data?.accessToken || response.data?.access;
      if (!accessToken) {
        throw new Error('Refresh token response missing access token');
      }

      const currentUser = authStore?.getState?.()?.auth?.user ?? null;
      authStore?.dispatch?.(setCredentials({ user: currentUser, accessToken }));
      syncSocketAuth();

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      refreshing = false;
      authStore?.dispatch?.(logout());
      disconnectSockets();
      return Promise.reject(refreshError);
    }
  }
);
