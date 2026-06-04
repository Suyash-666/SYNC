import { apiClient } from './client';
import { unwrap } from './helpers';

export const assignmentsApi = {
  getAll: async (params = {}) =>
    unwrap(await apiClient.get('/assignments', { params })),

  getById: async (id) =>
    unwrap(await apiClient.get(`/assignments/${id}`)),

  create: async (payload) =>
    unwrap(await apiClient.post('/assignments', payload)),

  update: async (id, payload) =>
    unwrap(await apiClient.patch(`/assignments/${id}`, payload)),

  delete: async (id) =>
    unwrap(await apiClient.delete(`/assignments/${id}`)),

  updateStatus: async (id, payload) =>
    unwrap(await apiClient.patch(`/assignments/${id}/status`, payload)),
};

export default assignmentsApi;