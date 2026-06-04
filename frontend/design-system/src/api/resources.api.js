import { apiClient } from './client';
import { unwrap } from './helpers';

export const resourcesApi = {
  getAll: async (params = {}) => unwrap(await apiClient.get('/resources', { params })),
  upload: async ({ file, title, subject_id }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (subject_id) formData.append('subject_id', subject_id);
    return unwrap(await apiClient.post('/resources/upload', formData));
  },
  addLink: async (payload) => unwrap(await apiClient.post('/resources/link', payload)),
  delete: async (id) => unwrap(await apiClient.delete(`/resources/${id}`)),
};

// backward-compatibility aliases
resourcesApi.link = resourcesApi.addLink;
resourcesApi.remove = resourcesApi.delete;

export default resourcesApi;
