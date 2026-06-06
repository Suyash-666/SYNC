// ============================================================================
// src/api/placement.api.legacy.js
// Pre-Checkpoint-5f implementation. Talks to the Node backend via axios.
// Selected when the 'crud' feature flag is OFF.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getProgress = async (params = {}) => unwrap(await apiClient.get('/placement/progress', { params }));
export const addItem = async (payload) => unwrap(await apiClient.post('/placement/progress', payload));
export const updateItem = async (id, payload) => unwrap(await apiClient.patch(`/placement/progress/${id}`, payload));
export const remove = async (id) => unwrap(await apiClient.delete(`/placement/progress/${id}`));
export const getStats = async () => unwrap(await apiClient.get('/placement/stats'));
export const addDsaProblem = async (payload) => unwrap(await apiClient.post('/placement/dsa/problems', payload));
export const getDsaProblems = async (params = {}) => unwrap(await apiClient.get('/placement/dsa/problems', { params }));

const placementApi = {
  getProgress,
  progress: getProgress,
  addItem,
  createProgress: addItem,
  updateItem,
  updateProgress: updateItem,
  delete: remove,
  removeProgress: remove,
  getStats,
  stats: getStats,
  addDsaProblem,
  createDsa: addDsaProblem,
  getDsaProblems,
  listDsa: getDsaProblems,
};

export default placementApi;
