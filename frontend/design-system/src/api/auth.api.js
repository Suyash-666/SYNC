import { apiClient } from './client';
import { unwrap } from './helpers';

export const authApi = {
  signup: async (payload) => unwrap(await apiClient.post('/auth/signup', payload)),
  login: async (payload) => unwrap(await apiClient.post('/auth/login', payload)),
  logout: async () => unwrap(await apiClient.post('/auth/logout')),
  refreshToken: async () => unwrap(await apiClient.post('/auth/refresh')),
  getMe: async () => unwrap(await apiClient.get('/auth/me')),
  forgotPassword: async (payload) => unwrap(await apiClient.post('/auth/forgot-password', payload)),
  resetPassword: async (payload) => unwrap(await apiClient.post('/auth/reset-password', payload)),
};

// aliases for backward-compatibility
authApi.refresh = authApi.refreshToken;
authApi.me = authApi.getMe;

export default authApi;
