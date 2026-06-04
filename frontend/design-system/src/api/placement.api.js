import { apiClient } from './client';
import { unwrap } from './helpers';

export const placementApi = {
  getProgress: async (params = {}) => unwrap(await apiClient.get('/placement/progress', { params })),
  addItem: async (payload) => unwrap(await apiClient.post('/placement/progress', payload)),
  updateItem: async (id, payload) => unwrap(await apiClient.patch(`/placement/progress/${id}`, payload)),
  delete: async (id) => unwrap(await apiClient.delete(`/placement/progress/${id}`)),
  getStats: async () => unwrap(await apiClient.get('/placement/stats')),
  addDsaProblem: async (payload) => unwrap(await apiClient.post('/placement/dsa/problems', payload)),
  getDsaProblems: async (params = {}) => unwrap(await apiClient.get('/placement/dsa/problems', { params })),
};

// backward-compatibility aliases
placementApi.progress = placementApi.getProgress;
placementApi.createProgress = placementApi.addItem;
placementApi.updateProgress = placementApi.updateItem;
placementApi.removeProgress = placementApi.delete;
placementApi.stats = placementApi.getStats;
placementApi.createDsa = placementApi.addDsaProblem;
placementApi.listDsa = placementApi.getDsaProblems;

export default placementApi;
