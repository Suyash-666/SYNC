import { apiClient } from './client';
import { unwrap } from './helpers';

export const studyRoomsApi = {
  getAll: async (params = {}) =>
    unwrap(await apiClient.get('/study-rooms', { params })),

  getById: async (id) =>
    unwrap(await apiClient.get(`/study-rooms/${id}`)),

  create: async (payload) =>
    unwrap(await apiClient.post('/study-rooms', payload)),

  join: async (id) =>
    unwrap(await apiClient.post(`/study-rooms/${id}/join`)),

  leave: async (id) =>
    unwrap(await apiClient.post(`/study-rooms/${id}/leave`)),

  delete: async (id) =>
    unwrap(await apiClient.delete(`/study-rooms/${id}`)),
};

export default studyRoomsApi;