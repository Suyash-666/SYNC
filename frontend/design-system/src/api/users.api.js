import { apiClient } from './client';
import { unwrap } from './helpers';

export const usersApi = {
  getProfile: async () => unwrap(await apiClient.get('/users/profile')),
  updateProfile: async (payload) =>
    unwrap(await apiClient.patch('/users/profile', payload)),
  deleteAccount: async () =>
    unwrap(await apiClient.delete('/users/account')),
  onboarding: async (payload) =>
    unwrap(await apiClient.post('/users/onboarding', payload)),
};

export default usersApi;