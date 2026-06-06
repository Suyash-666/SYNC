// ============================================================================
// src/api/notifications.api.legacy.js
// Pre-Checkpoint-4 implementation. Talks to the Node backend via axios.
// Selected when the 'notifications' feature flag is OFF.
//
// Behavior is byte-for-byte identical to the file that lived at
// notifications.api.js before Checkpoint 4.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getAll = async (params = {}) =>
  unwrap(await apiClient.get('/notifications', { params }));

export const markRead = async (id) =>
  unwrap(await apiClient.patch(`/notifications/${id}/read`));

export const markAllRead = async () =>
  unwrap(await apiClient.patch('/notifications/read-all'));

export const remove = async (id) =>
  unwrap(await apiClient.delete(`/notifications/${id}`));

const notificationsApi = {
  getAll,
  markRead,
  markAllRead,
  delete: remove,
  remove,
};

export default notificationsApi;
