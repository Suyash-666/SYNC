// ============================================================================
// src/api/users.api.legacy.js
// Pre-Checkpoint-7 implementation. Talks to the Node backend via axios.
// Selected when the 'crud' feature flag is OFF.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getProfile = async () => unwrap(await apiClient.get('/users/profile'));
export const updateProfile = async (payload) => unwrap(await apiClient.patch('/users/profile', payload));
export const deleteAccount = async () => unwrap(await apiClient.delete('/users/account'));
export const onboarding = async (payload) => unwrap(await apiClient.post('/users/onboarding', payload));

const usersApi = {
  getProfile,
  updateProfile,
  deleteAccount,
  onboarding,
};

export default usersApi;
