import { apiClient } from './client';
import { unwrap } from './helpers';

export const notesApi = {
  getAll: async (params = {}) => unwrap(await apiClient.get('/notes', { params })),
  getById: async (id) => unwrap(await apiClient.get(`/notes/${id}`)),
  create: async (payload) => unwrap(await apiClient.post('/notes', payload)),
  update: async (id, payload) => unwrap(await apiClient.patch(`/notes/${id}`, payload)),
  delete: async (id) => unwrap(await apiClient.delete(`/notes/${id}`)),
  getFolders: async () => unwrap(await apiClient.get('/notes/folders')),
};

// backward-compatibility aliases
notesApi.remove = notesApi.delete;
notesApi.folders = notesApi.getFolders;

export default notesApi;
