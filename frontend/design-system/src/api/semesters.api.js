import { apiClient } from './client';
import { unwrap } from './helpers';

export const semestersApi = {
  getAll: async () => unwrap(await apiClient.get('/semesters')),
  getById: async (id) => unwrap(await apiClient.get(`/semesters/${id}`)),
  create: async (payload) => unwrap(await apiClient.post('/semesters', payload)),
  update: async (id, payload) => unwrap(await apiClient.patch(`/semesters/${id}`, payload)),
  delete: async (id) => unwrap(await apiClient.delete(`/semesters/${id}`)),
  setCurrent: async (id) => unwrap(await apiClient.patch(`/semesters/${id}/set-current`)),
};

// backward-compatibility alias
semestersApi.remove = semestersApi.delete;

export default semestersApi;
