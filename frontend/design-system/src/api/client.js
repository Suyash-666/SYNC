import axios from 'axios';
import { logout } from '../store/authSlice';
import { disconnectSockets } from '../lib/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

let authStore = null;

export function bindAuthStore(store) {
  authStore = store;
}

function getAccessToken() {
  // The Render backend (AI + Socket.IO) authenticates with a Supabase Auth JWT.
  return authStore?.getState?.()?.auth?.supabaseSession?.access_token || null;
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
    const status = error.response?.status;
    if (status === 401 && authStore) {
      authStore.dispatch(logout());
      disconnectSockets();
    }
    return Promise.reject(error);
  }
);
