import { apiClient } from './client';
import { unwrap } from './helpers';

export const notificationsApi = {
  getAll: async (params = {}) =>
    unwrap(await apiClient.get('/notifications', { params })),

  markRead: async (id) =>
    unwrap(await apiClient.patch(`/notifications/${id}/read`)),

  markAllRead: async () =>
    unwrap(await apiClient.patch('/notifications/read-all')),

  delete: async (id) =>
    unwrap(await apiClient.delete(`/notifications/${id}`)),
};

export default notificationsApi;